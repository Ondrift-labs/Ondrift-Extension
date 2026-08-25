import { describe, expect, it, vi } from "vitest";
import { LicenseProviderError, VERIFY_LICENSE_URL, verifyLicense } from "../src/providers/license.provider";

describe("verifyLicense", () => {
  it("posts the license code and returns an active license expiry", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      status: "active",
      expiresAt: "2027-08-25T00:00:00.000Z",
    }), { status: 200 }));

    await expect(verifyLicense("ONDR-ABCD-1234", fetcher as typeof fetch)).resolves.toEqual({
      status: "active",
      expiresAt: "2027-08-25T00:00:00.000Z",
    });
    expect(fetcher).toHaveBeenCalledWith(VERIFY_LICENSE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey: "ONDR-ABCD-1234" }),
    });
  });

  it.each([
    [402, "license_invalid"],
    [404, "not_found"],
    [409, "inactive"],
  ])("classifies HTTP %s/%s as an invalid license", async (status, code) => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ code }), { status }));

    const promise = verifyLicense("ONDR-BAD0-0000", fetcher as typeof fetch);
    await expect(promise).rejects.toMatchObject({ code: "license_invalid", licenseStatus: "invalid", retryable: false });
  });

  it("preserves an explicit expired state on license rejection", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ code: "expired" }), { status: 410 }));

    const error = await verifyLicense("ONDR-OLD0-0000", fetcher as typeof fetch).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(LicenseProviderError);
    expect(error).toMatchObject({ code: "license_invalid", licenseStatus: "expired", retryable: false });
  });

  it("classifies malformed requests as request_rejected", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ code: "invalid_request" }), { status: 400 }));

    await expect(verifyLicense("bad", fetcher as typeof fetch))
      .rejects.toMatchObject({ code: "request_rejected", retryable: false });
  });

  it("classifies server failures as retryable service_unavailable errors", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ code: "server_error" }), { status: 503 }));

    await expect(verifyLicense("ONDR-ABCD-1234", fetcher as typeof fetch))
      .rejects.toMatchObject({ code: "service_unavailable", retryable: true });
  });

  it("classifies connection failures as retryable network errors without retrying", async () => {
    const fetcher = vi.fn(async () => { throw new TypeError("offline"); });

    await expect(verifyLicense("ONDR-ABCD-1234", fetcher as typeof fetch))
      .rejects.toMatchObject({ code: "network", retryable: true });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("rejects malformed success payloads as invalid_response", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: true, status: "active" }), { status: 200 }));

    await expect(verifyLicense("ONDR-ABCD-1234", fetcher as typeof fetch))
      .rejects.toMatchObject({ code: "invalid_response", retryable: false });
  });
});
