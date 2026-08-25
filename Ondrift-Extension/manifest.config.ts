import { defineManifest } from "@crxjs/vite-plugin";

// Pins the extension id (see manifest_key_notes.md next to this file) so a locally loaded
// unpacked build keeps a stable chrome-extension:// origin across releases, regardless of
// which Downloads folder it's unpacked into. Chrome Web Store uploads must NOT include this
// field: the Store tracks its own key from the very first upload and rejects any later
// upload whose manifest `key` doesn't match it byte-for-byte ("매니페스트의 key 입력란
// 값이 현재 항목과 일치하지 않습니다"). Build with ONDRIFT_BUILD_TARGET=store set to omit
// it for a Store-bound package.
const isStoreBuild = process.env.ONDRIFT_BUILD_TARGET === "store";
const devKey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlXQhrqYdPRfDArp9pwwBu9qvnVsz2n8pGvE+bOTjvtmsMyDRF8sEkQmNNcu/MNPC/GUlBUDEppO1L+XI9vKyde30wL7ZLQQ3VoGUn5yI0sacAWffDYpvMJ5iz0TN02G2vHN9Q/d1qUTHNg818YE4b71kJNEeUATgI0kAfn00amK3I4OPF6ZZb02nhfyT0z1HxA+AjheCkCZAKgyxJKhXb1heJ9LxBSmqrOLUpXpqVdIgDo6TAGNAEsnxbzhsKG+xdjfqE+GIs+ZD/sS0HybPPYYA0sjcPiuGamOkYHR0XHhwK+jIYxABfOEfnSQw/HVtrtc1yHZ+awVvnigSnEkgSwIDAQAB";

export const manifest = {
  manifest_version: 3,
  name: "Ondrift",
  short_name: "Ondrift",
  ...(isStoreBuild ? {} : { key: devKey }),
  version: "0.2.4",
  minimum_chrome_version: "116",
  description:
    "Rewrite and score prompts on ChatGPT, Claude, Gemini, Perplexity, and Grok with 3 free daily rewrites, Pro, or your own Gemini key.",
  homepage_url: "https://ondrift.pages.dev/",
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
    "https://grok.com/*",
    "https://generativelanguage.googleapis.com/*",
    "https://ondrift.pages.dev/*"
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
        "https://perplexity.ai/*",
        "https://grok.com/*"
      ],
      js: ["src/content.ts"],
      run_at: "document_idle"
    }
  ],
  web_accessible_resources: [
    {
      resources: ["icons/ondrift-32.png"],
      matches: [
        "https://chatgpt.com/*",
        "https://claude.ai/*",
        "https://gemini.google.com/*",
        "https://www.perplexity.ai/*",
        "https://perplexity.ai/*",
        "https://grok.com/*"
      ]
    }
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'"
  }
} satisfies chrome.runtime.ManifestV3;

export default defineManifest(manifest);
