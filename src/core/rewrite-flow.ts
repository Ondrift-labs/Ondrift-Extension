import { normalizeWhitespace, type SiteAdapter } from "../adapters/site-adapter";
import type { HistoryEntry, RewriteResult } from "../shared/types";
import { rewritePrompt, sendRuntimeMessage } from "./rewrite-client";

// Sending the first message in a brand-new chat only gets a real conversation URL once the
// site's own router pushes it, which happens moments after the synchronous submit event this
// callback fires on -- reading getConversationUrl() immediately would capture the generic
// new-chat URL instead. This delay is a best-effort wait for that pushState, not a guarantee.
const CONVERSATION_URL_CAPTURE_DELAY_MS = 500;

function isNewChatUrl(service: SiteAdapter["id"], sourceUrl: string): boolean {
  try {
    const { pathname } = new URL(sourceUrl);
    const normalizedPath = pathname.replace(/\/+$/, "") || "/";
    switch (service) {
      case "chatgpt":
      case "perplexity":
      case "grok":
        return normalizedPath === "/";
      case "claude":
        return normalizedPath === "/" || normalizedPath === "/new";
      case "gemini":
        return normalizedPath === "/app";
    }
  } catch {
    return false;
  }
}

function isConversationUrl(service: SiteAdapter["id"], sourceUrl: string): boolean {
  try {
    const { pathname } = new URL(sourceUrl);
    switch (service) {
      case "chatgpt":
      case "grok":
        return /^\/c\/[^/]+/.test(pathname);
      case "claude":
        return /^\/chat\/[^/]+/.test(pathname);
      case "gemini":
        return /^\/app\/[^/]+/.test(pathname);
      case "perplexity":
        return /^\/search\/[^/]+/.test(pathname);
    }
  } catch {
    return false;
  }
}

function resolveConversationUrl(service: SiteAdapter["id"], submittedAtUrl: string, delayedUrl: string): string {
  if (!isNewChatUrl(service, submittedAtUrl)) return submittedAtUrl;
  try {
    const sameOrigin = new URL(delayedUrl).origin === new URL(submittedAtUrl).origin;
    return sameOrigin && isConversationUrl(service, delayedUrl) ? delayedUrl : submittedAtUrl;
  } catch {
    return submittedAtUrl;
  }
}

export class RewriteSession {
  private originalText = "";
  private result?: RewriteResult;
  private applied = false;
  private historyCaptureEnabled = false;
  private removeSubmitListener?: () => void;
  private readonly pendingHistoryCaptures = new Set<ReturnType<typeof setTimeout>>();

  constructor(private readonly adapter: SiteAdapter) {}

  async rewrite(persona?: string): Promise<RewriteResult> {
    this.removeSubmitListener?.();
    this.removeSubmitListener = undefined;
    this.result = undefined;
    const prompt = this.adapter.getPromptText();
    if (!prompt) throw new Error("Enter a prompt before rewriting.");
    this.originalText = prompt;
    this.applied = false;
    this.result = await rewritePrompt({ prompt, persona, service: this.adapter.id });
    this.armHistoryCapture();
    return this.result;
  }

  async apply(): Promise<void> {
    if (!this.result) throw new Error("No rewrite is ready to apply.");
    const expected = normalizeWhitespace(this.result.improvedText);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await this.adapter.setPromptText(this.result.improvedText);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (normalizeWhitespace(this.adapter.getPromptText()) === expected) {
        this.applied = true;
        return;
      }
    }
    this.applied = false;
    throw new Error("The site did not accept the rewritten prompt. Click Apply again or paste the suggestion manually.");
  }

  startHistoryCapture(): () => void {
    this.removeSubmitListener?.();
    this.removeSubmitListener = undefined;
    this.clearPendingHistoryCaptures();
    this.historyCaptureEnabled = true;
    this.armHistoryCapture();
    return () => {
      this.historyCaptureEnabled = false;
      this.removeSubmitListener?.();
      this.removeSubmitListener = undefined;
      this.clearPendingHistoryCaptures();
    };
  }

  private armHistoryCapture(): void {
    this.removeSubmitListener?.();
    this.removeSubmitListener = undefined;
    if (!this.historyCaptureEnabled || !this.result) return;
    this.removeSubmitListener = this.adapter.onSubmit((submittedText) => {
      this.removeSubmitListener?.();
      this.removeSubmitListener = undefined;
      const { adapter } = this;
      const result = this.result;
      if (!result) return;
      const submittedAtUrl = adapter.getConversationUrl();
      const entryWithoutUrl: Omit<HistoryEntry, "sourceUrl"> = {
        service: adapter.id,
        originalText: this.originalText,
        improvedText: result.improvedText,
        previousScore: result.previousScore,
        score: result.score,
        rationale: result.rationale,
        applied: this.applied && normalizeWhitespace(submittedText) === normalizeWhitespace(result.improvedText),
        createdAt: Date.now(),
        usageMetadata: result.usageMetadata,
      };
      this.originalText = "";
      this.result = undefined;
      this.applied = false;
      // Deferred so a brand-new chat's router has a chance to push its real conversation URL
      // before we read it -- see CONVERSATION_URL_CAPTURE_DELAY_MS above.
      const capture = setTimeout(() => {
        this.pendingHistoryCaptures.delete(capture);
        const sourceUrl = resolveConversationUrl(adapter.id, submittedAtUrl, adapter.getConversationUrl());
        const entry: HistoryEntry = { ...entryWithoutUrl, sourceUrl };
        void sendRuntimeMessage<number>({ type: "history_add", payload: entry }).catch(() => undefined);
      }, CONVERSATION_URL_CAPTURE_DELAY_MS);
      this.pendingHistoryCaptures.add(capture);
    });
  }

  private clearPendingHistoryCaptures(): void {
    for (const capture of this.pendingHistoryCaptures) clearTimeout(capture);
    this.pendingHistoryCaptures.clear();
  }
}
