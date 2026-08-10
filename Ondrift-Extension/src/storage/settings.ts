import type { ExtensionSettings } from "../shared/types";

const STORAGE_KEY = "ondrift.settings";
export const DEFAULT_SETTINGS: ExtensionSettings = {
  provider: "gemini",
  apiKeys: {},
  persona: "general",
  language: "en",
  enabledSites: { chatgpt: true, claude: true, gemini: true, perplexity: true },
  onboardingComplete: false,
  saveHistory: true,
  consentGranted: false,
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
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...stored?.apiKeys },
      enabledSites: { ...DEFAULT_SETTINGS.enabledSites, ...stored?.enabledSites },
    };
  }

  async update(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const current = await this.get();
    const next: ExtensionSettings = {
      ...current,
      ...patch,
      apiKeys: { ...current.apiKeys, ...patch.apiKeys },
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
