import { describe, expect, it, vi } from 'vitest';
import { createInlineWidget } from './createInlineWidget';

describe('createInlineWidget', () => {
  it('emits rewrite and apply actions', () => {
    const onRewrite = vi.fn();
    const onApply = vi.fn();
    const widget = createInlineWidget({ onRewrite, onApply, onRetry: vi.fn(), onOpenSettings: vi.fn() });
    widget.setState({ status: 'ready', promptLength: 80 });
    widget.element.shadowRoot?.querySelector<HTMLButtonElement>('.od-button')?.click();
    expect(onRewrite).toHaveBeenCalledOnce();

    widget.setState({ status: 'result', score: 88, previousScore: 54, rationale: 'Adds constraints.', improvedText: 'Return three concise options.' });
    const buttons = widget.element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.od-actions .od-button');
    buttons?.[1]?.click();
    expect(onApply).toHaveBeenCalledWith('Return three concise options.');
  });

  it('disables rewriting until the prompt is long enough', () => {
    const onRewrite = vi.fn();
    const widget = createInlineWidget({ onRewrite, onApply: vi.fn(), onRetry: vi.fn(), onOpenSettings: vi.fn() });
    widget.setState({ status: 'ready', promptLength: 11 });
    const rewrite = widget.element.shadowRoot?.querySelector<HTMLButtonElement>('.od-button');

    expect(rewrite).toBeDisabled();
    rewrite?.click();
    expect(onRewrite).not.toHaveBeenCalled();
  });

  it('renders provider text as text, not executable markup', () => {
    const widget = createInlineWidget({ onRewrite: vi.fn(), onApply: vi.fn(), onRetry: vi.fn(), onOpenSettings: vi.fn() });
    widget.setState({ status: 'result', score: 40, rationale: '<img src=x>', improvedText: '<script>bad()</script>' });
    expect(widget.element.shadowRoot?.querySelector('.od-preview')?.textContent).toBe('<script>bad()</script>');
    expect(widget.element.shadowRoot?.querySelector('script')).toBeNull();
    expect(widget.element.shadowRoot?.querySelector('img')).toBeNull();
  });

  it('keeps runtime error details localized instead of exposing English internals', () => {
    const widget = createInlineWidget({ onRewrite: vi.fn(), onApply: vi.fn(), onRetry: vi.fn(), onOpenSettings: vi.fn() });
    widget.setLanguage('ko');
    widget.setState({ status: 'error', kind: 'unknown', message: 'The site did not accept the rewritten prompt.' });

    expect(widget.element.shadowRoot?.textContent).toContain('프롬프트는 변경되지 않았습니다.');
    expect(widget.element.shadowRoot?.textContent).not.toContain('The site did not accept');
  });

  it('routes missing-key users to settings', () => {
    const onOpenSettings = vi.fn();
    const widget = createInlineWidget({ onRewrite: vi.fn(), onApply: vi.fn(), onRetry: vi.fn(), onOpenSettings });
    widget.setState({ status: 'missing_key' });
    widget.element.shadowRoot?.querySelector<HTMLButtonElement>('.od-actions button')?.click();
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it('runs header settings and dismiss actions without submitting the host page', () => {
    const onOpenSettings = vi.fn();
    const onDismiss = vi.fn();
    const widget = createInlineWidget({ onRewrite: vi.fn(), onApply: vi.fn(), onRetry: vi.fn(), onOpenSettings, onDismiss });
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

  it('switches the inline interface between Korean, English, and Japanese', () => {
    const widget = createInlineWidget({ onRewrite: vi.fn(), onApply: vi.fn(), onRetry: vi.fn(), onOpenSettings: vi.fn() });

    widget.setLanguage('ko');
    expect(widget.element.shadowRoot?.textContent).toContain('개선 및 점수 확인');
    widget.setLanguage('ja');
    expect(widget.element.shadowRoot?.textContent).toContain('改善して採点');
    widget.setLanguage('en');
    expect(widget.element.shadowRoot?.textContent).toContain('Rewrite & score');
  });
});
