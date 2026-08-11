import type { ProviderId, RewriteRequest, RewriteResult } from "../shared/types";

export interface LLMProvider {
  readonly id: ProviderId;
  rewrite(request: RewriteRequest, apiKey: string): Promise<RewriteResult>;
  validateKey(apiKey: string, model?: string): Promise<void>;
}
