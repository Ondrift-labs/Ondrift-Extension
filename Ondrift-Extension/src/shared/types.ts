export type SiteId = "chatgpt" | "claude" | "gemini" | "perplexity";
export type ProviderId = "gemini" | "openai" | "claude";
export type LanguageId = "ko" | "en" | "ja";

export interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface RewriteResult {
  improvedText: string;
  score: number;
  rationale: string;
  usageMetadata?: UsageMetadata;
}

export interface RewriteRequest {
  prompt: string;
  persona?: string;
  service: SiteId;
  language?: LanguageId;
  /** User-chosen model override (e.g. a cheaper, higher-quota tier). Falls back to the provider's defaults when unset. */
  model?: string;
}

export type ProviderErrorCode =
  | "invalid_key"
  | "quota_exceeded"
  | "network"
  | "request_rejected"
  | "model_unavailable"
  | "service_unavailable"
  | "invalid_response"
  | "not_configured"
  | "unknown";

export interface SerializedProviderError {
  code: ProviderErrorCode;
  message: string;
  retryable: boolean;
}

export interface ExtensionSettings {
  provider: ProviderId;
  apiKeys: Partial<Record<ProviderId, string>>;
  /** User-chosen model override per provider, e.g. a cheaper/higher-quota tier. */
  apiModels: Partial<Record<ProviderId, string>>;
  persona: string;
  language: LanguageId;
  enabledSites: Record<SiteId, boolean>;
  onboardingComplete: boolean;
  saveHistory: boolean;
  consentGranted: boolean;
  /**
   * Provider error code from the most recent use of the active API key (a rewrite or an
   * explicit verify), so the Options page can show e.g. a quota warning as soon as it
   * happens instead of only after the user re-verifies the key. Null once a use succeeds.
   */
  apiKeyStatus: ProviderErrorCode | null;
}

export interface HistoryEntry {
  id?: number;
  service: SiteId;
  sourceUrl: string;
  originalText: string;
  improvedText?: string;
  score?: number;
  rationale?: string;
  applied: boolean;
  createdAt: number;
  usageMetadata?: UsageMetadata;
}

export interface HistoryQuery {
  search?: string;
  service?: SiteId;
  limit?: number;
  offset?: number;
}

export interface HistoryAggregates {
  totalPrompts: number;
  rewritesApplied: number;
  adoptionRate: number;
  averageScore: number | null;
  totalTokens: number;
  byService: Record<SiteId, number>;
}

export type RuntimeRequest =
  | { type: "rewrite"; payload: RewriteRequest }
  | { type: "validate_api_key"; payload: { provider: ProviderId; apiKey?: string; model?: string } }
  | { type: "settings_get" }
  | { type: "settings_set"; payload: Partial<ExtensionSettings> }
  | { type: "history_add"; payload: HistoryEntry }
  | { type: "history_list"; payload?: HistoryQuery }
  | { type: "history_delete"; payload: { id: number } }
  | { type: "history_clear" }
  | { type: "history_aggregates" }
  | { type: "open_options" };

export type RuntimeResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: SerializedProviderError };
