import { afterEach, describe, expect, it, vi } from "vitest";
import type { SiteAdapter } from "../src/adapters/site-adapter";
import { RewriteSession } from "../src/core/rewrite-flow";

function adapter(setPromptText: (text: string) => void, getPromptText: () => string): SiteAdapter {
  return {
    id: "perplexity",
    matches: () => true,
    getInputElement: () => null,
    getPromptText,
    setPromptText,
    getConversationTitle: () => null,
    getConversationUrl: () => "https://www.perplexity.ai/",
    onSubmit: () => () => undefined,
  };
}

describe("RewriteSession apply", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reports success only after the site editor contains the rewrite", async () => {
    let prompt = "original prompt";
    vi.stubGlobal("chrome", { runtime: { sendMessage: vi.fn(async () => ({
      ok: true,
      data: { improvedText: "improved prompt", score: 90, rationale: "clearer" },
    })) } });
    const session = new RewriteSession(adapter((text) => { prompt = text; }, () => prompt));

    await session.rewrite();
    await expect(session.apply()).resolves.toBeUndefined();
    expect(prompt).toBe("improved prompt");
  });

  it("rejects a false apply when a controlled editor restores its old value", async () => {
    const prompt = "original prompt";
    const setPromptText = vi.fn();
    vi.stubGlobal("chrome", { runtime: { sendMessage: vi.fn(async () => ({
      ok: true,
      data: { improvedText: "improved prompt", score: 90, rationale: "clearer" },
    })) } });
    const session = new RewriteSession(adapter(setPromptText, () => prompt));

    await session.rewrite();
    await expect(session.apply()).rejects.toThrow("did not accept");
    expect(setPromptText).toHaveBeenCalledTimes(2);
  });
});
