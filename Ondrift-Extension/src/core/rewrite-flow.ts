import type { SiteAdapter } from "../adapters/site-adapter";
import type { HistoryEntry, RewriteResult } from "../shared/types";
import { rewritePrompt, sendRuntimeMessage } from "./rewrite-client";

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

  apply(): void {
    if (!this.result) throw new Error("No rewrite is ready to apply.");
    this.adapter.setPromptText(this.result.improvedText);
    this.applied = true;
  }

  startHistoryCapture(): () => void {
    this.removeSubmitListener?.();
    this.removeSubmitListener = this.adapter.onSubmit((submittedText) => {
      const entry: HistoryEntry = {
        service: this.adapter.id,
        sourceUrl: this.adapter.getConversationUrl(),
        originalText: this.originalText || submittedText,
        improvedText: this.result?.improvedText,
        score: this.result?.score,
        rationale: this.result?.rationale,
        applied: this.applied && submittedText === this.result?.improvedText,
        createdAt: Date.now(),
        usageMetadata: this.result?.usageMetadata,
      };
      void sendRuntimeMessage<number>({ type: "history_add", payload: entry }).catch(() => undefined);
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
