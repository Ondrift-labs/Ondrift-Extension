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

/**
 * True when `error` is the plain Error `chrome.runtime.sendMessage` throws once this tab's
 * extension context has been invalidated (e.g. by an extension reload/update) -- distinct
 * from a `ProviderError`, which means the background was reachable and reported a failure.
 */
export function isExtensionContextInvalidated(error: unknown): boolean {
  return error instanceof Error && error.message.includes("Extension context invalidated");
}
