import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import manifest from "./manifest.config.ts";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    emptyOutDir: true,
    sourcemap: false,
    target: "es2022",
    // Extension pages load their scripts from a local chrome-extension:// bundle,
    // so modulepreload gives no real benefit here. Some of the preloaded chunks
    // (e.g. errors.ts, rewrite-client.ts) are shared with the content script and
    // are also listed in web_accessible_resources for the page world, which makes
    // Chrome log a harmless but noisy "cross-world extension resource mismatch"
    // warning for the unused preload hint. Disabling modulePreload removes the
    // <link rel="modulepreload"> tags entirely.
    modulePreload: false,
  },
});
