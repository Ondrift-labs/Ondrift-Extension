/**
 * Gemini models Ondrift knows how to call. Shared between the provider and the Options
 * UI so the two never drift apart.
 */

/** Automatic fallback chain the provider tries when no model is explicitly chosen, or
 * when the chosen one is rejected or its quota is exhausted. Deliberately just the
 * flash tiers -- an automatic fallback should get cheaper, not silently upgrade to a
 * pricier model the user didn't ask for. */
export const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"] as const;

/** Full set of models the Options page lets a user pick from, ordered from most capable
 * (and priciest) to cheapest/highest-quota. Picking one always tries it first and still
 * falls back to GEMINI_MODELS if it's unavailable. */
export const GEMINI_MODEL_CHOICES = [
  "gemini-3.6-pro",
  "gemini-3.6-flash",
  "gemini-3.6-flash-lite",
  "gemini-3.5-flash-lite",
] as const;

export type GeminiModelId = (typeof GEMINI_MODEL_CHOICES)[number];
