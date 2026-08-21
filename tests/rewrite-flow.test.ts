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
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reports success only after the site editor contains the rewrite", async () => {
    let prompt = "original prompt";
    vi.stubGlobal("chrome", { runtime: { sendMessage: vi.fn(async () => ({
      ok: true,
      data: { improvedText: "improved prompt", previousScore: 50, score: 90, rationale: "clearer" },
    })) } });
    const session = new RewriteSession(adapter((text) => { prompt = text; }, () => prompt));

    await session.rewrite();
    await expect(session.apply()).resolves.toBeUndefined();
    expect(prompt).toBe("improved prompt");
  });

  it("accepts a readback whose line breaks were reflowed by a contenteditable editor", async () => {
    let prompt = "original prompt";
    vi.stubGlobal("chrome", { runtime: { sendMessage: vi.fn(async () => ({
      ok: true,
      data: { improvedText: "1. **Step one**:\n   - detail\n\n2. **Step two**:\n   - detail", previousScore: 50, score: 90, rationale: "clearer" },
    })) } });
    // A contenteditable readback frequently normalizes blank-line paragraph breaks into a
    // different run of newlines/spaces than what was written, even though the visible content matches.
    const session = new RewriteSession(adapter(
      (text) => { prompt = text.replace(/\n\n/g, "\n").replace(/ {3}/g, " "); },
      () => prompt,
    ));

    await session.rewrite();
    await expect(session.apply()).resolves.toBeUndefined();
  });

  it("accepts a readback padded with zero-width characters a Lexical-based editor inserts", async () => {
    let prompt = "original prompt";
    vi.stubGlobal("chrome", { runtime: { sendMessage: vi.fn(async () => ({
      ok: true,
      data: { improvedText: "line one\n\nline two", previousScore: 50, score: 90, rationale: "clearer" },
    })) } });
    // Perplexity's Lexical-based composer inserts zero-width spaces at line boundaries,
    // which plain whitespace collapsing does not strip.
    const session = new RewriteSession(adapter(
      (text) => { prompt = text.replace(/\n\n/g, "\n\u200B\n"); },
      () => prompt,
    ));

    await session.rewrite();
    await expect(session.apply()).resolves.toBeUndefined();
  });

  it("rejects a false apply when a controlled editor restores its old value", async () => {
    const prompt = "original prompt";
    const setPromptText = vi.fn();
    vi.stubGlobal("chrome", { runtime: { sendMessage: vi.fn(async () => ({
      ok: true,
      data: { improvedText: "improved prompt", previousScore: 50, score: 90, rationale: "clearer" },
    })) } });
    const session = new RewriteSession(adapter(setPromptText, () => prompt));

    await session.rewrite();
    await expect(session.apply()).rejects.toThrow("did not accept");
    expect(setPromptText).toHaveBeenCalledTimes(2);
  });

  it("stores both original and improved scores with the rewrite history", async () => {
    let submit: ((text: string) => void) | undefined;
    const sendMessage = vi.fn(async (message: { type: string }) => message.type === "rewrite"
      ? { ok: true, data: { improvedText: "improved prompt", previousScore: 52, score: 86, rationale: "clearer" } }
      : { ok: true, data: 1 });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const historyAdapter: SiteAdapter = {
      ...adapter(() => undefined, () => "original prompt"),
      onSubmit(listener) { submit = listener; return () => undefined; },
    };
    const session = new RewriteSession(historyAdapter);

    session.startHistoryCapture();
    await session.rewrite();
    submit?.("original prompt");
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(2));

    expect(sendMessage.mock.calls[1]?.[0]).toMatchObject({
      type: "history_add",
      payload: { previousScore: 52, score: 86 },
    });
  });

  it("does not store an ordinary submission when no rewrite completed", async () => {
    vi.useFakeTimers();
    let submit: ((text: string) => void) | undefined;
    const onSubmit = vi.fn((listener: (text: string) => void) => { submit = listener; return () => undefined; });
    const sendMessage = vi.fn(async () => ({ ok: true, data: 1 }));
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const historyAdapter: SiteAdapter = {
      ...adapter(() => undefined, () => "ordinary prompt"),
      onSubmit,
    };
    const session = new RewriteSession(historyAdapter);

    session.startHistoryCapture();
    submit?.("ordinary prompt");
    await vi.advanceTimersByTimeAsync(500);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("stores a completed rewrite exactly once when duplicate submit events fire", async () => {
    vi.useFakeTimers();
    let submit: ((text: string) => void) | undefined;
    const sendMessage = vi.fn(async (message: { type: string }) => message.type === "rewrite"
      ? { ok: true, data: { improvedText: "improved prompt", previousScore: 52, score: 86, rationale: "clearer" } }
      : { ok: true, data: 1 });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const historyAdapter: SiteAdapter = {
      ...adapter(() => undefined, () => "original prompt"),
      onSubmit(listener) { submit = listener; return () => undefined; },
    };
    const session = new RewriteSession(historyAdapter);

    session.startHistoryCapture();
    await session.rewrite();
    submit?.("improved prompt");
    submit?.("improved prompt");
    await vi.advanceTimersByTimeAsync(500);

    expect(sendMessage.mock.calls.filter(([message]) => message.type === "history_add")).toHaveLength(1);
  });

  it("keeps the submitted conversation URL when navigation occurs before capture", async () => {
    vi.useFakeTimers();
    let submit: ((text: string) => void) | undefined;
    let conversationUrl = "https://chatgpt.com/c/submitted";
    const sendMessage = vi.fn(async (message: { type: string }) => message.type === "rewrite"
      ? { ok: true, data: { improvedText: "improved prompt", previousScore: 52, score: 86, rationale: "clearer" } }
      : { ok: true, data: 1 });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const historyAdapter: SiteAdapter = {
      ...adapter(() => undefined, () => "original prompt"),
      id: "chatgpt",
      getConversationUrl: () => conversationUrl,
      onSubmit(listener) { submit = listener; return () => undefined; },
    };
    const session = new RewriteSession(historyAdapter);

    session.startHistoryCapture();
    await session.rewrite();
    submit?.("improved prompt");
    conversationUrl = "https://chatgpt.com/c/different";
    await vi.advanceTimersByTimeAsync(500);

    expect(sendMessage.mock.calls[1]?.[0]).toMatchObject({
      type: "history_add",
      payload: { sourceUrl: "https://chatgpt.com/c/submitted" },
    });
  });

  it("captures the routed conversation URL after submitting from a new-chat page", async () => {
    vi.useFakeTimers();
    let submit: ((text: string) => void) | undefined;
    let conversationUrl = "https://chatgpt.com/";
    const sendMessage = vi.fn(async (message: { type: string }) => message.type === "rewrite"
      ? { ok: true, data: { improvedText: "improved prompt", previousScore: 52, score: 86, rationale: "clearer" } }
      : { ok: true, data: 1 });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const historyAdapter: SiteAdapter = {
      ...adapter(() => undefined, () => "original prompt"),
      id: "chatgpt",
      getConversationUrl: () => conversationUrl,
      onSubmit(listener) { submit = listener; return () => undefined; },
    };
    const session = new RewriteSession(historyAdapter);

    session.startHistoryCapture();
    await session.rewrite();
    submit?.("improved prompt");
    conversationUrl = "https://chatgpt.com/c/created";
    await vi.advanceTimersByTimeAsync(500);

    expect(sendMessage.mock.calls[1]?.[0]).toMatchObject({
      type: "history_add",
      payload: { sourceUrl: "https://chatgpt.com/c/created" },
    });
  });

  it("does not replace a new-chat URL with an unrelated fast navigation", async () => {
    vi.useFakeTimers();
    let submit: ((text: string) => void) | undefined;
    let conversationUrl = "https://chatgpt.com/";
    const sendMessage = vi.fn(async (message: { type: string }) => message.type === "rewrite"
      ? { ok: true, data: { improvedText: "improved prompt", previousScore: 52, score: 86, rationale: "clearer" } }
      : { ok: true, data: 1 });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const historyAdapter: SiteAdapter = {
      ...adapter(() => undefined, () => "original prompt"),
      id: "chatgpt",
      getConversationUrl: () => conversationUrl,
      onSubmit(listener) { submit = listener; return () => undefined; },
    };
    const session = new RewriteSession(historyAdapter);

    session.startHistoryCapture();
    await session.rewrite();
    submit?.("improved prompt");
    conversationUrl = "https://chatgpt.com/gpts";
    await vi.advanceTimersByTimeAsync(500);

    expect(sendMessage.mock.calls[1]?.[0]).toMatchObject({
      type: "history_add",
      payload: { sourceUrl: "https://chatgpt.com/" },
    });
  });

  it("cancels a pending history capture when the session is stopped", async () => {
    vi.useFakeTimers();
    let submit: ((text: string) => void) | undefined;
    const sendMessage = vi.fn(async (message: { type: string }) => message.type === "rewrite"
      ? { ok: true, data: { improvedText: "improved prompt", previousScore: 52, score: 86, rationale: "clearer" } }
      : { ok: true, data: 1 });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const historyAdapter: SiteAdapter = {
      ...adapter(() => undefined, () => "original prompt"),
      onSubmit(listener) { submit = listener; return () => undefined; },
    };
    const session = new RewriteSession(historyAdapter);

    const stop = session.startHistoryCapture();
    await session.rewrite();
    submit?.("improved prompt");
    stop();
    await vi.advanceTimersByTimeAsync(500);

    expect(sendMessage.mock.calls.filter(([message]) => message.type === "history_add")).toHaveLength(0);
  });
});
