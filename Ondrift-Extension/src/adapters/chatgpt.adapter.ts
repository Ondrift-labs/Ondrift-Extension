import { BaseAdapter, hostnameMatches } from "./site-adapter";

const INPUT_SELECTORS = [
  "#prompt-textarea",
  "textarea[data-id='root']",
  "form textarea",
  "div[contenteditable='true'][data-lexical-editor='true']",
] as const;
const SUBMIT_SELECTORS = ["button[data-testid='send-button']", "button[aria-label*='Send']", "form button[type='submit']"] as const;

export class ChatGptAdapter extends BaseAdapter {
  readonly id = "chatgpt" as const;
  protected readonly siteName = "ChatGPT";
  protected readonly inputSelectors = INPUT_SELECTORS;
  protected readonly submitSelectors = SUBMIT_SELECTORS;
  matches(url: string): boolean {
    return hostnameMatches(url, ["chatgpt.com"]);
  }
}
