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

export type ProviderErrorReason = "quota" | "daily_limit" | "license_invalid" | "invalid_key" | "network" | "request" | "unavailable" | "unknown";

/** Maps a provider error code to the coarser reason category the UI surfaces to the user. */
export function providerErrorReason(code: ProviderErrorCode): ProviderErrorReason {
  switch (code) {
    case "quota_exceeded": return "quota";
    case "daily_limit_reached": return "daily_limit";
    case "license_invalid": return "license_invalid";
    case "invalid_key": return "invalid_key";
    case "network": return "network";
    case "request_rejected": return "request";
    case "model_unavailable":
    case "service_unavailable": return "unavailable";
    default: return "unknown";
  }
}
