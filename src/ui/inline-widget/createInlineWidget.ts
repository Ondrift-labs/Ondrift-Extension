import type { LanguageId } from '../../shared/types';
import { inlineMessages, type InlineMessages } from './messages';
import { inlineWidgetStyles } from './styles';
import type { InlineWidgetController, InlineWidgetHandlers, InlineWidgetState } from './types';

type ErrorKind = Extract<InlineWidgetState, { status: 'error' }>['kind'];
/** The subset of `InlineMessages` keys that hold plain strings (excludes `scoreChangeAria`). */
type StringMessageKey = { [K in keyof InlineMessages]: InlineMessages[K] extends string ? K : never }[keyof InlineMessages];

/**
 * Title/detail message keys for each error kind, keyed once instead of as two parallel
 * 7-way ternary chains (which could silently drift out of sync if edited separately).
 * `parse` and `unknown` share the generic "rewrite unavailable" copy, same as before.
 */
const ERROR_COPY: Record<ErrorKind, { title: StringMessageKey; detail: StringMessageKey }> = {
  quota: { title: 'quotaTitle', detail: 'quotaDetail' },
  daily_limit: { title: 'dailyLimitTitle', detail: 'dailyLimitDetail' },
  network: { title: 'networkTitle', detail: 'networkDetail' },
  invalid_key: { title: 'invalidKeyTitle', detail: 'invalidKeyDetail' },
  request: { title: 'requestTitle', detail: 'requestDetail' },
  unavailable: { title: 'unavailableTitle', detail: 'unavailableDetail' },
  parse: { title: 'rewriteUnavailable', detail: 'unknownDetail' },
  unknown: { title: 'rewriteUnavailable', detail: 'unknownDetail' },
};
const MENU_GAP = 6;
const VIEWPORT_MARGIN = 12;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

const icon = (path: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const icons = {
  check: icon('<path d="m5 12 4 4L19 6"/>'),
  close: icon('<path d="m6 6 12 12M18 6 6 18"/>'),
  retry: icon('<path d="M20 7v5h-5M4 17v-5h5M6.1 9a7 7 0 0 1 11.8-2L20 12M4 12l2.1 5a7 7 0 0 0 11.8-2"/>'),
  settings: icon('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 14.8 6l-.3-2.5h-4L10.2 6a7 7 0 0 0-1.7 1.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1.1l.3 2.5h4l.3-2.5a7 7 0 0 0 1.7-1.1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z"/>'),
  spark: icon('<path d="m12 3 1.4 4.1 4.1 1.4-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/>'),
  recenter: icon('<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="3"/>'),
  grip: icon('<path d="M15 15h.01M11 15h.01M15 11h.01"/>'),
};

export function createInlineWidget(handlers: InlineWidgetHandlers): InlineWidgetController {
  const host = document.createElement('aside');
  host.setAttribute('data-ondrift-widget', '');
  const root = host.attachShadow({ mode: 'open' });
  const logoUrl = globalThis.chrome?.runtime?.getURL?.('icons/ondrift-32.png') ?? '/icons/ondrift-32.png';
  root.innerHTML = `<style>${inlineWidgetStyles}</style><section class="od-shell"><svg class="od-trace" aria-hidden="true"><rect pathLength="100"/></svg><header class="od-header"><img class="od-logo" src="${logoUrl}" alt="" /><span class="od-title">Ondrift</span><span class="od-status" data-status></span><button type="button" class="od-icon-button" data-reset hidden>${icons.recenter}</button><button type="button" class="od-icon-button" data-settings aria-haspopup="true" aria-expanded="false">${icons.settings}</button><div class="od-menu od-settings-menu" data-menu hidden><button type="button" class="od-menu-item" data-menu-settings></button><button type="button" class="od-menu-item" data-menu-hide></button></div><div class="od-menu od-expand-menu" data-expand-menu hidden><button type="button" class="od-menu-item" data-expand-item></button></div><button type="button" class="od-icon-button" data-dismiss>${icons.close}</button></header><div class="od-body" data-body aria-live="polite"></div><div class="od-resize-handle" data-resize tabindex="-1">${icons.grip}</div></section>`;
  const shell = root.querySelector<HTMLElement>('.od-shell')!;
  const header = root.querySelector<HTMLElement>('.od-header')!;
  const body = root.querySelector<HTMLElement>('[data-body]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const resetButton = root.querySelector<HTMLButtonElement>('[data-reset]')!;
  const settingsButton = root.querySelector<HTMLButtonElement>('[data-settings]')!;
  const dismissButton = root.querySelector<HTMLButtonElement>('[data-dismiss]')!;
  const resizeHandle = root.querySelector<HTMLElement>('[data-resize]')!;
  const menu = root.querySelector<HTMLElement>('[data-menu]')!;
  const menuOpenSettings = root.querySelector<HTMLButtonElement>('[data-menu-settings]')!;
  const menuHide = root.querySelector<HTMLButtonElement>('[data-menu-hide]')!;
  const expandMenu = root.querySelector<HTMLElement>('[data-expand-menu]')!;
  const expandMenuItem = root.querySelector<HTMLButtonElement>('[data-expand-item]')!;
  let currentState: InlineWidgetState = { status: 'ready' };
  let currentLanguage: LanguageId = 'en';
  let minimized = false;

  // The shell clips overflow for the loading trace/resize handle, but that also cuts off
  // either menu below whenever the widget's own content is short -- lift the clip only
  // while a menu is actually open.
  function syncMenuOpenClass() {
    shell.classList.toggle('od-shell--menu-open', !menu.hidden || !expandMenu.hidden);
  }

  function closeMenu() {
    menu.hidden = true;
    settingsButton.setAttribute('aria-expanded', 'false');
    syncMenuOpenClass();
  }

  function closeExpandMenu() {
    expandMenu.hidden = true;
    syncMenuOpenClass();
  }

  function positionExpandMenu() {
    const anchorRect = header.getBoundingClientRect();
    const width = expandMenu.offsetWidth;
    const height = expandMenu.offsetHeight;
    const left = clamp(
      anchorRect.left + (anchorRect.width - width) / 2,
      VIEWPORT_MARGIN,
      window.innerWidth - width - VIEWPORT_MARGIN,
    );
    const below = anchorRect.bottom + MENU_GAP;
    const above = anchorRect.top - MENU_GAP - height;
    const top = below + height <= window.innerHeight - VIEWPORT_MARGIN ? below : above;
    expandMenu.style.left = `${left}px`;
    expandMenu.style.top = `${clamp(top, VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN)}px`;
  }

  function syncMinimizedAccessibility() {
    if (minimized) {
      header.setAttribute('role', 'button');
      header.tabIndex = 0;
      header.setAttribute('aria-expanded', 'false');
      header.setAttribute('aria-label', inlineMessages[currentLanguage].expand);
      return;
    }
    header.removeAttribute('role');
    header.removeAttribute('tabindex');
    header.removeAttribute('aria-expanded');
    header.removeAttribute('aria-label');
  }

  function setMinimized(next: boolean) {
    if (minimized === next) return;
    minimized = next;
    shell.classList.toggle('od-shell--minimized', minimized);
    syncMinimizedAccessibility();
    closeMenu();
    closeExpandMenu();
    handlers.onMinimizedChange?.(minimized);
  }

  resetButton.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); handlers.onResetPosition?.(); });
  // The gear icon no longer jumps straight to settings -- it opens a small menu instead,
  // since that's also where "Hide" now lives (see setMinimized() above and the menuHide
  // listener below). Settings itself is one click further away via the menu item.
  settingsButton.addEventListener('click', (event) => {
    event.preventDefault(); event.stopPropagation();
    const next = menu.hidden;
    menu.hidden = !next;
    settingsButton.setAttribute('aria-expanded', String(next));
    syncMenuOpenClass();
  });
  menuOpenSettings.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); closeMenu(); handlers.onOpenSettings(); });
  menuHide.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); setMinimized(true); });
  expandMenuItem.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); closeExpandMenu(); setMinimized(false); });
  const onDocumentClick = (event: MouseEvent) => {
    const path = event.composedPath();
    if (!menu.hidden && !path.includes(menu) && !path.includes(settingsButton)) closeMenu();
    if (!expandMenu.hidden && !path.includes(expandMenu)) closeExpandMenu();
  };
  document.addEventListener('click', onDocumentClick);
  header.addEventListener('click', () => {
    if (minimized) setMinimized(false);
  });
  header.addEventListener('keydown', (event) => {
    if (!minimized || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    setMinimized(false);
  });
  // Right-clicking the collapsed bubble remains an optional explicit path to Expand.
  // Normal click and keyboard activation restore it directly; the placement layer uses
  // a movement threshold and suppresses only the synthetic click after an actual drag.
  // Expanded widgets keep the page's native context menu.
  header.addEventListener('contextmenu', (event) => {
    if (!minimized) return;
    event.preventDefault(); event.stopPropagation();
    expandMenu.hidden = false;
    positionExpandMenu();
    syncMenuOpenClass();
  });
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
    resetButton.setAttribute('aria-label', messages.resetPosition);
    resetButton.title = messages.resetPosition;
    resizeHandle.setAttribute('aria-label', messages.resizeHandle);
    resizeHandle.title = messages.resizeHandle;
    menuOpenSettings.textContent = messages.openSettings;
    menuHide.textContent = messages.hide;
    expandMenuItem.textContent = messages.expandAction;
    syncMinimizedAccessibility();
    host.hidden = false;
    shell.classList.toggle('od-shell--loading', state.status === 'loading');
    body.replaceChildren();
    status.textContent = state.status === 'result' || state.status === 'applied' ? `${messages.score} ${state.previousScore} → ${state.score}` : '';
    if (state.status === 'ready') {
      const wrap = document.createElement('div'); wrap.className = 'od-ready';
      // Until the user explicitly requests a rewrite, promptLength stays undefined so the
      // content script never reads draft text merely to render the widget. A concrete short
      // length is supplied only after the user clicks Rewrite and that authorized read finds
      // too little text.
      const isHint = state.promptLength !== undefined && state.promptLength < 12;
      const description = document.createElement('p'); if (isHint) description.className = 'od-hint'; description.textContent = isHint ? messages.shortPrompt : messages.ready;
      const rewrite = button(messages.rewrite, 'od-button', handlers.onRewrite, icons.spark); if (isHint) rewrite.disabled = true;
      wrap.append(description, rewrite); body.append(wrap); return;
    }
    if (state.status === 'loading') {
      body.innerHTML = '<div class="od-loading"><span class="od-spinner"></span><span data-loading></span></div>';
      body.querySelector('[data-loading]')!.textContent = messages.loading; return;
    }
    if (state.status === 'result') {
      const wrap = document.createElement('div');
      const delta = state.score - state.previousScore;
      wrap.innerHTML = `<div class="od-score-row"><div class="od-score-flow"><span class="od-score od-score--original">${Math.round(state.previousScore)}</span><span class="od-score-arrow" aria-hidden="true">→</span><span class="od-score">${Math.round(state.score)}</span><span class="od-score-delta">${delta >= 0 ? '+' : ''}${delta}</span></div><span class="od-score-copy"><strong></strong></span></div><p class="od-rationale"></p><span class="od-preview-label"></span><p class="od-preview"></p><div class="od-actions"></div>`;
      wrap.querySelector<HTMLElement>('.od-score-flow')!.setAttribute('aria-label', messages.scoreChangeAria(state.previousScore, state.score, delta));
      wrap.querySelector<HTMLElement>('.od-score-copy strong')!.textContent = state.score >= 85 ? messages.strong : state.score >= 65 ? messages.foundation : messages.needsDirection;
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
    const needsReload = state.status === 'reload_required';
    const kind: ErrorKind = state.status === 'error' ? state.kind : 'invalid_key';
    const errorCopy = ERROR_COPY[kind];
    const title = needsReload ? messages.reconnectTitle : isMissing ? messages.connectKey : messages[errorCopy.title];
    const detail = needsReload ? messages.reconnectDetail : isMissing ? messages.missingKeyDetail : messages[errorCopy.detail];
    const message = document.createElement('div'); message.className = 'od-message'; message.innerHTML = `<span class="od-message-icon">${isMissing ? icons.settings : icons.retry}</span><div><strong></strong><p></p><div class="od-actions"></div></div>`;
    message.querySelector('strong')!.textContent = title; message.querySelector('p')!.textContent = detail;
    const action = needsReload ? button(messages.reloadPage, 'od-button', handlers.onReloadPage) : isMissing || kind === 'invalid_key' ? button(messages.openSettings, 'od-button', handlers.onOpenSettings) : button(messages.retry, 'od-button', handlers.onRetry, icons.retry);
    message.querySelector('.od-actions')!.append(action); body.append(message);
  }

  render(currentState);
  return {
    element: host,
    dragHandle: header,
    resizeHandle,
    setState: render,
    setLanguage(language) { currentLanguage = language; render(currentState); },
    setRepositioned(repositioned) { resetButton.hidden = !repositioned; },
    // Re-adds the document-level "click outside closes menu" listener `destroy()` removed.
    // Needed after a bfcache restore: the widget itself is a page-lifetime singleton that
    // survives the freeze, but destroy() (called from pagehide teardown) tore this listener
    // down, and re-adding the same function reference is a no-op if it's already attached.
    reattach() { document.addEventListener('click', onDocumentClick); },
    destroy() { document.removeEventListener('click', onDocumentClick); host.remove(); },
  };
}
