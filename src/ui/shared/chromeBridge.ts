import type { ExtensionSettings, HistoryEntry, ProviderErrorCode, RuntimeRequest, RuntimeResponse } from '../../shared/types';
import { DEFAULT_SETTINGS, type HistoryItem, type UiBridge, type UiSettings } from './contracts';

const UI_PREFERENCES_KEY = 'ondrift.ui.preferences';
type UiPreferences = Pick<UiSettings, 'saveHistory' | 'consentGranted'>;

async function send<T>(message: RuntimeRequest): Promise<T> {
  const response = await chrome.runtime.sendMessage<RuntimeRequest, RuntimeResponse<T>>(message);
  if (!response.ok) {
    const error = new Error(response.error.message) as Error & { code?: ProviderErrorCode };
    error.code = response.error.code;
    throw error;
  }
  return response.data;
}

async function getUiPreferences(): Promise<UiPreferences> {
  const stored = await chrome.storage.local.get(UI_PREFERENCES_KEY);
  return { saveHistory: true, consentGranted: false, ...(stored[UI_PREFERENCES_KEY] as Partial<UiPreferences> | undefined) };
}

function fromExtensionSettings(settings: ExtensionSettings, preferences: UiPreferences): UiSettings {
  return {
    provider: settings.provider,
    apiKeyConfigured: Boolean(settings.apiKeys[settings.provider]?.trim()),
    persona: (settings.persona as UiSettings['persona'] | undefined) ?? DEFAULT_SETTINGS.persona,
    language: settings.language ?? DEFAULT_SETTINGS.language,
    siteAccess: settings.enabledSites,
    saveHistory: preferences.saveHistory,
    consentGranted: settings.onboardingComplete || preferences.consentGranted,
  };
}

function mapHistory(entry: HistoryEntry): HistoryItem {
  return {
    id: String(entry.id),
    service: entry.service,
    originalText: entry.originalText,
    improvedText: entry.improvedText,
    score: entry.score ?? 0,
    applied: entry.applied,
    createdAt: entry.createdAt,
    sourceUrl: entry.sourceUrl,
    inputTokens: entry.usageMetadata?.promptTokenCount,
    outputTokens: entry.usageMetadata?.candidatesTokenCount,
  };
}

export const chromeUiBridge: UiBridge = {
  async getSettings() {
    const [settings, preferences] = await Promise.all([send<ExtensionSettings>({ type: 'settings_get' }), getUiPreferences()]);
    return fromExtensionSettings(settings, preferences);
  },
  async saveSettings(patch) {
    const current = await this.getSettings();
    const next = { ...current, ...patch, siteAccess: { ...current.siteAccess, ...patch.siteAccess } };
    const settings = await send<ExtensionSettings>({
      type: 'settings_set',
      payload: {
        provider: next.provider,
        persona: next.persona,
        language: next.language,
        enabledSites: next.siteAccess,
        onboardingComplete: next.consentGranted,
      },
    });
    const preferences: UiPreferences = { saveHistory: next.saveHistory, consentGranted: next.consentGranted };
    await chrome.storage.local.set({ [UI_PREFERENCES_KEY]: preferences });
    return fromExtensionSettings(settings, preferences);
  },
  async validateApiKey(provider, apiKey) {
    try {
      await send<void>({ type: 'validate_api_key', payload: { provider, apiKey } });
      await send<ExtensionSettings>({ type: 'settings_set', payload: { provider, apiKeys: { [provider]: apiKey } } });
      return { ok: true };
    } catch (error) {
      const code = (error as Error & { code?: ProviderErrorCode }).code;
      return { ok: false, reason: code === 'invalid_key' ? 'invalid_key' : code === 'quota_exceeded' ? 'quota' : code === 'network' ? 'network' : code === 'request_rejected' ? 'request' : code === 'model_unavailable' || code === 'service_unavailable' ? 'unavailable' : 'unknown' };
    }
  },
  openExternal(url) { return chrome.tabs.create({ url }).then(() => undefined); },
  async getHistory() { return (await send<HistoryEntry[]>({ type: 'history_list', payload: { limit: 200 } })).map(mapHistory); },
  async deleteHistory(id) { await send<void>({ type: 'history_delete', payload: { id: Number(id) } }); },
  async clearHistory() { await send<void>({ type: 'history_clear' }); },
  openOptions() { return send<void>({ type: 'open_options' }); },
};
