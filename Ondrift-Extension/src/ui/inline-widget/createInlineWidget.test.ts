import { describe, expect, it, vi } from 'vitest';
import { createInlineWidget } from './createInlineWidget';

describe('createInlineWidget', () => {
  const handlers = () => ({ onRewrite: vi.fn(), onApply: vi.fn(), onRetry: vi.fn(), onOpenSettings: vi.fn(), onReloadPage: vi.fn() });

  it('starts ready to rewrite without requiring a pre-read prompt length', () => {
    const onRewrite = vi.fn();
    const widget = createInlineWidget({ ...handlers(), onRewrite });
    const rewrite = widget.element.shadowRoot?.querySelector<HTMLButtonElement>('.od-button');

    expect(rewrite).toBeEnabled();
    rewrite?.click();
    expect(onRewrite).toHaveBeenCalledOnce();
  });

  it('emits rewrite and apply actions', () => {
    const onRewrite = vi.fn();
    const onApply = vi.fn();
    const widget = createInlineWidget({ ...handlers(), onRewrite, onApply });
    widget.setState({ status: 'ready', promptLength: 80 });
    widget.element.shadowRoot?.querySelector<HTMLButtonElement>('.od-button')?.click();
    expect(onRewrite).toHaveBeenCalledOnce();

    widget.setState({ status: 'result', score: 88, previousScore: 54, rationale: 'Adds constraints.', improvedText: 'Return three concise options.' });
    expect(widget.element.shadowRoot?.textContent).toContain('54→88+34');
    expect(widget.element.shadowRoot?.querySelector('.od-score-flow')).toHaveAttribute('aria-label', 'Original score 54, improved score 88, 34 points higher');
    const buttons = widget.element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.od-actions .od-button');
    buttons?.[1]?.click();
    expect(onApply).toHaveBeenCalledWith('Return three concise options.');
  });

  it('disables rewriting until the prompt is long enough', () => {
    const onRewrite = vi.fn();
    const widget = createInlineWidget({ ...handlers(), onRewrite });
    widget.setState({ status: 'ready', promptLength: 11 });
    const rewrite = widget.element.shadowRoot?.querySelector<HTMLButtonElement>('.od-button');

    expect(rewrite).toBeDisabled();
    rewrite?.click();
    expect(onRewrite).not.toHaveBeenCalled();
  });

  it('keeps the short-prompt hint on one line, unlike the regular ready copy', () => {
    const widget = createInlineWidget(handlers());

    widget.setState({ status: 'ready', promptLength: 11 });
    expect(widget.element.shadowRoot?.querySelector('.od-ready p')).toHaveClass('od-hint');

    widget.setState({ status: 'ready', promptLength: 80 });
    expect(widget.element.shadowRoot?.querySelector('.od-ready p')).not.toHaveClass('od-hint');
  });

  it('renders provider text as text, not executable markup', () => {
    const widget = createInlineWidget(handlers());
    widget.setState({ status: 'result', score: 40, previousScore: 20, rationale: '<img src=x>', improvedText: '<script>bad()</script>' });
    expect(widget.element.shadowRoot?.querySelector('.od-preview')?.textContent).toBe('<script>bad()</script>');
    expect(widget.element.shadowRoot?.querySelector('script')).toBeNull();
    expect(widget.element.shadowRoot?.querySelector('.od-preview img')).toBeNull();
    expect(widget.element.shadowRoot?.querySelector<HTMLImageElement>('.od-logo')?.src).toContain('/icons/ondrift-32.png');
  });

  it('keeps runtime error details localized instead of exposing English internals', () => {
    const widget = createInlineWidget(handlers());
    widget.setLanguage('ko');
    widget.setState({ status: 'error', kind: 'unknown', message: 'The site did not accept the rewritten prompt.' });

    expect(widget.element.shadowRoot?.textContent).toContain('프롬프트는 변경되지 않았습니다.');
    expect(widget.element.shadowRoot?.textContent).not.toContain('The site did not accept');
  });

  it('routes missing-key users to settings', () => {
    const onOpenSettings = vi.fn();
    const widget = createInlineWidget({ ...handlers(), onOpenSettings });
    widget.setState({ status: 'missing_key' });
    widget.element.shadowRoot?.querySelector<HTMLButtonElement>('.od-actions button')?.click();
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it('opens a menu from the settings icon instead of navigating straight to settings', () => {
    const onOpenSettings = vi.fn();
    const onDismiss = vi.fn();
    const widget = createInlineWidget({ ...handlers(), onOpenSettings, onDismiss });
    const root = widget.element.shadowRoot;
    if (!root) throw new Error('Widget shadow root is missing.');
    const settings = root.querySelector<HTMLButtonElement>('[data-settings]');
    const menu = root.querySelector<HTMLElement>('[data-menu]');
    const dismiss = root.querySelector<HTMLButtonElement>('[data-dismiss]');

    expect(settings?.type).toBe('button');
    expect(menu?.hidden).toBe(true);
    settings?.click();
    expect(menu?.hidden).toBe(false);
    expect(onOpenSettings).not.toHaveBeenCalled();

    root.querySelector<HTMLButtonElement>('[data-menu-settings]')?.click();
    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(menu?.hidden).toBe(true);

    dismiss?.click();
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(widget.element.hidden).toBe(true);
    expect(root.querySelector('style')?.textContent).toContain(':host([hidden])');
  });

  it('minimizes to an accessible button and restores on click', () => {
    const onMinimizedChange = vi.fn();
    const widget = createInlineWidget({ ...handlers(), onMinimizedChange });
    const root = widget.element.shadowRoot;
    if (!root) throw new Error('Widget shadow root is missing.');
    const shell = root.querySelector('.od-shell');
    const header = root.querySelector<HTMLElement>('.od-header');

    root.querySelector<HTMLButtonElement>('[data-settings]')?.click();
    root.querySelector<HTMLButtonElement>('[data-menu-hide]')?.click();
    expect(shell).toHaveClass('od-shell--minimized');
    expect(onMinimizedChange).toHaveBeenLastCalledWith(true);
    expect(header).toHaveAttribute('role', 'button');
    expect(header).toHaveAttribute('tabindex', '0');
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(header).toHaveAttribute('aria-label', 'Expand Ondrift');

    // A prompt edit while minimized re-renders the widget's body -- it must not undo the
    // collapsed state (that was the original bug with the plain dismiss button).
    widget.setState({ status: 'ready', promptLength: 40 });
    expect(shell).toHaveClass('od-shell--minimized');

    header?.click();
    expect(shell).not.toHaveClass('od-shell--minimized');
    expect(onMinimizedChange).toHaveBeenLastCalledWith(false);
    expect(header).not.toHaveAttribute('role');
    expect(header).not.toHaveAttribute('tabindex');
    expect(header).not.toHaveAttribute('aria-expanded');
    expect(header).not.toHaveAttribute('aria-label');
  });

  it('offers an explicit "Expand" item on right-click while minimized, and leaves the native menu alone otherwise', () => {
    const widget = createInlineWidget(handlers());
    const root = widget.element.shadowRoot;
    if (!root) throw new Error('Widget shadow root is missing.');
    const header = root.querySelector<HTMLElement>('.od-header');
    const expandMenu = root.querySelector<HTMLElement>('[data-expand-menu]');
    const contextmenu = () => header!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, composed: true }));

    expect(contextmenu()).toBe(true); // not prevented -- widget is expanded, browser menu still shows
    expect(expandMenu?.hidden).toBe(true);

    root.querySelector<HTMLButtonElement>('[data-settings]')?.click();
    root.querySelector<HTMLButtonElement>('[data-menu-hide]')?.click();
    expect(contextmenu()).toBe(false); // prevented -- Ondrift's own menu takes over instead
    expect(expandMenu?.hidden).toBe(false);

    root.querySelector<HTMLButtonElement>('[data-expand-item]')?.click();
    expect(root.querySelector('.od-shell')).not.toHaveClass('od-shell--minimized');
    expect(expandMenu?.hidden).toBe(true);
  });

  it('flips and clamps the minimized expand menu inside the viewport', () => {
    const widget = createInlineWidget(handlers());
    const root = widget.element.shadowRoot;
    if (!root) throw new Error('Widget shadow root is missing.');
    const header = root.querySelector<HTMLElement>('.od-header')!;
    const expandMenu = root.querySelector<HTMLElement>('[data-expand-menu]')!;
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({
      top: 750, right: 54, bottom: 792, left: 12, width: 42, height: 42,
      x: 12, y: 750, toJSON: () => undefined,
    });
    Object.defineProperty(expandMenu, 'offsetWidth', { configurable: true, value: 132 });
    Object.defineProperty(expandMenu, 'offsetHeight', { configurable: true, value: 42 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });

    root.querySelector<HTMLButtonElement>('[data-settings]')?.click();
    root.querySelector<HTMLButtonElement>('[data-menu-hide]')?.click();
    header.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, composed: true }));

    expect(expandMenu.hidden).toBe(false);
    expect(expandMenu.style.left).toBe('12px');
    expect(expandMenu.style.top).toBe('702px');
  });

  it.each(['Enter', ' '])('restores a minimized widget with the %s key', (key) => {
    const onMinimizedChange = vi.fn();
    const widget = createInlineWidget({ ...handlers(), onMinimizedChange });
    const root = widget.element.shadowRoot;
    if (!root) throw new Error('Widget shadow root is missing.');
    const header = root.querySelector<HTMLElement>('.od-header')!;

    root.querySelector<HTMLButtonElement>('[data-settings]')?.click();
    root.querySelector<HTMLButtonElement>('[data-menu-hide]')?.click();
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    header.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(root.querySelector('.od-shell')).not.toHaveClass('od-shell--minimized');
    expect(onMinimizedChange).toHaveBeenLastCalledWith(false);
  });

  it('switches the inline interface between Korean, English, Japanese, and Simplified Chinese', () => {
    const widget = createInlineWidget(handlers());

    widget.setLanguage('ko');
    expect(widget.element.shadowRoot?.textContent).toContain('개선 및 점수 확인');
    widget.setLanguage('ja');
    expect(widget.element.shadowRoot?.textContent).toContain('改善して採点');
    widget.setLanguage('en');
    expect(widget.element.shadowRoot?.textContent).toContain('Rewrite & score');
    widget.setLanguage('zh');
    expect(widget.element.shadowRoot?.textContent).toContain('优化并评分');
  });

  it('hides the reset-position button until the placement reports a drag, then wires its click', () => {
    const onResetPosition = vi.fn();
    const widget = createInlineWidget({ ...handlers(), onResetPosition });
    const root = widget.element.shadowRoot;
    if (!root) throw new Error('Widget shadow root is missing.');
    const reset = root.querySelector<HTMLButtonElement>('[data-reset]');

    expect(reset?.hidden).toBe(true);
    widget.setRepositioned(true);
    expect(reset?.hidden).toBe(false);
    reset?.click();
    expect(onResetPosition).toHaveBeenCalledOnce();

    widget.setRepositioned(false);
    expect(reset?.hidden).toBe(true);
  });

  it('exposes the header as a drag handle', () => {
    const widget = createInlineWidget(handlers());
    expect(widget.dragHandle).toBe(widget.element.shadowRoot?.querySelector('.od-header'));
  });

  it('exposes a corner grip as a resize handle', () => {
    const widget = createInlineWidget(handlers());
    expect(widget.resizeHandle).toBe(widget.element.shadowRoot?.querySelector('[data-resize]'));
  });

  it('offers a one-click page reload when the extension context is disconnected', () => {
    const onReloadPage = vi.fn();
    const widget = createInlineWidget({ ...handlers(), onReloadPage });

    widget.setLanguage('en');
    widget.setState({ status: 'reload_required' });
    const action = widget.element.shadowRoot?.querySelector<HTMLButtonElement>('.od-actions button');

    expect(widget.element.shadowRoot?.textContent).toContain('Reconnect Ondrift');
    expect(action?.textContent).toContain('Reload page');
    action?.click();
    expect(onReloadPage).toHaveBeenCalledOnce();
  });
});
