import { describe, expect, it, vi } from "vitest";
import { handleRuntimeRequest, type MessageHandlerDependencies } from "../src/background/message-handler";
import { ProviderError } from "../src/providers/errors";

function dependencies(overrides: Partial<MessageHandlerDependencies> = {}): MessageHandlerDependencies {
  return {
    settings: {
      get: vi.fn(async () => ({
        provider: "gemini" as const,
        apiKeys: { gemini: "key" },
        enabledSites: { chatgpt: true, claude: true, gemini: true, perplexity: true },
        onboardingComplete: true,
        persona: "general",
        language: "en" as const,
        saveHistory: true,
        consentGranted: true,
      })),
      update: vi.fn(async (patch) => patch),
    } as never,
    history: {
      add: vi.fn(async () => 7), list: vi.fn(async () => []), delete: vi.fn(), clear: vi.fn(), aggregates: vi.fn(async () => ({})),
    } as never,
    provider: vi.fn(() => ({
      id: "gemini" as const,
      rewrite: vi.fn(async () => ({ improvedText: "better", score: 90, rationale: "clear" })),
      validateKey: vi.fn(async () => undefined),
    })),
    openOptions: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("handleRuntimeRequest", () => {
  it("keeps provider execution in the background handler", async () => {
    const deps = dependencies();
    const result = await handleRuntimeRequest({ type: "rewrite", payload: { prompt: "hello", service: "chatgpt" } }, deps);
    expect(result).toEqual({ ok: true, data: { improvedText: "better", score: 90, rationale: "clear" } });
    expect(deps.provider).toHaveBeenCalledWith("gemini");
  });

  it("rejects disabled sites before calling a provider", async () => {
    const deps = dependencies({
      settings: { get: vi.fn(async () => ({ provider: "gemini", apiKeys: { gemini: "key" }, enabledSites: { chatgpt: false, claude: true, gemini: true, perplexity: true }, onboardingComplete: true, persona: "general", language: "en", saveHistory: true, consentGranted: true })) } as never,
    });
    await expect(handleRuntimeRequest({ type: "rewrite", payload: { prompt: "hello", service: "chatgpt" } }, deps))
      .resolves.toMatchObject({ ok: false, error: { code: "not_configured" } });
    expect(deps.provider).not.toHaveBeenCalled();
  });

  it("returns structured errors without leaking provider internals", async () => {
    const deps = dependencies({
      provider: vi.fn(() => ({ id: "gemini" as const, rewrite: vi.fn(async () => { throw new ProviderError("quota_exceeded", "Quota reset tomorrow", true); }), validateKey: vi.fn() })),
    });
    await expect(handleRuntimeRequest({ type: "rewrite", payload: { prompt: "hello", service: "claude" } }, deps))
      .resolves.toEqual({ ok: false, error: { code: "quota_exceeded", message: "Quota reset tomorrow", retryable: true } });
  });

  it("routes local history operations", async () => {
    const deps = dependencies();
    const payload = { service: "chatgpt" as const, sourceUrl: "https://chatgpt.com/c/1", originalText: "hello", applied: false, createdAt: 1 };
    await expect(handleRuntimeRequest({ type: "history_add", payload }, deps)).resolves.toEqual({ ok: true, data: 7 });
    expect(deps.history.add).toHaveBeenCalledWith(payload);
  });

  it("opens extension settings through the background context", async () => {
    const deps = dependencies();

    await expect(handleRuntimeRequest({ type: "open_options" }, deps)).resolves.toEqual({ ok: true, data: undefined });
    expect(deps.openOptions).toHaveBeenCalledOnce();
  });

  it("does not persist history before consent", async () => {
    const deps = dependencies({
      settings: { get: vi.fn(async () => ({ provider: "gemini", apiKeys: {}, enabledSites: { chatgpt: true, claude: true, gemini: true, perplexity: true }, onboardingComplete: false, persona: "general", language: "en", saveHistory: true, consentGranted: false })) } as never,
    });
    const payload = { service: "chatgpt" as const, sourceUrl: "https://chatgpt.com", originalText: "private", applied: false, createdAt: 1 };
    await expect(handleRuntimeRequest({ type: "history_add", payload }, deps)).resolves.toEqual({ ok: true, data: 0 });
    expect(deps.history.add).not.toHaveBeenCalled();
  });

  it("does not treat completed onboarding as history consent", async () => {
    const deps = dependencies({
      settings: { get: vi.fn(async () => ({ provider: "gemini", apiKeys: {}, enabledSites: { chatgpt: true, claude: true, gemini: true, perplexity: true }, onboardingComplete: true, persona: "general", language: "en", saveHistory: true, consentGranted: false })) } as never,
    });
    const payload = { service: "claude" as const, sourceUrl: "https://claude.ai", originalText: "private", applied: false, createdAt: 1 };
    await expect(handleRuntimeRequest({ type: "history_add", payload }, deps)).resolves.toEqual({ ok: true, data: 0 });
    expect(deps.history.add).not.toHaveBeenCalled();
  });
});
