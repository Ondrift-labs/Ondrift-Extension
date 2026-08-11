import type { SiteId } from "../shared/types";

export type SubmitListener = (prompt: string) => void;

export interface SiteAdapter {
  readonly id: SiteId;
  matches(url: string): boolean;
  getInputElement(): HTMLElement | null;
  getComposerAnchor?(input: HTMLElement): HTMLElement | null;
  getPromptText(): string;
  setPromptText(text: string): void;
  getConversationTitle(): string | null;
  getConversationUrl(): string;
  onSubmit(callback: SubmitListener): () => void;
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

export function writeEditable(element: HTMLElement, text: string): void {
  element.focus();
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(element, text);
  } else {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
    const beforeInputAccepted = element.dispatchEvent(new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: text,
    }));
    if (beforeInputAccepted && readEditable(element) !== text.trim()) {
      const inserted = typeof document.execCommand === "function" && document.execCommand("insertText", false, text);
      if (!inserted && typeof DataTransfer !== "undefined" && typeof ClipboardEvent !== "undefined") {
        const transfer = new DataTransfer();
        transfer.setData("text/plain", text);
        element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }));
      }
    }
    selection?.removeAllRanges();
    if (!beforeInputAccepted) return;
  }
  element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function writeEditableThroughPaste(element: HTMLElement, text: string): boolean {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) return false;

  element.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection?.removeAllRanges();
  selection?.addRange(range);

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

export function findComposerAnchor(input: HTMLElement): HTMLElement {
  const form = input.closest<HTMLElement>("form");
  let element = input.parentElement;
  let depth = 0;
  while (element && element !== document.body && depth < 10) {
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
    if (!prompt || (prompt === lastPrompt && now - lastAt < 750)) return;
    lastPrompt = prompt;
    lastAt = now;
    callback(prompt);
  };
  const keydown = (event: KeyboardEvent) => {
    const input = getInput();
    const target = event.target instanceof Node ? event.target : null;
    if (input && target && (target === input || input.contains(target)) && event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) emit();
  };
  const click = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target && submitSelectors.some((selector) => target.closest(selector))) emit();
  };
  document.addEventListener("keydown", keydown, true);
  document.addEventListener("click", click, true);
  return () => {
    document.removeEventListener("keydown", keydown, true);
    document.removeEventListener("click", click, true);
  };
}
