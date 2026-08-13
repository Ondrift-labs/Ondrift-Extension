import { describe, expect, it, vi } from 'vitest';
import { createInlineWidget } from './createInlineWidget';

describe('createInlineWidget', () => {
  const handlers = () => ({ onRewrite: vi.fn(), onApply: vi.fn(), onRetry: vi.fn(), onOpenSettings: vi.fn(), onReloadPage: vi.fn() });

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

  it('runs header settings and dismiss actions without submitting the host page', () => {
    const onOpenSettings = vi.fn();
    const onDismiss = vi.fn();
    const widget = createInlineWidget({ ...handlers(), onOpenSettings, onDismiss });
    const root = widget.element.shadowRoot;
    if (!root) throw new Error('Widget shadow root is missing.');
    const settings = root.querySelector<HTMLButtonElement>('[data-settings]');
    const dismiss = root.querySelector<HTMLButtonElement>('[data-dismiss]');

    expect(settings?.type).toBe('button');
    settings?.click();
    dismiss?.click();

    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(widget.element.hidden).toBe(true);
    expect(root.querySelector('style')?.textContent).toContain(':host([hidden])');
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
