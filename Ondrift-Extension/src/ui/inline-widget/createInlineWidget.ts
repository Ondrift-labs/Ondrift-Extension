import { inlineWidgetStyles } from './styles';
import type { InlineWidgetController, InlineWidgetHandlers, InlineWidgetState } from './types';

const icon = (path: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const icons = {
  check: icon('<path d="m5 12 4 4L19 6"/>'),
  close: icon('<path d="m6 6 12 12M18 6 6 18"/>'),
  retry: icon('<path d="M20 7v5h-5M4 17v-5h5M6.1 9a7 7 0 0 1 11.8-2L20 12M4 12l2.1 5a7 7 0 0 0 11.8-2"/>'),
  settings: icon('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 14.8 6l-.3-2.5h-4L10.2 6a7 7 0 0 0-1.7 1.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1.1l.3 2.5h4l.3-2.5a7 7 0 0 0 1.7-1.1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z"/>'),
  spark: icon('<path d="m12 3 1.4 4.1 4.1 1.4-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/>'),
};

export function createInlineWidget(handlers: InlineWidgetHandlers): InlineWidgetController {
  const host = document.createElement('aside');
  host.setAttribute('data-ondrift-widget', '');
  host.setAttribute('aria-label', 'Ondrift prompt rewrite');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${inlineWidgetStyles}</style><section class="od-shell"><header class="od-header"><span class="od-mark">O</span><span class="od-title">Ondrift</span><span class="od-status" data-status></span><button class="od-icon-button" data-settings aria-label="Open Ondrift settings">${icons.settings}</button><button class="od-icon-button" data-dismiss aria-label="Dismiss Ondrift">${icons.close}</button></header><div class="od-body" data-body aria-live="polite"></div></section>`;
  const body = root.querySelector<HTMLElement>('[data-body]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  let currentState: InlineWidgetState = { status: 'ready', promptLength: 0 };

  root.querySelector('[data-settings]')?.addEventListener('click', handlers.onOpenSettings);
  root.querySelector('[data-dismiss]')?.addEventListener('click', () => { host.hidden = true; handlers.onDismiss?.(); });

  function button(label: string, className: string, action: () => void, iconMarkup = '') {
    const element = document.createElement('button');
    element.className = className;
    element.innerHTML = `${iconMarkup}<span>${label}</span>`;
    element.addEventListener('click', action);
    return element;
  }

  function render(state: InlineWidgetState) {
    currentState = state;
    host.hidden = false;
    body.replaceChildren();
    status.textContent = state.status === 'result' || state.status === 'applied' ? `Score ${state.score}` : '';
    if (state.status === 'ready') {
      const wrap = document.createElement('div'); wrap.className = 'od-ready';
      const copy = document.createElement('p'); copy.textContent = state.promptLength < 12 ? 'Add a little more detail to make the rewrite useful.' : 'Ready to score clarity, context, and constraints.';
      const rewrite = button('Rewrite & score', 'od-button', handlers.onRewrite, icons.spark); if (state.promptLength < 12) rewrite.setAttribute('disabled', '');
      wrap.append(copy, rewrite); body.append(wrap); return;
    }
    if (state.status === 'loading') { body.innerHTML = '<div class="od-loading"><span class="od-spinner"></span><span>Reading for intent, context, and useful constraints…</span></div>'; return; }
    if (state.status === 'result') {
      const wrap = document.createElement('div');
      const delta = state.previousScore === undefined ? '' : `${state.score - state.previousScore >= 0 ? '+' : ''}${state.score - state.previousScore} points`;
      wrap.innerHTML = `<div class="od-score-row"><span class="od-score">${Math.round(state.score)}</span><span class="od-score-copy"><strong>${state.score >= 85 ? 'Strong and specific' : state.score >= 65 ? 'Clear foundation' : 'Needs more direction'}</strong><span>${delta}</span></span></div><p class="od-rationale"></p><span class="od-preview-label">Suggested rewrite</span><p class="od-preview"></p><div class="od-actions"></div>`;
      wrap.querySelector<HTMLElement>('.od-rationale')!.textContent = state.rationale;
      wrap.querySelector<HTMLElement>('.od-preview')!.textContent = state.improvedText;
      const actions = wrap.querySelector<HTMLElement>('.od-actions')!;
      actions.append(button('Try again', 'od-button od-button--secondary', handlers.onRetry, icons.retry), button('Apply to prompt', 'od-button', () => handlers.onApply(state.improvedText), icons.check));
      body.append(wrap); return;
    }
    if (state.status === 'applied') { body.innerHTML = `<div class="od-applied">${icons.check}<span>Applied. You can keep editing before you send.</span></div>`; return; }
    const isMissing = state.status === 'missing_key';
    const kind = state.status === 'error' ? state.kind : 'invalid_key';
    const title = isMissing ? 'Connect an API key first' : kind === 'quota' ? 'Gemini quota reached' : kind === 'network' ? 'Connection interrupted' : kind === 'invalid_key' ? 'API key needs attention' : 'Rewrite unavailable';
    const detail = isMissing ? 'Setup takes about a minute and your key stays in this browser.' : state.status === 'error' && state.message ? state.message : kind === 'quota' ? 'Your provider limit is exhausted for now. Try again after it resets.' : kind === 'network' ? 'Your prompt was not changed. Check your connection and retry.' : kind === 'invalid_key' ? 'Verify or replace the key in Ondrift settings.' : 'Your prompt was not changed. Please try again.';
    const message = document.createElement('div'); message.className = 'od-message'; message.innerHTML = `<span class="od-message-icon">${isMissing ? icons.settings : icons.retry}</span><div><strong></strong><p></p><div class="od-actions"></div></div>`;
    message.querySelector('strong')!.textContent = title; message.querySelector('p')!.textContent = detail;
    const action = isMissing || kind === 'invalid_key' ? button('Open settings', 'od-button', handlers.onOpenSettings) : button('Try again', 'od-button', handlers.onRetry, icons.retry);
    message.querySelector('.od-actions')!.append(action); body.append(message);
  }

  render(currentState);
  return { element: host, setState: render, destroy() { host.remove(); } };
}
