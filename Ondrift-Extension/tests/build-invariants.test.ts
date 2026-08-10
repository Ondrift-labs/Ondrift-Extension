import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

describe("build entrypoints", () => {
  it.each([
    ["popup.html", "/src/entries/PopupEntry.tsx"],
    ["options.html", "/src/entries/OptionsEntry.tsx"],
  ])("wires %s to its React entry", async (file, entry) => {
    const html = await readFile(resolve(projectRoot, file), "utf8");

    expect(html).toContain('id="root"');
    expect(html).toContain(`src="${entry}"`);
    expect(html).not.toMatch(/https?:\/\/.*<script/i);
  });

  it("keeps the release pipeline deterministic", async () => {
    const packageJson = JSON.parse(
      await readFile(resolve(projectRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts.build).toBe(
      "tsc --noEmit && vite build && node scripts/verify-build.mjs",
    );
    expect(packageJson.scripts.check).toContain("npm run lint");
    expect(packageJson.scripts.check).toContain("npm run test");
    expect(packageJson.scripts.check).toContain("npm run build");
  });

  it("opens local onboarding on first install", async () => {
    const backgroundEntry = await readFile(
      resolve(projectRoot, "src/entries/BackgroundEntry.ts"),
      "utf8",
    );

    expect(backgroundEntry).toContain("chrome.runtime.onInstalled.addListener");
    expect(backgroundEntry).toContain('details.reason === "install"');
    expect(backgroundEntry).toContain("chrome.runtime.openOptionsPage()");
  });
});
