import { describe, expect, it } from "vitest";

import { manifest } from "../manifest.config";

describe("extension manifest", () => {
  it("uses Manifest V3 with a module service worker", () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.background).toEqual({
      service_worker: "src/entries/BackgroundEntry.ts",
      type: "module",
    });
  });

  it("requests only the local storage permission", () => {
    expect(manifest.permissions).toEqual(["storage"]);
    expect(manifest.permissions).not.toContain("tabs");
    expect(manifest.permissions).not.toContain("history");
  });

  it("limits page access to supported sites and Gemini", () => {
    expect(manifest.host_permissions).toEqual([
      "https://chatgpt.com/*",
      "https://claude.ai/*",
      "https://gemini.google.com/*",
      "https://www.perplexity.ai/*",
      "https://perplexity.ai/*",
      "https://generativelanguage.googleapis.com/*",
    ]);
    expect(manifest.host_permissions).not.toContain("<all_urls>");
    expect(manifest.content_scripts[0].matches).toEqual([
      "https://chatgpt.com/*",
      "https://claude.ai/*",
      "https://gemini.google.com/*",
      "https://www.perplexity.ai/*",
      "https://perplexity.ai/*",
    ]);
  });

  it("keeps executable code local to the extension", () => {
    expect(manifest.content_security_policy.extension_pages).toBe(
      "script-src 'self'; object-src 'self'",
    );
  });
});
