import { BaseAdapter, hostnameMatches } from "./site-adapter";

const INPUT_SELECTORS = [
  "div.ProseMirror[contenteditable='true']",
  "div[contenteditable='true'][role='textbox']",
  "div[contenteditable='true'][aria-label*='message' i]",
  "div[contenteditable='true'][data-testid*='composer' i]",
  "fieldset div[contenteditable='true']",
  "div[contenteditable='true'][data-placeholder]",
  "textarea[placeholder]",
] as const;
const SUBMIT_SELECTORS = ["button[aria-label*='Send' i]", "button[data-testid*='send' i]"] as const;

export class ClaudeAdapter extends BaseAdapter {
  readonly id = "claude" as const;
  protected readonly siteName = "Claude";
  protected readonly inputSelectors = INPUT_SELECTORS;
  protected readonly submitSelectors = SUBMIT_SELECTORS;
  matches(url: string): boolean {
    return hostnameMatches(url, ["claude.ai"]);
  }
}
