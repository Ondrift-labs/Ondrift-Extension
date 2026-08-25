import { ProviderError } from "./errors";

export const VERIFY_LICENSE_URL = "https://ondrift.pages.dev/api/verify-license";

export interface LicenseVerification {
  status: "active";
  expiresAt: string;
}

interface LicenseSuccessResponse {
  ok?: boolean;
  status?: string;
  expiresAt?: string;
}

interface LicenseErrorResponse {
  code?: string;
}

export class LicenseProviderError extends ProviderError {
  constructor(
    message: string,
    public readonly licenseStatus: "invalid" | "expired",
  ) {
    super("license_invalid", message);
    this.name = "LicenseProviderError";
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function parseSuccess(payload: unknown): LicenseVerification {
  const response = payload as LicenseSuccessResponse | undefined;
  if (
    response?.ok !== true
    || response.status !== "active"
    || typeof response.expiresAt !== "string"
    || !response.expiresAt.trim()
    || !Number.isFinite(Date.parse(response.expiresAt))
  ) {
    throw new ProviderError("invalid_response", "Ondrift's license service returned an unexpected response.");
  }
  return { status: "active", expiresAt: response.expiresAt };
}

function classifyHttpError(status: number, payload: unknown): ProviderError {
  const error = payload as LicenseErrorResponse | undefined;
  if (status >= 500) {
    return new ProviderError("service_unavailable", "Ondrift's license service is temporarily unavailable.", true);
  }
  if (error?.code === "expired") {
    return new LicenseProviderError("This Ondrift Pro license has expired.", "expired");
  }
  if (
    status === 402
    || status === 404
    || error?.code === "not_found"
    || error?.code === "inactive"
    || error?.code === "license_invalid"
  ) {
    return new LicenseProviderError("This Ondrift Pro license is not valid.", "invalid");
  }
  if (status === 400 || error?.code === "invalid_request") {
    return new ProviderError("request_rejected", "Ondrift's license service rejected the license format.");
  }
  return new ProviderError("request_rejected", `Ondrift's license service rejected the request (HTTP ${status}).`);
}

export async function verifyLicense(
  licenseKey: string,
  fetcher: typeof fetch = (input, init) => fetch(input, init),
): Promise<LicenseVerification> {
  let response: Response;
  try {
    response = await fetcher(VERIFY_LICENSE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey }),
    });
  } catch (cause) {
    throw new ProviderError("network", "Chrome could not connect to Ondrift's license service.", true, { cause });
  }

  const payload = await readJson(response);
  if (response.ok) return parseSuccess(payload);
  throw classifyHttpError(response.status, payload);
}
