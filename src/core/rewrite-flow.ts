import { normalizeWhitespace, type SiteAdapter } from "../adapters/site-adapter";
import type { HistoryEntry, RewriteResult } from "../shared/types";
import { rewritePrompt, sendRuntimeMessage } from "./rewrite-client";

// Sending the first message in a brand-new chat only gets a real conversation URL once the
// site's own router pushes it, which happens moments after the synchronous submit event this
// callback fires on -- reading getConversationUrl() immediately would capture the generic
// new-chat URL instead. This delay is a best-effort wait for that pushState, not a guarantee.
const CONVERSATION_URL_CAPTURE_DELAY_MS = 500;

export class RewriteSession {
  private originalText = "";
  private result?: RewriteResult;
  private applied = false;
  private removeSubmitListener?: () => void;

  constructor(private readonly adapter: SiteAdapter) {}

  async rewrite(persona?: string): Promise<RewriteResult> {
    const prompt = this.adapter.getPromptText();
    if (!prompt) throw new Error("Enter a prompt before rewriting.");
    this.originalText = prompt;
    this.applied = false;
    this.result = await rewritePrompt({ prompt, persona, service: this.adapter.id });
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
    this.removeSubmitListener = this.adapter.onSubmit((submittedText) => {
      const { adapter } = this;
      const entryWithoutUrl: Omit<HistoryEntry, "sourceUrl"> = {
        service: adapter.id,
        originalText: this.originalText || submittedText,
        improvedText: this.result?.improvedText,
        previousScore: this.result?.previousScore,
        score: this.result?.score,
        rationale: this.result?.rationale,
        applied: this.applied && this.result !== undefined && normalizeWhitespace(submittedText) === normalizeWhitespace(this.result.improvedText),
        createdAt: Date.now(),
        usageMetadata: this.result?.usageMetadata,
      };
      // Deferred so a brand-new chat's router has a chance to push its real conversation URL
      // before we read it -- see CONVERSATION_URL_CAPTURE_DELAY_MS above.
      setTimeout(() => {
        const entry: HistoryEntry = { ...entryWithoutUrl, sourceUrl: adapter.getConversationUrl() };
        void sendRuntimeMessage<number>({ type: "history_add", payload: entry }).catch(() => undefined);
      }, CONVERSATION_URL_CAPTURE_DELAY_MS);
      this.originalText = "";
      this.result = undefined;
      this.applied = false;
    });
    return () => {
      this.removeSubmitListener?.();
      this.removeSubmitListener = undefined;
    };
  }
}
