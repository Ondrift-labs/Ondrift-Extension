import type { ProviderErrorCode, SerializedProviderError } from "../shared/types";

export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly retryable = false,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ProviderError";
  }
}

export function serializeProviderError(error: unknown): SerializedProviderError {
  if (error instanceof ProviderError) {
    return { code: error.code, message: error.message, retryable: error.retryable };
  }
  return {
    code: "unknown",
    message: "Ondrift could not complete the rewrite.",
    retryable: false,
  };
}
