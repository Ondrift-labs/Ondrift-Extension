import { afterEach, describe, expect, it, vi } from "vitest";

import { uiBridge } from "../src/core/ui-bridge";
import { chromeUiBridge } from "../src/ui/shared/chromeBridge";

describe("open options bridge", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["active UI bridge", uiBridge],
    ["legacy UI bridge", chromeUiBridge],
  ])("routes %s through the background worker", async (_name, bridge) => {
    const sendMessage = vi.fn(async () => ({ ok: true, data: undefined }));
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    await bridge.openOptions();

    expect(sendMessage).toHaveBeenCalledOnce();
    expect(sendMessage).toHaveBeenCalledWith({ type: "open_options" });
  });
});
