import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SETTINGS } from "../src/storage/settings";

const mocks = vi.hoisted(() => ({
  sendRuntimeMessage: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  storageListener: undefined as ((changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void) | undefined,
}));

vi.mock("../src/core/rewrite-client", () => ({
  sendRuntimeMessage: mocks.sendRuntimeMessage,
  isExtensionContextInvalidated: (error: unknown) => error instanceof Error && error.message.includes("Extension context invalidated"),
}));

vi.mock("../src/core/content-controller", () => ({
  contentController: {
    subscribe: vi.fn(() => vi.fn()),
    start: mocks.start,
    stop: mocks.stop,
    rewrite: vi.fn(),
    apply: vi.fn(),
  },
}));

vi.mock("../src/core/adapter-registry", () => ({
  adapterRegistry: {
    resolve: vi.fn(() => ({ id: "chatgpt" })),
  },
}));

vi.mock("../src/ui/inline-widget", () => ({
  createInlineWidget: vi.fn(() => ({
    element: document.createElement("div"),
    dragHandle: document.createElement("button"),
    resizeHandle: document.createElement("button"),
    setState: vi.fn(),
    setLanguage: vi.fn(),
    setRepositioned: vi.fn(),
    reattach: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock("../src/core/floating-widget-position", () => ({
  placeFloatingWidget: vi.fn(),
}));

describe("content-script startup settings recovery", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    mocks.sendRuntimeMessage.mockReset();
    mocks.start.mockReset();
    mocks.stop.mockReset();
    mocks.storageListener = undefined;
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    vi.stubGlobal("chrome", {
      storage: {
        onChanged: {
          addListener: vi.fn((listener) => { mocks.storageListener = listener; }),
          removeListener: vi.fn(),
        },
      },
    });
  });

  afterEach(() => {
    const removableWindow = window as unknown as {
      removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    };
    for (const [type, listener, options] of addEventListenerSpy.mock.calls) {
      removableWindow.removeEventListener(String(type), listener as EventListenerOrEventListenerObject, options as boolean | EventListenerOptions | undefined);
    }
    addEventListenerSpy.mockRestore();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("cancels every stale retry when overlapping boots cross lifecycle boundaries", async () => {
    const neverResolvingSettings = new Promise<typeof DEFAULT_SETTINGS>(() => undefined);
    mocks.sendRuntimeMessage
      .mockReturnValueOnce(neverResolvingSettings)
      .mockRejectedValueOnce(new Error("Extension context invalidated"))
      .mockRejectedValueOnce(new Error("Extension context invalidated"))
      .mockResolvedValue(DEFAULT_SETTINGS);

    await import("../src/core/content-script");
    window.dispatchEvent(new Event("pagehide"));

    const firstRestore = new Event("pageshow");
    Object.defineProperty(firstRestore, "persisted", { value: true });
    window.dispatchEvent(firstRestore);
    const overlappingRestore = new Event("pageshow");
    Object.defineProperty(overlappingRestore, "persisted", { value: true });
    window.dispatchEvent(overlappingRestore);
    await Promise.resolve();

    window.dispatchEvent(new Event("pagehide"));
    const currentRestore = new Event("pageshow");
    Object.defineProperty(currentRestore, "persisted", { value: true });
    window.dispatchEvent(currentRestore);
    await vi.runAllTimersAsync();

    expect(mocks.sendRuntimeMessage).toHaveBeenCalledTimes(4);
    expect(mocks.start).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ignores a pre-pagehide settings response after a bfcache restore starts a new lifecycle", async () => {
    let resolveStaleSettings!: (settings: typeof DEFAULT_SETTINGS) => void;
    const staleSettings = new Promise<typeof DEFAULT_SETTINGS>((resolve) => {
      resolveStaleSettings = resolve;
    });
    mocks.sendRuntimeMessage
      .mockReturnValueOnce(staleSettings)
      .mockResolvedValueOnce(DEFAULT_SETTINGS);

    await import("../src/core/content-script");
    expect(mocks.sendRuntimeMessage).toHaveBeenCalledOnce();

    window.dispatchEvent(new Event("pagehide"));
    const pageshow = new Event("pageshow");
    Object.defineProperty(pageshow, "persisted", { value: true });
    window.dispatchEvent(pageshow);
    await vi.runAllTimersAsync();

    expect(mocks.start).toHaveBeenCalledOnce();

    resolveStaleSettings(DEFAULT_SETTINGS);
    await vi.runAllTimersAsync();

    expect(mocks.sendRuntimeMessage).toHaveBeenCalledTimes(2);
    expect(mocks.start).toHaveBeenCalledOnce();
  });

  it("starts after settings become reachable beyond the original one-retry window", async () => {
    mocks.sendRuntimeMessage
      .mockRejectedValueOnce(new Error("background is still starting"))
      .mockRejectedValueOnce(new Error("background is still starting"))
      .mockResolvedValueOnce(DEFAULT_SETTINGS);

    await import("../src/core/content-script");
    await vi.runAllTimersAsync();

    expect(mocks.sendRuntimeMessage).toHaveBeenCalledTimes(3);
    expect(mocks.start).toHaveBeenCalledOnce();
  });

  it("does not start when recovered settings disable the current site", async () => {
    mocks.sendRuntimeMessage
      .mockRejectedValueOnce(new Error("background is still starting"))
      .mockRejectedValueOnce(new Error("background is still starting"))
      .mockResolvedValueOnce({
        ...DEFAULT_SETTINGS,
        enabledSites: { ...DEFAULT_SETTINGS.enabledSites, chatgpt: false },
      });

    await import("../src/core/content-script");
    await vi.runAllTimersAsync();

    expect(mocks.sendRuntimeMessage).toHaveBeenCalledTimes(3);
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("stops retrying after the bounded startup recovery budget is exhausted", async () => {
    mocks.sendRuntimeMessage.mockRejectedValue(new Error("background unavailable"));

    await import("../src/core/content-script");
    await vi.runAllTimersAsync();

    expect(mocks.sendRuntimeMessage).toHaveBeenCalledTimes(10);
    expect(mocks.start).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
