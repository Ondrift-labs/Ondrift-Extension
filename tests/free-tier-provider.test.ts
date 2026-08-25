import { describe, expect, it, vi } from "vitest";
import { FREE_TIER_REWRITE_URL, rewriteViaFreeTier } from "../src/providers/free-tier.provider";
import { providerErrorReason } from "../src/providers/errors";

const successResponse = () => new Response(JSON.stringify({
  ok: true,
  data: { improvedText: "Better", previousScore: 40, score: 88, rationale: "Clearer" },
  remaining: 2,
}), { status: 200 });

describe("rewriteViaFreeTier", () => {
  it("maps the server quota code to the widget's daily-limit reason", () => {
    expect(providerErrorReason("daily_limit_reached")).toBe("daily_limit");
  });

  it("posts the exact proxy payload and returns the rewrite with remaining quota", async () => {
    const fetcher = vi.fn<(_input: RequestInfo | URL, _init?: RequestInit) => Promise<Response>>(async () => successResponse());

    await expect(rewriteViaFreeTier({
      prompt: "hello", service: "chatgpt", persona: "writer", language: "ja", model: "must-not-leak",
    }, "00000000-0000-4000-8000-000000000004", fetcher as typeof fetch, vi.fn()))
      .resolves.toEqual({ improvedText: "Better", previousScore: 40, score: 88, rationale: "Clearer", remaining: 2 });

    expect(fetcher).toHaveBeenCalledWith(FREE_TIER_REWRITE_URL, expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }));
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      prompt: "hello", service: "chatgpt", persona: "writer", language: "ja",
      installId: "00000000-0000-4000-8000-000000000004",
    });
  });

  it("includes a Pro license only when one is present", async () => {
    const fetcher = vi.fn<(_input: RequestInfo | URL, _init?: RequestInit) => Promise<Response>>(async () => successResponse());

    await rewriteViaFreeTier(
      { prompt: "hello", service: "chatgpt" },
      "install-id",
      fetcher as typeof fetch,
      vi.fn(),
      " ONDR-ABCD-1234 ",
    );

    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      prompt: "hello",
      service: "chatgpt",
      installId: "install-id",
      licenseKey: "ONDR-ABCD-1234",
    });
  });

  it("classifies an explicit license rejection separately from the daily limit", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ code: "license_invalid" }), { status: 402 }));

    await expect(rewriteViaFreeTier({ prompt: "hello", service: "chatgpt" }, "id", fetcher as typeof fetch, vi.fn(), "ONDR-BAD0-0000"))
      .rejects.toMatchObject({ code: "license_invalid", retryable: false });
    expect(providerErrorReason("license_invalid")).toBe("license_invalid");
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("does not retry a daily-limit response", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      code: "daily_limit_reached", resetAt: "2026-08-25T00:00:00.000Z",
    }), { status: 429 }));
    const sleep = vi.fn(async () => undefined);

    const promise = rewriteViaFreeTier({ prompt: "hello", service: "claude" }, "id", fetcher as typeof fetch, sleep);
    await expect(promise).rejects.toMatchObject({ code: "daily_limit_reached", retryable: false });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries transient 5xx responses with backoff and classifies exhaustion", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ code: "service_unavailable" }), { status: 503 }));
    const sleep = vi.fn(async () => undefined);

    const promise = rewriteViaFreeTier({ prompt: "hello", service: "gemini" }, "id", fetcher as typeof fetch, sleep);
    await expect(promise).rejects.toMatchObject({ code: "service_unavailable", retryable: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 250);
    expect(sleep).toHaveBeenNthCalledWith(2, 500);
  });

  it("retries network failures and preserves the network classification", async () => {
    const fetcher = vi.fn(async () => { throw new TypeError("offline"); });
    const sleep = vi.fn(async () => undefined);

    const promise = rewriteViaFreeTier({ prompt: "hello", service: "grok" }, "id", fetcher as typeof fetch, sleep);
    await expect(promise).rejects.toMatchObject({ code: "network", retryable: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("classifies unexpected failures as unknown", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ code: "bad_request" }), { status: 400 }));

    await expect(rewriteViaFreeTier({ prompt: "hello", service: "perplexity" }, "id", fetcher as typeof fetch, vi.fn()))
      .rejects.toMatchObject({ code: "unknown", retryable: false });
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
