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
}

export interface InlineWidgetController {
  element: HTMLElement;
  setState(state: InlineWidgetState): void;
  setLanguage(language: LanguageId): void;
  destroy(): void;
}
