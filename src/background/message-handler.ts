import type { RuntimeRequest, RuntimeResponse } from "../shared/types";
import { getProvider } from "../providers/registry";
import { ProviderError, serializeProviderError } from "../providers/errors";
import { settingsStore, type SettingsStore } from "../storage/settings";
import { historyStore, type HistoryStore } from "../storage/history";

export interface MessageHandlerDependencies {
  settings: SettingsStore;
  history: HistoryStore;
  provider: typeof getProvider;
}

const defaults: MessageHandlerDependencies = {
  settings: settingsStore,
  history: historyStore,
  provider: getProvider,
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
        const apiKey = settings.apiKeys[settings.provider]?.trim();
        if (!apiKey) throw new ProviderError("not_configured", "Add an API key in Ondrift settings.");
        return { ok: true, data: await dependencies.provider(settings.provider).rewrite(message.payload, apiKey) };
      }
      case "validate_api_key":
        await dependencies.provider(message.payload.provider).validateKey(message.payload.apiKey);
        return { ok: true, data: undefined };
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
      default: {
        const neverMessage: never = message;
        throw new ProviderError("unknown", `Unsupported message: ${String(neverMessage)}`);
      }
    }
  } catch (error) {
    return { ok: false, error: serializeProviderError(error) };
  }
}
