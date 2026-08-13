import { afterEach, describe, expect, it, vi } from "vitest";

import { uiBridge } from "../src/core/ui-bridge";

describe("open options bridge", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("routes through the background worker", async () => {
    const sendMessage = vi.fn(async () => ({ ok: true, data: undefined }));
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    await uiBridge.openOptions();

    expect(sendMessage).toHaveBeenCalledOnce();
    expect(sendMessage).toHaveBeenCalledWith({ type: "open_options" });
  });
});
