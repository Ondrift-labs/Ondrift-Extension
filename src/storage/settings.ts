import type { ExtensionSettings } from "../shared/types";

export const SETTINGS_STORAGE_KEY = "ondrift.settings";
const STORAGE_KEY = SETTINGS_STORAGE_KEY;
export const DEFAULT_SETTINGS: ExtensionSettings = {
  provider: "gemini",
  apiKeys: {},
  apiModels: {},
  persona: "general",
  language: "en",
  enabledSites: { chatgpt: true, claude: true, gemini: true, perplexity: true, grok: true },
  onboardingComplete: false,
  saveHistory: true,
  consentGranted: false,
  apiKeyStatus: null,
  installId: "",
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

  // Every update() does a read-modify-write against the same full settings blob. Two calls
  // that overlap (e.g. the Options page autosaving a model change while a background rewrite
  // or "Verify & save" concurrently calls recordApiKeyStatus) would otherwise both read the
  // same pre-write snapshot and the one whose set() lands last silently clobbers the other's
  // change -- e.g. picking "Default" gets reverted back to the previously saved model. Chaining
  // every update() through this queue makes each one wait for the previous write to finish
  // before it reads, so no update's read can ever be stale relative to one already in flight.
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<ExtensionSettings> {
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

  async get(): Promise<ExtensionSettings> {
    const current = await this.read();
    if (current.installId) return current;

    // Serialize first-run ID creation with every other settings write. Concurrent initial
    // reads re-check storage inside the queue, so exactly one UUID is generated and all
    // callers observe the same persisted value.
    const ensureInstallId = async (): Promise<ExtensionSettings> => {
      const latest = await this.read();
      if (latest.installId) return latest;
      const next = { ...latest, installId: crypto.randomUUID() };
      await (this.area ?? localArea()).set({ [STORAGE_KEY]: next });
      return next;
    };
    const result = this.queue.then(ensureInstallId, ensureInstallId);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async update(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const run = async (): Promise<ExtensionSettings> => {
      const current = await this.read();
      const installId = current.installId || patch.installId || crypto.randomUUID();
      const next: ExtensionSettings = {
        ...current,
        ...patch,
        installId,
        apiKeys: { ...current.apiKeys, ...patch.apiKeys },
        apiModels: { ...current.apiModels, ...patch.apiModels },
        enabledSites: { ...current.enabledSites, ...patch.enabledSites },
      };
      await (this.area ?? localArea()).set({ [STORAGE_KEY]: next });
      return next;
    };
    // Run after whatever's already queued, regardless of whether it resolved or rejected --
    // and never let one update's failure poison the queue for updates queued after it.
    const result = this.queue.then(run, run);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async apiKey(provider?: ExtensionSettings["provider"]): Promise<string | undefined> {
    const settings = await this.get();
    return settings.apiKeys[provider ?? settings.provider]?.trim() || undefined;
  }
}

export const settingsStore = new SettingsStore();
