import type { SiteAdapter } from "./site-adapter";
import { firstVisible, installSubmitListener, readEditable, titleFromDocumentTitle, writeEditable } from "./site-adapter";

const INPUT_SELECTORS = [
  "div.ProseMirror[contenteditable='true']",
  "div[contenteditable='true'][role='textbox']",
  "div[contenteditable='true'][aria-label*='message' i]",
  "div[contenteditable='true'][data-testid*='composer' i]",
  "fieldset div[contenteditable='true']",
  "div[contenteditable='true'][data-placeholder]",
  "textarea[placeholder]",
] as const;
const SUBMIT_SELECTORS = ["button[aria-label*='Send' i]", "button[data-testid*='send' i]", "fieldset button[type='button']"] as const;

export class ClaudeAdapter implements SiteAdapter {
  readonly id = "claude" as const;
  matches(url: string): boolean {
    try { return new URL(url).hostname === "claude.ai"; } catch { return false; }
  }
  getInputElement(): HTMLElement | null { return firstVisible(INPUT_SELECTORS); }
  getPromptText(): string { return readEditable(this.getInputElement()); }
  setPromptText(text: string): void {
    const input = this.getInputElement();
    if (!input) throw new Error("Claude prompt input is not available.");
    writeEditable(input, text);
  }
  getConversationTitle(): string | null {
    return titleFromDocumentTitle("Claude");
  }
  getConversationUrl(): string { return location.href; }
  onSubmit(callback: (prompt: string) => void): () => void {
    return installSubmitListener(() => this.getInputElement(), SUBMIT_SELECTORS, callback);
  }
}
