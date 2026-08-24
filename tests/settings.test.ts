import { describe, expect, it } from "vitest";
import { SettingsStore, type LocalStorageArea } from "../src/storage/settings";

class MemoryStorage implements LocalStorageArea {
  values: Record<string, unknown> = {};
  setCount = 0;
  async get(): Promise<Record<string, unknown>> { return this.values; }
  async set(items: Record<string, unknown>): Promise<void> { this.setCount += 1; Object.assign(this.values, items); }
}

describe("SettingsStore", () => {
  it("returns safe local defaults", async () => {
    await expect(new SettingsStore(new MemoryStorage()).get()).resolves.toMatchObject({
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
      installId: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
    });
  });

  it("generates and persists one stable install ID across repeated reads", async () => {
    const storage = new MemoryStorage();
    const store = new SettingsStore(storage);

    const first = await store.get();
    const second = await store.get();

    expect(second.installId).toBe(first.installId);
    expect((storage.values["ondrift.settings"] as { installId: string }).installId).toBe(first.installId);
    expect(storage.setCount).toBe(1);
  });

  it("deep-merges API keys and site toggles without losing prior values", async () => {
    const store = new SettingsStore(new MemoryStorage());
    await store.update({ apiKeys: { gemini: " first " }, enabledSites: { chatgpt: false, claude: true, gemini: true, perplexity: true, grok: true } });
    const result = await store.update({ apiKeys: { openai: "second" }, enabledSites: { claude: false, chatgpt: false, gemini: true, perplexity: true, grok: true }, language: "ko" });
    expect(result.apiKeys).toEqual({ gemini: " first ", openai: "second" });
    expect(result.enabledSites).toEqual({ chatgpt: false, claude: false, gemini: true, perplexity: true, grok: true });
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
