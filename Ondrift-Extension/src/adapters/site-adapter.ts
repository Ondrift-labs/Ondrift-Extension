import type { SiteId } from "../shared/types";

export type SubmitListener = (prompt: string) => void;

export interface SiteAdapter {
  readonly id: SiteId;
  matches(url: string): boolean;
  getInputElement(): HTMLElement | null;
  getComposerAnchor?(input: HTMLElement): HTMLElement | null;
  getPromptText(): string;
  setPromptText(text: string): void | Promise<void>;
  getConversationTitle(): string | null;
  getConversationUrl(): string;
  onSubmit(callback: SubmitListener): () => void;
}

/** Strips the trailing " - <siteName>" / " | <siteName>" suffix browsers append to the document title. */
export function titleFromDocumentTitle(siteName: string): string | null {
  const suffix = new RegExp(`\\s*[-|]\\s*${siteName}\\s*$`, "i");
  return document.querySelector<HTMLTitleElement>("title")?.textContent?.replace(suffix, "").trim() || null;
}

/** Shared `matches()` body: does the URL's hostname match one of a site's known hostnames? */
export function hostnameMatches(url: string, hostnames: readonly string[]): boolean {
  try { return hostnames.includes(new URL(url).hostname); } catch { return false; }
}

/**
 * Every adapter implements `SiteAdapter` the same way except for `matches()`,
 * `getComposerAnchor()`, and (for Perplexity) `setPromptText()`. Subclasses provide the
 * per-site selectors and name; everything else is shared here so a fix to, say, how prompt
 * text is read or how submissions are detected applies to every site at once.
 */
export abstract class BaseAdapter implements SiteAdapter {
  abstract readonly id: SiteId;
  protected abstract readonly siteName: string;
  protected abstract readonly inputSelectors: readonly string[];
  protected abstract readonly submitSelectors: readonly string[];

  abstract matches(url: string): boolean;

  getInputElement(): HTMLElement | null {
    return firstVisible(this.inputSelectors);
  }
  getPromptText(): string {
    return readEditable(this.getInputElement());
  }
  setPromptText(text: string): void {
    const input = this.getInputElement();
    if (!input) throw new Error(`${this.siteName} prompt input is not available.`);
    writeEditable(input, text);
  }
  getConversationTitle(): string | null {
    return titleFromDocumentTitle(this.siteName);
  }
  getConversationUrl(): string {
    return location.href;
  }
  onSubmit(callback: SubmitListener): () => void {
    return installSubmitListener(() => this.getInputElement(), this.submitSelectors, callback);
  }
}

export function readEditable(element: HTMLElement | null): string {
  if (!element) return "";
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) return element.value.trim();
  return (element.innerText || element.textContent || "").trim();
}

/**
 * Collapses whitespace and strips invisible formatting characters so apply-verification
 * isn't tripped up by editor artifacts rather than an actual mismatch in content.
 * Contenteditable elements reflow paragraph breaks into varying runs of newlines, and
 * rich-text editors built on frameworks like Lexical (e.g. Perplexity's composer) insert
 * zero-width space/joiner characters at line boundaries to keep the DOM navigable — none
 * of which `\s` matches, so they survive a plain whitespace collapse.
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Selects an element's full contents, mirroring what a user does before typing over a selection. */
export function selectAllContents(element: HTMLElement): void {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function writeEditable(element: HTMLElement, text: string): void {
  element.focus();
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(element, text);
  } else {
    const selection = window.getSelection();
    selectAllContents(element);
    element.dispatchEvent(new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: text,
    }));
    // Whether the dispatch above was cancelled (dispatchEvent returns false) doesn't
    // distinguish "a rich-text editor (ProseMirror/Lexical) intercepted it and applied the
    // change itself" from "it intercepted it and deferred to its own async model update" --
    // both look identical here. The read-back check below covers the first case (nothing
    // left to do) and drives the fallback for the second, so the fallback must run
    // regardless of whether the dispatch was accepted; gating it on acceptance skipped the
    // fallback in exactly the case it exists for.
    if (readEditable(element) !== text.trim()) {
      const inserted = typeof document.execCommand === "function" && document.execCommand("insertText", false, text);
      if (!inserted && typeof DataTransfer !== "undefined" && typeof ClipboardEvent !== "undefined") {
        const transfer = new DataTransfer();
        transfer.setData("text/plain", text);
        element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }));
      }
    }
    selection?.removeAllRanges();
  }
  element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function writeEditableThroughPaste(element: HTMLElement, text: string): boolean {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) return false;

  element.focus();
  const selection = window.getSelection();
  selectAllContents(element);

  const transfer = typeof DataTransfer === "undefined"
    ? { getData: (type: string) => type === "text/plain" ? text : "" }
    : new DataTransfer();
  if ("setData" in transfer) transfer.setData("text/plain", text);
  const pasteEvent = typeof ClipboardEvent === "undefined"
    ? new Event("paste", { bubbles: true, cancelable: true })
    : new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer as DataTransfer });
  if ((pasteEvent as ClipboardEvent).clipboardData !== transfer) {
    Object.defineProperty(pasteEvent, "clipboardData", { configurable: true, value: transfer });
  }
  const accepted = element.dispatchEvent(pasteEvent);
  selection?.removeAllRanges();

  return !accepted || readEditable(element) === text.trim();
}

export function firstVisible(selectors: readonly string[]): HTMLElement | null {
  const layoutAvailable = document.documentElement.getBoundingClientRect().width > 0;
  for (const selector of selectors) {
    const candidates = document.querySelectorAll<HTMLElement>(selector);
    for (const candidate of candidates) {
      const style = getComputedStyle(candidate);
      const hiddenFromUser = candidate.hidden
        || candidate.getAttribute("aria-hidden") === "true"
        || style.display === "none"
        || style.visibility === "hidden"
        || (layoutAvailable && candidate.getClientRects().length === 0);
      if (!hiddenFromUser) return candidate;
    }
  }
  return null;
}

const MAX_ANCHOR_WALK_DEPTH = 10;

export function findComposerAnchor(input: HTMLElement): HTMLElement {
  const form = input.closest<HTMLElement>("form");
  let element = input.parentElement;
  let depth = 0;
  while (element && element !== document.body && depth < MAX_ANCHOR_WALK_DEPTH) {
    const style = getComputedStyle(element);
    const hasVisibleBorder = [
      style.borderTopWidth,
      style.borderRightWidth,
      style.borderBottomWidth,
      style.borderLeftWidth,
      element.style.border,
      element.style.borderTop,
      element.style.borderRight,
      element.style.borderBottom,
      element.style.borderLeft,
    ].some((width) => Number.parseFloat(width) > 0);
    if (hasVisibleBorder) return element;
    element = element.parentElement;
    depth += 1;
  }
  return form?.parentElement ?? form ?? input.parentElement ?? input;
}

const DUPLICATE_SUBMIT_WINDOW_MS = 750;

export function installSubmitListener(
  getInput: () => HTMLElement | null,
  submitSelectors: readonly string[],
  callback: SubmitListener,
): () => void {
  let lastPrompt = "";
  let lastAt = 0;
  const emit = () => {
    const prompt = readEditable(getInput());
    const now = Date.now();
    if (!prompt || (prompt === lastPrompt && now - lastAt < DUPLICATE_SUBMIT_WINDOW_MS)) return;
    lastPrompt = prompt;
    lastAt = now;
    callback(prompt);
  };
  const keydown = (event: KeyboardEvent) => {
    const input = getInput();
    const target = event.target instanceof Node ? event.target : null;
    // isComposing is true while an IME composition is still open, e.g. the Enter a
    // Korean/Japanese/Chinese IME user presses to commit a composed character rather than
    // to send -- without this check that keystroke reads as a real submission.
    if (input && target && (target === input || input.contains(target)) && event.key === "Enter" && !event.isComposing && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) emit();
  };
  const click = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target && submitSelectors.some((selector) => target.closest(selector))) emit();
  };
  // The dedupe window above exists to collapse two events firing for the *same* physical
  // submission (e.g. an Enter keydown and the send button's own click both landing on one
  // Enter press), not to reject a genuinely new submission that happens to repeat the last
  // text. Any real input in the composer since the last emit means the user is actively
  // composing again, so it's safe -- and necessary -- to let the next matching submission
  // through even if the text ends up identical.
  const input = (event: Event) => {
    const composer = getInput();
    const target = event.target instanceof Node ? event.target : null;
    if (composer && target && (target === composer || composer.contains(target))) { lastPrompt = ""; lastAt = 0; }
  };
  document.addEventListener("keydown", keydown, true);
  document.addEventListener("click", click, true);
  document.addEventListener("input", input, true);
  return () => {
    document.removeEventListener("keydown", keydown, true);
    document.removeEventListener("click", click, true);
    document.removeEventListener("input", input, true);
  };
}
