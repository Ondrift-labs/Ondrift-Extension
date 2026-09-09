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

  it("links the extension identity to the official Ondrift website", () => {
    expect(manifest.name).toBe("Ondrift");
    expect(manifest.short_name).toBe("Ondrift");
    expect(manifest.homepage_url).toBe("https://ondrift.pages.dev/");
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
      "https://grok.com/*",
      "https://generativelanguage.googleapis.com/*",
      "https://ondrift.pages.dev/*",
    ]);
    expect(manifest.host_permissions).not.toContain("<all_urls>");
    expect(manifest.content_scripts[0].matches).toEqual([
      "https://chatgpt.com/*",
      "https://claude.ai/*",
      "https://gemini.google.com/*",
      "https://www.perplexity.ai/*",
      "https://perplexity.ai/*",
      "https://grok.com/*",
    ]);
  });

  it("keeps executable code local to the extension", () => {
    expect(manifest.content_security_policy.extension_pages).toBe(
      "script-src 'self'; object-src 'self'",
    );
  });

  it("exposes only the Ondrift logo to supported web apps", () => {
    expect(manifest.web_accessible_resources).toEqual([
      {
        resources: ["icons/ondrift-32.png"],
        matches: manifest.content_scripts[0].matches,
      },
    ]);
  });

  it("uses the Ondrift artwork for extension and toolbar icons", () => {
    expect(manifest.icons).toEqual({
      16: "icons/ondrift-16.png",
      32: "icons/ondrift-32.png",
      48: "icons/ondrift-48.png",
      128: "icons/ondrift-128.png",
    });
    expect(manifest.action.default_icon).toEqual({
      16: "icons/ondrift-16.png",
      32: "icons/ondrift-32.png",
      48: "icons/ondrift-48.png",
    });
  });
});
