import type { RewriteRequest, RewriteResult } from "../shared/types";
import { ProviderError } from "./errors";

export const FREE_TIER_REWRITE_URL = "https://ondrift.pages.dev/api/rewrite";
const MAX_ATTEMPTS = 3;

interface FreeTierSuccessResponse {
  ok?: boolean;
  data?: Partial<RewriteResult>;
  remaining?: number;
}

interface FreeTierErrorResponse {
  code?: string;
  resetAt?: string;
}

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function parseSuccess(payload: unknown): RewriteResult & { remaining: number } {
  const response = payload as FreeTierSuccessResponse | undefined;
  const result = response?.data;
  if (
    response?.ok !== true
    || typeof result?.improvedText !== "string"
    || !result.improvedText.trim()
    || typeof result.previousScore !== "number"
    || !Number.isFinite(result.previousScore)
    || typeof result.score !== "number"
    || !Number.isFinite(result.score)
    || typeof result.rationale !== "string"
    || typeof response.remaining !== "number"
    || !Number.isInteger(response.remaining)
  ) {
    throw new ProviderError("unknown", "Ondrift's free rewrite service returned an unexpected response.");
  }
  return {
    improvedText: result.improvedText.trim(),
    previousScore: result.previousScore,
    score: result.score,
    rationale: result.rationale.trim(),
    remaining: response.remaining,
  };
}

function classifyHttpError(status: number, payload: unknown): ProviderError {
  const error = payload as FreeTierErrorResponse | undefined;
  if (status === 402 && error?.code === "license_invalid") {
    return new ProviderError("license_invalid", "The saved Ondrift Pro license is no longer valid.");
  }
  if (status === 429 && error?.code === "daily_limit_reached") {
    const reset = typeof error.resetAt === "string" ? ` Try again after ${error.resetAt}.` : "";
    return new ProviderError("daily_limit_reached", `Today's 3 free rewrites have been used.${reset}`);
  }
  if (status === 502 || status === 503) {
    return new ProviderError("service_unavailable", "Ondrift's free rewrite service is temporarily unavailable.", true);
  }
  return new ProviderError("unknown", `Ondrift's free rewrite service rejected the request (HTTP ${status}).`);
}

export async function rewriteViaFreeTier(
  request: RewriteRequest,
  installId: string,
  fetcher: typeof fetch = (input, init) => fetch(input, init),
  sleep: (milliseconds: number) => Promise<void> = wait,
  licenseKey?: string,
): Promise<RewriteResult & { remaining: number }> {
  let lastError: ProviderError | undefined;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      response = await fetcher(FREE_TIER_REWRITE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: request.prompt,
          service: request.service,
          persona: request.persona,
          language: request.language,
          installId,
          ...(licenseKey?.trim() ? { licenseKey: licenseKey.trim() } : {}),
        }),
      });
    } catch (cause) {
      lastError = new ProviderError("network", "Chrome could not connect to Ondrift's free rewrite service.", true, { cause });
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(250 * (2 ** attempt));
        continue;
      }
      throw lastError;
    }

    const payload = await readJson(response);
    if (response.ok) return parseSuccess(payload);

    lastError = classifyHttpError(response.status, payload);
    if (response.status >= 500 && attempt < MAX_ATTEMPTS - 1) {
      await sleep(250 * (2 ** attempt));
      continue;
    }
    throw lastError;
  }
  throw lastError ?? new ProviderError("unknown", "Ondrift's free rewrite request failed.");
}
