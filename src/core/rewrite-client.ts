import type { RewriteRequest, RewriteResult, RuntimeRequest, RuntimeResponse } from "../shared/types";
import { ProviderError } from "../providers/errors";

export async function sendRuntimeMessage<T>(message: RuntimeRequest): Promise<T> {
  const response = await chrome.runtime.sendMessage(message) as RuntimeResponse<T>;
  if (!response?.ok) {
    const error = response?.error;
    throw new ProviderError(error?.code ?? "unknown", error?.message ?? "Ondrift did not receive a response.", error?.retryable ?? false);
  }
  return response.data;
}

export function rewritePrompt(payload: RewriteRequest): Promise<RewriteResult> {
  return sendRuntimeMessage<RewriteResult>({ type: "rewrite", payload });
}
