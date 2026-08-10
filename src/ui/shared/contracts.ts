export type ProviderId = 'gemini' | 'openai' | 'claude';
export type SiteId = 'chatgpt' | 'claude';
export type PersonaId = 'general' | 'developer' | 'writer' | 'student' | 'translator';

export interface UiSettings {
  provider: ProviderId;
  apiKeyConfigured: boolean;
  persona: PersonaId;
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
  improvedText: string;
  score: number;
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
  validateApiKey(provider: ProviderId, apiKey: string): Promise<ApiKeyValidationResult>;
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
  siteAccess: { chatgpt: true, claude: true },
  saveHistory: true,
  consentGranted: false,
};

export const AI_STUDIO_API_KEY_URL = 'https://aistudio.google.com/apikey';
