import type { SiteAdapter } from "./site-adapter";
import { firstVisible, installSubmitListener, readEditable, writeEditable } from "./site-adapter";

const INPUT_SELECTORS = [
  "textarea[placeholder*='Ask' i]",
  "textarea[aria-label*='Ask' i]",
  "div[contenteditable='true'][role='textbox']",
  "div[contenteditable='true'][data-lexical-editor='true']",
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
  setPromptText(text: string): void {
    const input = this.getInputElement();
    if (!input) throw new Error("Perplexity prompt input is not available.");
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
