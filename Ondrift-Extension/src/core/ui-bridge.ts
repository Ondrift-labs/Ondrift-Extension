import type {
  ApiKeyValidationResult,
  HistoryItem,
  PersonaId,
  UiBridge,
  UiSettings,
} from "../ui/shared/contracts";
import type { ExtensionSettings, HistoryEntry, ProviderErrorCode, ProviderId } from "../shared/types";
import { ProviderError } from "../providers/errors";
import { sendRuntimeMessage } from "./rewrite-client";

function mapProviderErrorCodeToReason(code: ProviderErrorCode): NonNullable<ApiKeyValidationResult["reason"]> {
  switch (code) {
    case "quota_exceeded": return "quota";
    case "invalid_key": return "invalid_key";
    case "network": return "network";
    case "request_rejected": return "request";
    case "model_unavailable":
    case "service_unavailable": return "unavailable";
    default: return "unknown";
  }
}

function toUiSettings(settings: ExtensionSettings): UiSettings {
  return {
    provider: settings.provider,
    apiKeyConfigured: Boolean(settings.apiKeys[settings.provider]?.trim()),
    apiKeyStatus: settings.apiKeyStatus ? mapProviderErrorCodeToReason(settings.apiKeyStatus) : undefined,
    model: settings.apiModels[settings.provider],
    persona: (settings.persona || "general") as PersonaId,
    language: settings.language || "en",
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
  return { ok: false, reason: mapProviderErrorCodeToReason(error.code) };
}

export const uiBridge: UiBridge = {
  async getSettings() {
    return toUiSettings(await sendRuntimeMessage<ExtensionSettings>({ type: "settings_get" }));
  },
  async saveSettings(patch) {
    const runtimePatch: Partial<ExtensionSettings> = {};
    if (patch.provider !== undefined) runtimePatch.provider = patch.provider;
    if (patch.persona !== undefined) runtimePatch.persona = patch.persona;
    if (patch.language !== undefined) runtimePatch.language = patch.language;
    if (patch.siteAccess !== undefined) runtimePatch.enabledSites = patch.siteAccess;
    if (patch.saveHistory !== undefined) runtimePatch.saveHistory = patch.saveHistory;
    if (patch.consentGranted !== undefined) {
      runtimePatch.consentGranted = patch.consentGranted;
      runtimePatch.onboardingComplete = patch.consentGranted;
    }
    // `model` is stored per-provider. The Options page always saves its full settings
    // snapshot rather than a sparse patch, so `patch.provider` is present whenever `model`
    // is meaningfully part of this save -- including switching it back to "Default", which
    // must still write through as `undefined` to clear a previously saved override.
    if (patch.provider !== undefined) {
      runtimePatch.apiModels = { [patch.provider]: patch.model } as Partial<Record<ProviderId, string>>;
    }
    return toUiSettings(await sendRuntimeMessage<ExtensionSettings>({ type: "settings_set", payload: runtimePatch }));
  },
  async validateApiKey(provider, apiKey, model) {
    try {
      // Leaving apiKey blank re-verifies the already-saved key against a new model, so
      // changing just the model doesn't force re-pasting the secret.
      await sendRuntimeMessage<void>({ type: "validate_api_key", payload: { provider, apiKey: apiKey || undefined, model } });
      const patch: Partial<ExtensionSettings> = { provider, apiModels: { [provider]: model } as Partial<Record<ProviderId, string>> };
      if (apiKey) patch.apiKeys = { [provider]: apiKey } as Partial<Record<ProviderId, string>>;
      await sendRuntimeMessage<ExtensionSettings>({ type: "settings_set", payload: patch });
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
    return sendRuntimeMessage<void>({ type: "open_options" });
  },
};
