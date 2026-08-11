import type { ProviderId } from "./types";

/**
 * Gemini models Ondrift knows how to call, in preference order. Shared between the
 * provider (as its fallback chain) and the Options UI (as the picker's known choices),
 * so the two never drift apart.
 */
export const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"] as const;
export type GeminiModelId = (typeof GEMINI_MODELS)[number];

export const PROVIDER_MODELS: Partial<Record<ProviderId, readonly string[]>> = {
  gemini: GEMINI_MODELS,
};
