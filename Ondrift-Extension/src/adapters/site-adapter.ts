import type { SiteId } from "../shared/types";

export type SubmitListener = (prompt: string) => void;

export interface SiteAdapter {
  readonly id: SiteId;
  matches(url: string): boolean;
  getInputElement(): HTMLElement | null;
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
    const inserted = typeof document.execCommand === "function" && document.execCommand("insertText", false, text);
    if (!inserted) element.textContent = text;
    selection?.removeAllRanges();
  }
  element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function firstVisible(selectors: readonly string[]): HTMLElement | null {
  for (const selector of selectors) {
    const candidates = document.querySelectorAll<HTMLElement>(selector);
    for (const candidate of candidates) {
      const style = getComputedStyle(candidate);
      if (!candidate.hidden && style.display !== "none" && style.visibility !== "hidden") return candidate;
    }
  }
  return null;
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
