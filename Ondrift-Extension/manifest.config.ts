import { defineManifest } from "@crxjs/vite-plugin";

export const manifest = {
  manifest_version: 3,
  name: "Ondrift",
  short_name: "Ondrift",
  version: "0.1.0",
  minimum_chrome_version: "116",
  description:
    "Rewrite and score prompts on ChatGPT, Claude, Gemini, and Perplexity with your own Gemini API key.",
  icons: {
    16: "icons/ondrift-16.png",
    32: "icons/ondrift-32.png",
    48: "icons/ondrift-48.png",
    128: "icons/ondrift-128.png"
  },
  permissions: ["storage"],
  host_permissions: [
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://www.perplexity.ai/*",
    "https://perplexity.ai/*",
    "https://generativelanguage.googleapis.com/*"
  ],
  action: {
    default_title: "Open Ondrift",
    default_popup: "popup.html",
    default_icon: {
      16: "icons/ondrift-16.png",
      32: "icons/ondrift-32.png",
      48: "icons/ondrift-48.png"
    }
  },
  options_ui: {
    page: "options.html",
    open_in_tab: true
  },
  background: {
    service_worker: "src/entries/BackgroundEntry.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: [
        "https://chatgpt.com/*",
        "https://claude.ai/*",
        "https://gemini.google.com/*",
        "https://www.perplexity.ai/*",
        "https://perplexity.ai/*"
      ],
      js: ["src/content.ts"],
      run_at: "document_idle"
    }
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'"
  }
} satisfies chrome.runtime.ManifestV3;

export default defineManifest(manifest);
