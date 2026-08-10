export type InlineWidgetState =
  | { status: 'ready'; promptLength: number }
  | { status: 'loading' }
  | { status: 'result'; score: number; previousScore?: number; rationale: string; improvedText: string }
  | { status: 'applied'; score: number; improvedText: string }
  | { status: 'missing_key' }
  | { status: 'error'; kind: 'quota' | 'network' | 'invalid_key' | 'request' | 'unavailable' | 'parse' | 'unknown'; message?: string };

export interface InlineWidgetHandlers {
  onRewrite(): void;
  onApply(improvedText: string): void;
  onRetry(): void;
  onOpenSettings(): void;
  onDismiss?(): void;
}

export interface InlineWidgetController {
  element: HTMLElement;
  setState(state: InlineWidgetState): void;
  destroy(): void;
}
