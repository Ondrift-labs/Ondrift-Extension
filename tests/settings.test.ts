import { describe, expect, it } from "vitest";
import { SettingsStore, type LocalStorageArea } from "../src/storage/settings";

class MemoryStorage implements LocalStorageArea {
  values: Record<string, unknown> = {};
  async get(): Promise<Record<string, unknown>> { return this.values; }
  async set(items: Record<string, unknown>): Promise<void> { Object.assign(this.values, items); }
}

describe("SettingsStore", () => {
  it("returns safe local defaults", async () => {
    await expect(new SettingsStore(new MemoryStorage()).get()).resolves.toEqual({
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
    });
  });

  it("deep-merges API keys and site toggles without losing prior values", async () => {
    const store = new SettingsStore(new MemoryStorage());
    await store.update({ apiKeys: { gemini: " first " }, enabledSites: { chatgpt: false, claude: true, gemini: true, perplexity: true } });
    const result = await store.update({ apiKeys: { openai: "second" }, enabledSites: { claude: false, chatgpt: false, gemini: true, perplexity: true }, language: "ko" });
    expect(result.apiKeys).toEqual({ gemini: " first ", openai: "second" });
    expect(result.enabledSites).toEqual({ chatgpt: false, claude: false, gemini: true, perplexity: true });
    expect(result.language).toBe("ko");
    await expect(store.apiKey("gemini")).resolves.toBe("first");
  });

  it("falls back to English when stored language data is invalid", async () => {
    const storage = new MemoryStorage();
    storage.values["ondrift.settings"] = { language: "unsupported" };

    await expect(new SettingsStore(storage).get()).resolves.toMatchObject({ language: "en" });
  });

  it("restores Simplified Chinese from local settings", async () => {
    const storage = new MemoryStorage();
    storage.values["ondrift.settings"] = { language: "zh" };

    await expect(new SettingsStore(storage).get()).resolves.toMatchObject({ language: "zh" });
  });
});
