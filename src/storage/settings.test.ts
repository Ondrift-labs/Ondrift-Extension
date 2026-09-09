import { describe, expect, it } from "vitest";
import { SettingsStore, type LocalStorageArea } from "./settings";

function fakeArea(): LocalStorageArea {
  const data: Record<string, unknown> = {};
  return {
    async get(keys) {
      const key = keys as string;
      return { [key]: data[key] };
    },
    async set(items) {
      Object.assign(data, items);
    },
  };
}

describe("SettingsStore.update", () => {
  it("does not lose a model change to a concurrent, unrelated update (no read-modify-write race)", async () => {
    const store = new SettingsStore(fakeArea());
    await store.update({ apiModels: { gemini: "gemini-3.6-flash" } });

    // Simulates picking "Default" in the Options page (clears the model) racing against an
    // unrelated concurrent write -- e.g. recordApiKeyStatus() firing from an in-flight rewrite
    // or a "Verify & save" click. Neither await's the other before starting.
    const clearModel = store.update({ apiModels: { gemini: undefined } });
    const unrelatedWrite = store.update({ apiKeyStatus: null });
    await Promise.all([clearModel, unrelatedWrite]);

    const final = await store.get();
    expect(final.apiModels.gemini).toBeUndefined();
    expect(final.apiKeyStatus).toBeNull();
  });

  it("still applies both changes when the unrelated update fires first", async () => {
    const store = new SettingsStore(fakeArea());
    await store.update({ apiModels: { gemini: "gemini-3.6-flash" } });

    const unrelatedWrite = store.update({ apiKeyStatus: "invalid_key" });
    const clearModel = store.update({ apiModels: { gemini: undefined } });
    await Promise.all([unrelatedWrite, clearModel]);

    const final = await store.get();
    expect(final.apiModels.gemini).toBeUndefined();
    expect(final.apiKeyStatus).toBe("invalid_key");
  });

  it("a rejected update doesn't block later updates from applying", async () => {
    const data: Record<string, unknown> = {};
    let failNextSet = false;
    const area: LocalStorageArea = {
      async get(keys) {
        return { [keys as string]: data[keys as string] };
      },
      async set(items) {
        if (failNextSet) {
          failNextSet = false;
          throw new Error("transient failure");
        }
        Object.assign(data, items);
      },
    };
    const store = new SettingsStore(area);
    failNextSet = true;
    await expect(store.update({ persona: "writer" })).rejects.toThrow();
    await store.update({ persona: "translator" });
    const final = await store.get();
    expect(final.persona).toBe("translator");
  });
});
