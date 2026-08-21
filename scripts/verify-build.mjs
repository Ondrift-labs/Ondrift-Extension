import { access, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const distRoot = resolve(projectRoot, "dist");
const manifest = JSON.parse(await readFile(resolve(distRoot, "manifest.json"), "utf8"));

function invariant(condition, message) {
  if (!condition) throw new Error(`Build invariant failed: ${message}`);
}

invariant(manifest.manifest_version === 3, "emitted manifest must use MV3");
invariant(manifest.background?.type === "module", "service worker must be a module");
invariant(
  JSON.stringify(manifest.permissions) === JSON.stringify(["storage"]),
  "storage must be the only extension permission",
);
invariant(
  JSON.stringify(manifest.host_permissions) === JSON.stringify([
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://www.perplexity.ai/*",
    "https://perplexity.ai/*",
    "https://grok.com/*",
    "https://generativelanguage.googleapis.com/*",
  ]),
  "host access must be limited to supported AI sites and the Gemini API",
);
invariant(
  JSON.stringify(manifest.content_scripts?.[0]?.matches) === JSON.stringify([
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://www.perplexity.ai/*",
    "https://perplexity.ai/*",
    "https://grok.com/*",
  ]),
  "content script access must be limited to supported AI sites",
);
invariant(manifest.action?.default_popup === "popup.html", "popup entry is missing");
invariant(manifest.options_ui?.page === "options.html", "options entry is missing");
invariant(manifest.icons?.[128] === "icons/ondrift-128.png", "Ondrift extension artwork is missing");

const emittedEntries = [
  manifest.background.service_worker,
  ...manifest.content_scripts.flatMap((entry) => entry.js ?? []),
  manifest.action.default_popup,
  manifest.options_ui.page,
];
await Promise.all(emittedEntries.map((entry) => access(resolve(distRoot, entry))));
await Promise.all(Object.values(manifest.icons).map((entry) => access(resolve(distRoot, entry))));

const outputFiles = await readdir(distRoot, { recursive: true });
invariant(
  outputFiles.every((file) => !file.endsWith(".map")),
  "production bundle must not contain source maps",
);

const textOutput = (
  await Promise.all(
    outputFiles
      .filter((file) => /\.(?:html|js|json)$/i.test(file))
      .map((file) => readFile(resolve(distRoot, file), "utf8")),
  )
).join("\n");
invariant(
  !/(?:localhost|127\.0\.0\.1|\/api\/v1|supabase|cloud sync)/i.test(textOutput),
  "production bundle must not contain backend or dashboard integration",
);

console.log(`Verified ${emittedEntries.length} MV3 build entrypoints.`);
