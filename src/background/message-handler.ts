import type { ExtensionSettings, ProviderErrorCode, ProviderId, RuntimeRequest, RuntimeResponse } from "../shared/types";
import { getProvider } from "../providers/registry";
import { ProviderError, serializeProviderError } from "../providers/errors";
import { rewriteViaFreeTier } from "../providers/free-tier.provider";
import { settingsStore, type SettingsStore } from "../storage/settings";
import { historyStore, type HistoryStore } from "../storage/history";

const MISSING_API_KEY_MESSAGE = "Add an API key in Ondrift settings.";

function apiKeyFor(settings: ExtensionSettings, provider: ProviderId): string | undefined {
  return settings.apiKeys[provider]?.trim() || undefined;
}

/**
 * Codes that reflect the active API key's own health, as opposed to something unrelated
 * to the key (e.g. a malformed rewrite response, or the site being disabled). Persisting
 * these lets the Options page show e.g. a quota warning as soon as normal usage hits it,
 * instead of only after the user re-verifies the key by hand.
 */
const API_KEY_HEALTH_CODES: ReadonlySet<ProviderErrorCode> = new Set([
  "invalid_key",
  "quota_exceeded",
  "network",
  "request_rejected",
  "model_unavailable",
  "service_unavailable",
]);

async function recordApiKeyStatus(settings: SettingsStore, error: unknown): Promise<void> {
  const code = error instanceof ProviderError && API_KEY_HEALTH_CODES.has(error.code) ? error.code : null;
  await settings.update({ apiKeyStatus: code });
}

/** Runs `action`, then records the API key's health based on whether it threw. Rethrows on failure. */
async function withApiKeyStatusTracking<T>(settings: SettingsStore, action: () => Promise<T>): Promise<T> {
  try {
    const result = await action();
    await recordApiKeyStatus(settings, null);
    return result;
  } catch (error) {
    await recordApiKeyStatus(settings, error);
    throw error;
  }
}

export interface MessageHandlerDependencies {
  settings: SettingsStore;
  history: HistoryStore;
  provider: typeof getProvider;
  freeTierRewrite: typeof rewriteViaFreeTier;
  openOptions: () => Promise<void>;
}

const defaults: MessageHandlerDependencies = {
  settings: settingsStore,
  history: historyStore,
  provider: getProvider,
  freeTierRewrite: rewriteViaFreeTier,
  openOptions: () => chrome.runtime.openOptionsPage(),
};

export async function handleRuntimeRequest(
  message: RuntimeRequest,
  dependencies: MessageHandlerDependencies = defaults,
): Promise<RuntimeResponse> {
  try {
    switch (message.type) {
      case "rewrite": {
        const settings = await dependencies.settings.get();
        if (!settings.enabledSites[message.payload.service]) {
          throw new ProviderError("not_configured", `Ondrift is disabled on ${message.payload.service}.`);
        }
        const apiKey = apiKeyFor(settings, settings.provider);
        if (!apiKey) {
          const installId = settings.installId || crypto.randomUUID();
          if (!settings.installId) await dependencies.settings.update({ installId });
          const result = await dependencies.freeTierRewrite(
            { ...message.payload, language: settings.language },
            installId,
          );
          await dependencies.settings.update({ freeTierRemaining: result.remaining });
          return { ok: true, data: result };
        }
        const result = await withApiKeyStatusTracking(dependencies.settings, () =>
          dependencies.provider(settings.provider).rewrite(
            { ...message.payload, language: settings.language, model: settings.apiModels[settings.provider] },
            apiKey,
          ));
        return { ok: true, data: result };
      }
      case "validate_api_key": {
        // The Options page leaves apiKey out when the user only changed the model, so
        // re-verifying doesn't force them to re-paste an already-saved secret.
        const settings = await dependencies.settings.get();
        const apiKey = message.payload.apiKey?.trim() || apiKeyFor(settings, message.payload.provider);
        if (!apiKey) throw new ProviderError("not_configured", MISSING_API_KEY_MESSAGE);
        await withApiKeyStatusTracking(dependencies.settings, () =>
          dependencies.provider(message.payload.provider).validateKey(apiKey, message.payload.model));
        return { ok: true, data: undefined };
      }
      case "settings_get":
        return { ok: true, data: await dependencies.settings.get() };
      case "settings_set":
        return { ok: true, data: await dependencies.settings.update(message.payload) };
      case "history_add":
        {
          const settings = await dependencies.settings.get();
          if (!settings.saveHistory || !settings.consentGranted) return { ok: true, data: 0 };
        }
        return { ok: true, data: await dependencies.history.add(message.payload) };
      case "history_list":
        return { ok: true, data: await dependencies.history.list(message.payload) };
      case "history_delete":
        await dependencies.history.delete(message.payload.id);
        return { ok: true, data: undefined };
      case "history_clear":
        await dependencies.history.clear();
        return { ok: true, data: undefined };
      case "history_aggregates":
        return { ok: true, data: await dependencies.history.aggregates() };
      case "open_options":
        await dependencies.openOptions();
        return { ok: true, data: undefined };
      default: {
        const neverMessage: never = message;
        throw new ProviderError("unknown", `Unsupported message: ${String(neverMessage)}`);
      }
    }
  } catch (error) {
    return { ok: false, error: serializeProviderError(error) };
  }
}
