import type { SiteAdapter } from "./site-adapter";
import { firstVisible, installSubmitListener, readEditable, selectAllContents, writeEditable, writeEditableThroughPaste } from "./site-adapter";

const INPUT_SELECTORS = [
  "div[contenteditable='true'][role='textbox']",
  "div[contenteditable='true'][data-lexical-editor='true']",
  "div[contenteditable='true'][aria-label*='Ask' i]",
  "textarea[placeholder*='Ask' i]",
  "textarea[aria-label*='Ask' i]",
] as const;
const SUBMIT_SELECTORS = [
  "button[aria-label*='Submit' i]",
  "button[aria-label*='Send' i]",
  "form button[type='submit']",
] as const;

export class PerplexityAdapter implements SiteAdapter {
  readonly id = "perplexity" as const;
  matches(url: string): boolean {
    try {
      const hostname = new URL(url).hostname;
      return hostname === "perplexity.ai" || hostname === "www.perplexity.ai";
    } catch { return false; }
  }
  getInputElement(): HTMLElement | null { return firstVisible(INPUT_SELECTORS); }
  getPromptText(): string { return readEditable(this.getInputElement()); }
  async setPromptText(text: string): Promise<void> {
    const input = this.getInputElement();
    if (!input) throw new Error("Perplexity prompt input is not available.");
    // Perplexity's composer is a Lexical editor, which tracks selection through its own
    // model rather than trusting the live DOM selection at the instant an edit event
    // arrives. Lexical only picks up a programmatic selection change asynchronously (via
    // the "selectionchange" event), so selecting and writing in the same synchronous tick
    // lands the write at Lexical's stale cursor — typically the end of the existing text —
    // instead of replacing the selection, which reads back as the rewrite appended after
    // the original prompt. Select first and yield a tick so Lexical's listener catches up.
    selectAllContents(input);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (writeEditableThroughPaste(input, text)) return;
    writeEditable(input, text);
  }
  getConversationTitle(): string | null {
    return document.querySelector<HTMLTitleElement>("title")?.textContent?.replace(/\s*[-|]\s*Perplexity\s*$/i, "").trim() || null;
  }
  getConversationUrl(): string { return location.href; }
  onSubmit(callback: (prompt: string) => void): () => void {
    return installSubmitListener(() => this.getInputElement(), SUBMIT_SELECTORS, callback);
  }
}
