import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { HistoryStore } from "../src/storage/history";

describe("HistoryStore", () => {
  it("stores, searches, filters, paginates, and deletes local prompt history", async () => {
    const store = new HistoryStore(new IDBFactory(), "history-test");
    const firstId = await store.add({
      service: "chatgpt",
      sourceUrl: "https://chatgpt.com/c/1",
      originalText: "Draft a launch plan",
      improvedText: "Create a phased launch plan",
      score: 86,
      applied: true,
      createdAt: 100,
      usageMetadata: { totalTokenCount: 20 },
    });
    await store.add({
      service: "claude",
      sourceUrl: "https://claude.ai/chat/1",
      originalText: "Explain closures",
      applied: false,
      createdAt: 200,
    });

    await expect(store.list()).resolves.toMatchObject([{ service: "claude" }, { service: "chatgpt" }]);
    await expect(store.list({ search: "PHASED" })).resolves.toHaveLength(1);
    await expect(store.list({ service: "claude", limit: 1 })).resolves.toMatchObject([{ originalText: "Explain closures" }]);
    await store.delete(firstId);
    await expect(store.list()).resolves.toHaveLength(1);
  });

  it("computes local-only usage aggregates and clears all records", async () => {
    const store = new HistoryStore(new IDBFactory(), "aggregate-test");
    await store.add({ service: "chatgpt", sourceUrl: "https://chatgpt.com", originalText: "a", score: 80, applied: true, createdAt: 1, usageMetadata: { totalTokenCount: 12 } });
    await store.add({ service: "claude", sourceUrl: "https://claude.ai", originalText: "b", score: 100, applied: false, createdAt: 2, usageMetadata: { totalTokenCount: 8 } });
    await expect(store.aggregates()).resolves.toEqual({
      totalPrompts: 2,
      rewritesApplied: 1,
      adoptionRate: 0.5,
      averageScore: 90,
      totalTokens: 20,
      byService: { chatgpt: 1, claude: 1, gemini: 0, perplexity: 0, grok: 0 },
    });
    await store.clear();
    await expect(store.list()).resolves.toEqual([]);
  });

  it("retries after a failed IndexedDB open instead of caching the failure forever", async () => {
    const real = new IDBFactory();
    let attempts = 0;
    // The first open fails outright; the second one is left to the real factory. Only the
    // request object needs faking -- HistoryStore attaches its own onsuccess/onerror/etc.
    // handlers to whatever `factory.open()` returns.
    const flaky = {
      open: (name: string, version?: number) => {
        attempts += 1;
        if (attempts === 1) {
          const failingRequest = {} as IDBOpenDBRequest;
          queueMicrotask(() => failingRequest.onerror?.(new Event("error") as Event));
          return failingRequest;
        }
        return real.open(name, version);
      },
    } as unknown as IDBFactory;
    const store = new HistoryStore(flaky, "retry-test");
    const entry = { service: "chatgpt" as const, sourceUrl: "https://chatgpt.com", originalText: "a", applied: false, createdAt: 1 };

    await expect(store.add(entry)).rejects.toThrow("Could not open local history");
    await expect(store.add(entry)).resolves.toEqual(expect.any(Number));
    expect(attempts).toBe(2);
  });
});
