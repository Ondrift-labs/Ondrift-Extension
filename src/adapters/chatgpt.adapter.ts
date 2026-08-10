import type { SiteAdapter } from "./site-adapter";
import { firstVisible, installSubmitListener, readEditable, writeEditable } from "./site-adapter";

const INPUT_SELECTORS = [
  "#prompt-textarea",
  "textarea[data-id='root']",
  "form textarea",
  "div[contenteditable='true'][data-lexical-editor='true']",
] as const;
const SUBMIT_SELECTORS = ["button[data-testid='send-button']", "button[aria-label*='Send']", "form button[type='submit']"] as const;

export class ChatGptAdapter implements SiteAdapter {
  readonly id = "chatgpt" as const;
  matches(url: string): boolean {
    try { return new URL(url).hostname === "chatgpt.com"; } catch { return false; }
  }
  getInputElement(): HTMLElement | null { return firstVisible(INPUT_SELECTORS); }
  getPromptText(): string { return readEditable(this.getInputElement()); }
  setPromptText(text: string): void {
    const input = this.getInputElement();
    if (!input) throw new Error("ChatGPT prompt input is not available.");
    writeEditable(input, text);
  }
  getConversationTitle(): string | null {
    return document.querySelector<HTMLTitleElement>("title")?.textContent?.replace(/\s*[-|]\s*ChatGPT\s*$/i, "").trim() || null;
  }
  getConversationUrl(): string { return location.href; }
  onSubmit(callback: (prompt: string) => void): () => void {
    return installSubmitListener(() => this.getInputElement(), SUBMIT_SELECTORS, callback);
  }
}
