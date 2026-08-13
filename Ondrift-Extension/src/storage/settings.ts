import type { ExtensionSettings } from "../shared/types";

export const SETTINGS_STORAGE_KEY = "ondrift.settings";
const STORAGE_KEY = SETTINGS_STORAGE_KEY;
export const DEFAULT_SETTINGS: ExtensionSettings = {
  provider: "gemini",
  apiKeys: {},
  apiModels: {},
  persona: "general",
  language: "en",
  enabledSites: { chatgpt: true, claude: true, gemini: true, perplexity: true },
  onboardingComplete: false,
  saveHistory: true,
  consentGranted: false,
  apiKeyStatus: null,
};

export interface LocalStorageArea {
  get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

function localArea(): LocalStorageArea {
  if (!globalThis.chrome?.storage?.local) throw new Error("chrome.storage.local is unavailable");
  return chrome.storage.local;
}

export class SettingsStore {
  constructor(private readonly area?: LocalStorageArea) {}

  async get(): Promise<ExtensionSettings> {
    const result = await (this.area ?? localArea()).get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] as Partial<ExtensionSettings> | undefined;
    const language = stored?.language;
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...stored?.apiKeys },
      apiModels: { ...DEFAULT_SETTINGS.apiModels, ...stored?.apiModels },
      enabledSites: { ...DEFAULT_SETTINGS.enabledSites, ...stored?.enabledSites },
      language: language === "ko" || language === "en" || language === "ja" || language === "zh" ? language : DEFAULT_SETTINGS.language,
    };
  }

  async update(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const current = await this.get();
    const next: ExtensionSettings = {
      ...current,
      ...patch,
      apiKeys: { ...current.apiKeys, ...patch.apiKeys },
      apiModels: { ...current.apiModels, ...patch.apiModels },
      enabledSites: { ...current.enabledSites, ...patch.enabledSites },
    };
    await (this.area ?? localArea()).set({ [STORAGE_KEY]: next });
    return next;
  }

  async apiKey(provider?: ExtensionSettings["provider"]): Promise<string | undefined> {
    const settings = await this.get();
    return settings.apiKeys[provider ?? settings.provider]?.trim() || undefined;
  }
}

export const settingsStore = new SettingsStore();
