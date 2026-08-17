export type ProviderId = 'gemini' | 'openai' | 'claude';
export type SiteId = 'chatgpt' | 'claude' | 'gemini' | 'perplexity';
export type PersonaId = 'general' | 'developer' | 'writer' | 'student' | 'translator';
export type LanguageId = 'ko' | 'en' | 'ja' | 'zh';

export interface UiSettings {
  provider: ProviderId;
  apiKeyConfigured: boolean;
  /** Set from the most recent real use of the key (a rewrite or an explicit verify), so a
   * problem like an exhausted quota shows up as soon as it happens, not just after the
   * user re-verifies the key by hand. Absent when the last use succeeded. */
  apiKeyStatus?: ApiKeyValidationResult['reason'];
  /** User-chosen model override for the active provider (e.g. a cheaper, higher-quota tier). Empty/absent uses Ondrift's default. */
  model?: string;
  persona: PersonaId;
  language: LanguageId;
  siteAccess: Record<SiteId, boolean>;
  saveHistory: boolean;
  consentGranted: boolean;
}

export interface ApiKeyValidationResult {
  ok: boolean;
  reason?: 'invalid_key' | 'quota' | 'network' | 'request' | 'unavailable' | 'unknown';
}

export interface HistoryItem {
  id: string;
  service: SiteId;
  originalText: string;
  improvedText?: string;
  score?: number;
  previousScore?: number;
  applied: boolean;
  createdAt: number;
  sourceUrl?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface UsageSummary {
  rewritesThisWeek: number;
  averageScore: number | null;
  scoreDelta: number | null;
  adoptionRate: number | null;
  totalTokens: number;
  dailyScores: Array<{ date: string; score: number }>;
}

export interface UiBridge {
  getSettings(): Promise<UiSettings>;
  saveSettings(patch: Partial<UiSettings>): Promise<UiSettings>;
  validateApiKey(provider: ProviderId, apiKey: string, model?: string): Promise<ApiKeyValidationResult>;
  /** Clears the saved key for `provider` (and its health status), leaving the provider/model
   * choice untouched so re-adding a key later doesn't lose those preferences. */
  removeApiKey(provider: ProviderId): Promise<UiSettings>;
  openExternal(url: string): Promise<void> | void;
  getHistory(): Promise<HistoryItem[]>;
  deleteHistory(id: string): Promise<void>;
  clearHistory(): Promise<void>;
  openOptions(): Promise<void> | void;
}

export const DEFAULT_SETTINGS: UiSettings = {
  provider: 'gemini',
  apiKeyConfigured: false,
  persona: 'general',
  language: 'en',
  siteAccess: { chatgpt: true, claude: true, gemini: true, perplexity: true },
  saveHistory: true,
  consentGranted: false,
};

export const AI_STUDIO_API_KEY_URL = 'https://aistudio.google.com/apikey';
export const GITHUB_REPO_URL = 'https://github.com/Ondrift-labs/Ondrift-Extension';
export const GITHUB_BUG_REPORT_URL = `${GITHUB_REPO_URL}/issues/new?template=bug_report.yml`;
export const GITHUB_FEATURE_REQUEST_URL = `${GITHUB_REPO_URL}/issues/new?template=feature_request.yml`;
export const GITHUB_DISCUSSIONS_URL = `${GITHUB_REPO_URL}/discussions`;
