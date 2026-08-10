import type { SiteAdapter } from "./site-adapter";
import { firstVisible, installSubmitListener, readEditable, writeEditable } from "./site-adapter";

const INPUT_SELECTORS = [
  "rich-textarea .ql-editor[contenteditable='true']",
  ".input-area .ql-editor[contenteditable='true']",
  "div.ql-editor[contenteditable='true'][role='textbox']",
  "div[contenteditable='true'][aria-label*='prompt' i]",
] as const;
const SUBMIT_SELECTORS = [
  "button.send-button",
  "button[aria-label*='Send message' i]",
  "button[aria-label*='Send' i]",
] as const;

export class GeminiAdapter implements SiteAdapter {
  readonly id = "gemini" as const;
  matches(url: string): boolean {
    try { return new URL(url).hostname === "gemini.google.com"; } catch { return false; }
  }
  getInputElement(): HTMLElement | null { return firstVisible(INPUT_SELECTORS); }
  getPromptText(): string { return readEditable(this.getInputElement()); }
  setPromptText(text: string): void {
    const input = this.getInputElement();
    if (!input) throw new Error("Gemini prompt input is not available.");
    writeEditable(input, text);
  }
  getConversationTitle(): string | null {
    return document.querySelector<HTMLTitleElement>("title")?.textContent?.replace(/\s*[-|]\s*Gemini\s*$/i, "").trim() || null;
  }
  getConversationUrl(): string { return location.href; }
  onSubmit(callback: (prompt: string) => void): () => void {
    return installSubmitListener(() => this.getInputElement(), SUBMIT_SELECTORS, callback);
  }
}
