import type {
  ApiKeyValidationResult,
  HistoryItem,
  PersonaId,
  UiBridge,
  UiSettings,
} from "../ui/shared/contracts";
import type { ExtensionSettings, HistoryEntry, ProviderId } from "../shared/types";
import { ProviderError } from "../providers/errors";
import { sendRuntimeMessage } from "./rewrite-client";

function toUiSettings(settings: ExtensionSettings): UiSettings {
  return {
    provider: settings.provider,
    apiKeyConfigured: Boolean(settings.apiKeys[settings.provider]?.trim()),
    persona: (settings.persona || "general") as PersonaId,
    siteAccess: settings.enabledSites,
    saveHistory: settings.saveHistory,
    consentGranted: settings.consentGranted,
  };
}

function toHistoryItem(entry: HistoryEntry): HistoryItem {
  return {
    id: String(entry.id),
    service: entry.service,
    originalText: entry.originalText,
    improvedText: entry.improvedText ?? "",
    score: entry.score ?? 0,
    applied: entry.applied,
    createdAt: entry.createdAt,
    sourceUrl: entry.sourceUrl,
    inputTokens: entry.usageMetadata?.promptTokenCount,
    outputTokens: entry.usageMetadata?.candidatesTokenCount,
  };
}

function validationFailure(error: unknown): ApiKeyValidationResult {
  if (!(error instanceof ProviderError)) return { ok: false, reason: "unknown" };
  const reason = error.code === "quota_exceeded"
    ? "quota"
    : error.code === "invalid_key"
      ? "invalid_key"
      : error.code === "network"
        ? "network"
        : error.code === "request_rejected"
          ? "request"
          : error.code === "model_unavailable" || error.code === "service_unavailable"
            ? "unavailable"
        : "unknown";
  return { ok: false, reason };
}

export const uiBridge: UiBridge = {
  async getSettings() {
    return toUiSettings(await sendRuntimeMessage<ExtensionSettings>({ type: "settings_get" }));
  },
  async saveSettings(patch) {
    const runtimePatch: Partial<ExtensionSettings> = {};
    if (patch.provider !== undefined) runtimePatch.provider = patch.provider;
    if (patch.persona !== undefined) runtimePatch.persona = patch.persona;
    if (patch.siteAccess !== undefined) runtimePatch.enabledSites = patch.siteAccess;
    if (patch.saveHistory !== undefined) runtimePatch.saveHistory = patch.saveHistory;
    if (patch.consentGranted !== undefined) {
      runtimePatch.consentGranted = patch.consentGranted;
      runtimePatch.onboardingComplete = patch.consentGranted;
    }
    return toUiSettings(await sendRuntimeMessage<ExtensionSettings>({ type: "settings_set", payload: runtimePatch }));
  },
  async validateApiKey(provider, apiKey) {
    try {
      await sendRuntimeMessage<void>({ type: "validate_api_key", payload: { provider, apiKey } });
      await sendRuntimeMessage<ExtensionSettings>({
        type: "settings_set",
        payload: { provider, apiKeys: { [provider]: apiKey } as Partial<Record<ProviderId, string>> },
      });
      return { ok: true };
    } catch (error) {
      return validationFailure(error);
    }
  },
  openExternal(url) {
    return chrome.tabs.create({ url }).then(() => undefined);
  },
  async getHistory() {
    return (await sendRuntimeMessage<HistoryEntry[]>({ type: "history_list" })).map(toHistoryItem);
  },
  async deleteHistory(id) {
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId)) throw new Error("Invalid history id");
    await sendRuntimeMessage<void>({ type: "history_delete", payload: { id: numericId } });
  },
  async clearHistory() {
    await sendRuntimeMessage<void>({ type: "history_clear" });
  },
  openOptions() {
    return chrome.runtime.openOptionsPage();
  },
};
