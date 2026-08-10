import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatGptAdapter } from "../src/adapters/chatgpt.adapter";
import { ClaudeAdapter } from "../src/adapters/claude.adapter";
import { GeminiAdapter } from "../src/adapters/gemini.adapter";
import { PerplexityAdapter } from "../src/adapters/perplexity.adapter";
import { AdapterRegistry } from "../src/core/adapter-registry";
import { findComposerAnchor } from "../src/adapters/site-adapter";

describe("site adapter URL matching", () => {
  beforeEach(() => { document.body.replaceChildren(); });
  it("matches only exact supported hosts", () => {
    expect(new ChatGptAdapter().matches("https://chatgpt.com/c/abc")).toBe(true);
    expect(new ChatGptAdapter().matches("https://evil.example/?chatgpt.com")).toBe(false);
    expect(new ClaudeAdapter().matches("https://claude.ai/new")).toBe(true);
    expect(new GeminiAdapter().matches("https://gemini.google.com/app/abc")).toBe(true);
    expect(new GeminiAdapter().matches("https://google.com/?gemini.google.com")).toBe(false);
    expect(new PerplexityAdapter().matches("https://www.perplexity.ai/search/abc")).toBe(true);
    expect(new PerplexityAdapter().matches("https://perplexity.ai/")).toBe(true);
    expect(new ClaudeAdapter().matches("not-a-url")).toBe(false);
  });

  it("resolves the correct adapter through the registry", () => {
    const registry = new AdapterRegistry();
    expect(registry.resolve("https://claude.ai/chat/1")?.id).toBe("claude");
    expect(registry.resolve("https://gemini.google.com/app")?.id).toBe("gemini");
    expect(registry.resolve("https://www.perplexity.ai/")?.id).toBe("perplexity");
    expect(registry.resolve("https://example.com")).toBeNull();
  });

  it("reads and applies Gemini contenteditable prompts", () => {
    document.body.innerHTML = '<rich-textarea><div class="ql-editor" contenteditable="true" role="textbox">draft</div></rich-textarea>';
    const adapter = new GeminiAdapter();
    expect(adapter.getPromptText()).toBe("draft");
    adapter.setPromptText("improved");
    expect(adapter.getPromptText()).toBe("improved");
  });

  it("reads and applies Perplexity textarea prompts", () => {
    document.body.innerHTML = '<textarea placeholder="Ask anything">draft</textarea>';
    const adapter = new PerplexityAdapter();
    expect(adapter.getPromptText()).toBe("draft");
    adapter.setPromptText("improved");
    expect(adapter.getPromptText()).toBe("improved");
  });

  it("reads and applies textarea values through native input semantics", () => {
    document.body.innerHTML = '<form><textarea id="prompt-textarea">draft</textarea><button data-testid="send-button"></button></form>';
    const input = document.querySelector("textarea")!;
    const inputListener = vi.fn();
    const changeListener = vi.fn();
    input.addEventListener("input", inputListener);
    input.addEventListener("change", changeListener);
    const adapter = new ChatGptAdapter();
    expect(adapter.getPromptText()).toBe("draft");
    adapter.setPromptText("improved");
    expect(input.value).toBe("improved");
    expect(inputListener).toHaveBeenCalledOnce();
    expect(changeListener).toHaveBeenCalledOnce();
  });

  it("reads and applies contenteditable prompts", () => {
    document.body.innerHTML = '<div class="ProseMirror" contenteditable="true">draft</div>';
    const adapter = new ClaudeAdapter();
    expect(adapter.getPromptText()).toBe("draft");
    adapter.setPromptText("improved");
    expect(adapter.getPromptText()).toBe("improved");
  });

  it("detects Claude's role-based composer variant", () => {
    document.body.innerHTML = '<div contenteditable="true" role="textbox" aria-label="Write a message">draft</div>';
    const adapter = new ClaudeAdapter();

    expect(adapter.getPromptText()).toBe("draft");
  });

  it("detects submit keys only inside the prompt and de-duplicates click fallthrough", () => {
    document.body.innerHTML = '<form><textarea id="prompt-textarea">send me</textarea><button type="button" data-testid="send-button"></button></form><input id="other">';
    const callback = vi.fn();
    const adapter = new ChatGptAdapter();
    const cleanup = adapter.onSubmit(callback);
    document.querySelector("#other")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(callback).not.toHaveBeenCalled();
    document.querySelector("textarea")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    document.querySelector("button")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith("send me");
    cleanup();
  });

  it("mounts the widget after the bordered composer instead of over the input", () => {
    document.body.innerHTML = '<section id="composer"><div><textarea id="prompt"></textarea></div></section>';
    const input = document.querySelector<HTMLElement>("#prompt")!;
    const getStyle = vi.spyOn(window, "getComputedStyle").mockImplementation((element) => ({
      borderTopWidth: (element as HTMLElement).id === "composer" ? "1px" : "0px",
      borderRightWidth: "0px",
      borderBottomWidth: "0px",
      borderLeftWidth: "0px",
    }) as CSSStyleDeclaration);

    expect(findComposerAnchor(input).id).toBe("composer");
    getStyle.mockRestore();
  });
});
