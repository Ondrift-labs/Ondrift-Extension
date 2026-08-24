import { afterEach, describe, expect, it, vi } from "vitest";

import { uiBridge } from "../src/core/ui-bridge";
import { DEFAULT_SETTINGS } from "../src/storage/settings";

describe("uiBridge.saveSettings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes the chosen model into apiModels for the active provider", async () => {
    const sendMessage = vi.fn(async () => ({ ok: true, data: { ...DEFAULT_SETTINGS } }));
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    await uiBridge.saveSettings({ ...DEFAULT_SETTINGS, provider: "gemini", model: "gemini-3.6-flash-lite" } as never);

    expect(sendMessage).toHaveBeenCalledWith({
      type: "settings_set",
      payload: expect.objectContaining({ apiModels: { gemini: "gemini-3.6-flash-lite" } }),
    });
  });

  it("writes model back to undefined so a previously saved override is cleared", async () => {
    const sendMessage = vi.fn(async () => ({ ok: true, data: { ...DEFAULT_SETTINGS } }));
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    await uiBridge.saveSettings({ ...DEFAULT_SETTINGS, provider: "gemini", model: undefined } as never);

    expect(sendMessage).toHaveBeenCalledWith({
      type: "settings_set",
      payload: expect.objectContaining({ apiModels: { gemini: undefined } }),
    });
  });
});

describe("uiBridge.getSettings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("threads the cached free-tier remaining count into UI settings", async () => {
    const sendMessage = vi.fn(async () => ({ ok: true, data: { ...DEFAULT_SETTINGS, freeTierRemaining: 2 } }));
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    await expect(uiBridge.getSettings()).resolves.toMatchObject({ apiKeyConfigured: false, freeTierRemaining: 2 });
  });
});

describe("uiBridge.removeApiKey", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears the saved key and its health status for the given provider, without touching the model", async () => {
    const sendMessage = vi.fn(async () => ({
      ok: true,
      data: { ...DEFAULT_SETTINGS, apiKeys: { gemini: "" }, apiKeyStatus: null },
    }));
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    const result = await uiBridge.removeApiKey("gemini");

    expect(sendMessage).toHaveBeenCalledWith({
      type: "settings_set",
      payload: { apiKeys: { gemini: "" }, apiKeyStatus: null },
    });
    expect(result.apiKeyConfigured).toBe(false);
  });
});
