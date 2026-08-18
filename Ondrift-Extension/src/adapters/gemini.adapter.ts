import { BaseAdapter, hostnameMatches } from "./site-adapter";

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

export class GeminiAdapter extends BaseAdapter {
  readonly id = "gemini" as const;
  protected readonly siteName = "Gemini";
  protected readonly inputSelectors = INPUT_SELECTORS;
  protected readonly submitSelectors = SUBMIT_SELECTORS;
  matches(url: string): boolean {
    return hostnameMatches(url, ["gemini.google.com"]);
  }
  getComposerAnchor(input: HTMLElement): HTMLElement | null {
    return input.closest<HTMLElement>(".input-area-container")
      ?? input.closest<HTMLElement>(".input-area")
      ?? input.closest<HTMLElement>("form");
  }
}
