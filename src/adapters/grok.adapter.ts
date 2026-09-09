import { BaseAdapter, hostnameMatches } from "./site-adapter";

const INPUT_SELECTORS = [
  "div[contenteditable='true'][aria-label*='Ask' i]",
  "div[contenteditable='true'][role='textbox']",
  "textarea[aria-label*='Ask' i]",
  "textarea[placeholder*='Ask' i]",
] as const;
const SUBMIT_SELECTORS = [
  "button[aria-label*='Submit' i]",
  "button[aria-label*='Send' i]",
  "form button[type='submit']",
] as const;

export class GrokAdapter extends BaseAdapter {
  readonly id = "grok" as const;
  protected readonly siteName = "Grok";
  protected readonly inputSelectors = INPUT_SELECTORS;
  protected readonly submitSelectors = SUBMIT_SELECTORS;
  matches(url: string): boolean {
    return hostnameMatches(url, ["grok.com"]);
  }
}
