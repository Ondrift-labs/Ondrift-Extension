import type { LanguageId } from '../../shared/types';

export type InlineWidgetState =
  | { status: 'ready'; promptLength: number }
  | { status: 'loading' }
  | { status: 'result'; score: number; previousScore: number; rationale: string; improvedText: string }
  | { status: 'applied'; score: number; previousScore: number; improvedText: string }
  | { status: 'missing_key' }
  | { status: 'reload_required' }
  | { status: 'error'; kind: 'quota' | 'network' | 'invalid_key' | 'request' | 'unavailable' | 'parse' | 'unknown'; message?: string };

export interface InlineWidgetHandlers {
  onRewrite(): void;
  onApply(improvedText: string): void;
  onRetry(): void;
  onOpenSettings(): void;
  onReloadPage(): void;
  onDismiss?(): void;
  onResetPosition?(): void;
}

export interface InlineWidgetController {
  element: HTMLElement;
  /** The header inside the shadow root, exposed so a fixed-position placement (see
   * floating-widget-position.ts) can use it as a drag handle. Unused when the widget
   * is placed in normal document flow. */
  dragHandle: HTMLElement;
  setState(state: InlineWidgetState): void;
  setLanguage(language: LanguageId): void;
  /** Shows or hides the header's "reset position" button. A placement strategy that
   * supports dragging calls this once the widget has been moved away from its
   * auto-computed spot, and again with `false` after it snaps back. */
  setRepositioned(repositioned: boolean): void;
  destroy(): void;
}
