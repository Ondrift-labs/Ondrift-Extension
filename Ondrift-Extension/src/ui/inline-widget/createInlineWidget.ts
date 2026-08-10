import type { LanguageId } from '../../shared/types';
import { inlineMessages } from './messages';
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
  const root = host.attachShadow({ mode: 'open' });
  const logoUrl = globalThis.chrome?.runtime?.getURL?.('icons/ondrift-32.png') ?? '/icons/ondrift-32.png';
  root.innerHTML = `<style>${inlineWidgetStyles}</style><section class="od-shell"><header class="od-header"><img class="od-logo" src="${logoUrl}" alt="" /><span class="od-title">Ondrift</span><span class="od-status" data-status></span><button type="button" class="od-icon-button" data-settings>${icons.settings}</button><button type="button" class="od-icon-button" data-dismiss>${icons.close}</button></header><div class="od-body" data-body aria-live="polite"></div></section>`;
  const body = root.querySelector<HTMLElement>('[data-body]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const settingsButton = root.querySelector<HTMLButtonElement>('[data-settings]')!;
  const dismissButton = root.querySelector<HTMLButtonElement>('[data-dismiss]')!;
  let currentState: InlineWidgetState = { status: 'ready', promptLength: 0 };
  let currentLanguage: LanguageId = 'en';

  settingsButton.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); handlers.onOpenSettings(); });
  dismissButton.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); host.hidden = true; handlers.onDismiss?.(); });

  function button(label: string, className: string, action: () => void, iconMarkup = '') {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = className;
    element.innerHTML = `${iconMarkup}<span></span>`;
    element.querySelector('span')!.textContent = label;
    element.addEventListener('click', action);
    return element;
  }

  function render(state: InlineWidgetState) {
    currentState = state;
    const messages = inlineMessages[currentLanguage];
    host.lang = currentLanguage;
    host.setAttribute('aria-label', messages.ariaLabel);
    settingsButton.setAttribute('aria-label', messages.settings);
    dismissButton.setAttribute('aria-label', messages.dismiss);
    host.hidden = false;
    body.replaceChildren();
    status.textContent = state.status === 'result' || state.status === 'applied' ? `${messages.score} ${state.score}` : '';
    if (state.status === 'ready') {
      const wrap = document.createElement('div'); wrap.className = 'od-ready';
      const description = document.createElement('p'); description.textContent = state.promptLength < 12 ? messages.shortPrompt : messages.ready;
      const rewrite = button(messages.rewrite, 'od-button', handlers.onRewrite, icons.spark); if (state.promptLength < 12) rewrite.disabled = true;
      wrap.append(description, rewrite); body.append(wrap); return;
    }
    if (state.status === 'loading') {
      body.innerHTML = '<div class="od-loading"><span class="od-spinner"></span><span data-loading></span></div>';
      body.querySelector('[data-loading]')!.textContent = messages.loading; return;
    }
    if (state.status === 'result') {
      const wrap = document.createElement('div');
      const delta = state.previousScore === undefined ? '' : `${state.score - state.previousScore >= 0 ? '+' : ''}${state.score - state.previousScore} ${messages.points}`;
      wrap.innerHTML = `<div class="od-score-row"><span class="od-score">${Math.round(state.score)}</span><span class="od-score-copy"><strong></strong><span></span></span></div><p class="od-rationale"></p><span class="od-preview-label"></span><p class="od-preview"></p><div class="od-actions"></div>`;
      wrap.querySelector<HTMLElement>('.od-score-copy strong')!.textContent = state.score >= 85 ? messages.strong : state.score >= 65 ? messages.foundation : messages.needsDirection;
      wrap.querySelector<HTMLElement>('.od-score-copy span')!.textContent = delta;
      wrap.querySelector<HTMLElement>('.od-rationale')!.textContent = state.rationale;
      wrap.querySelector<HTMLElement>('.od-preview-label')!.textContent = messages.suggested;
      wrap.querySelector<HTMLElement>('.od-preview')!.textContent = state.improvedText;
      const actions = wrap.querySelector<HTMLElement>('.od-actions')!;
      actions.append(button(messages.retry, 'od-button od-button--secondary', handlers.onRetry, icons.retry), button(messages.apply, 'od-button', () => handlers.onApply(state.improvedText), icons.check));
      body.append(wrap); return;
    }
    if (state.status === 'applied') {
      body.innerHTML = `<div class="od-applied">${icons.check}<span></span></div>`;
      body.querySelector('.od-applied span')!.textContent = messages.applied; return;
    }
    const isMissing = state.status === 'missing_key';
    const kind = state.status === 'error' ? state.kind : 'invalid_key';
    const title = isMissing ? messages.connectKey : kind === 'quota' ? messages.quotaTitle : kind === 'network' ? messages.networkTitle : kind === 'invalid_key' ? messages.invalidKeyTitle : kind === 'request' ? messages.requestTitle : kind === 'unavailable' ? messages.unavailableTitle : messages.rewriteUnavailable;
    const localizedDetail = isMissing ? messages.missingKeyDetail : kind === 'quota' ? messages.quotaDetail : kind === 'network' ? messages.networkDetail : kind === 'invalid_key' ? messages.invalidKeyDetail : kind === 'request' ? messages.requestDetail : kind === 'unavailable' ? messages.unavailableDetail : messages.unknownDetail;
    const detail = localizedDetail;
    const message = document.createElement('div'); message.className = 'od-message'; message.innerHTML = `<span class="od-message-icon">${isMissing ? icons.settings : icons.retry}</span><div><strong></strong><p></p><div class="od-actions"></div></div>`;
    message.querySelector('strong')!.textContent = title; message.querySelector('p')!.textContent = detail;
    const action = isMissing || kind === 'invalid_key' ? button(messages.openSettings, 'od-button', handlers.onOpenSettings) : button(messages.retry, 'od-button', handlers.onRetry, icons.retry);
    message.querySelector('.od-actions')!.append(action); body.append(message);
  }

  render(currentState);
  return {
    element: host,
    setState: render,
    setLanguage(language) { currentLanguage = language; render(currentState); },
    destroy() { host.remove(); },
  };
}
