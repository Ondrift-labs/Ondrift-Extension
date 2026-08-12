import { useCallback, useEffect, useRef, useState } from 'react';
import { AI_STUDIO_API_KEY_URL, DEFAULT_SETTINGS, GITHUB_REPO_URL, type ApiKeyValidationResult, type LanguageId, type PersonaId, type ProviderId, type SiteId, type UiBridge, type UiSettings } from '../shared/contracts';
import { getUiCopy, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../shared/i18n';
import { GEMINI_MODEL_CHOICES, type GeminiModelId } from '../../shared/models';
import { Icon } from '../shared/Icon';
import '../shared/ui.css';
import './options.css';

const PERSONA_IDS: readonly PersonaId[] = ['general', 'developer', 'writer', 'student', 'translator'];
const SITE_IDS: readonly SiteId[] = ['chatgpt', 'claude', 'gemini', 'perplexity'];
const CUSTOM_MODEL_VALUE = '__custom__';

function editableSettingsMatch(current: UiSettings, saved: UiSettings) {
  return current.provider === saved.provider
    && current.model === saved.model
    && current.persona === saved.persona
    && current.language === saved.language
    && current.saveHistory === saved.saveHistory
    && SITE_IDS.every((site) => current.siteAccess[site] === saved.siteAccess[site]);
}

function ToggleRow({ title, detail, checked, onChange }: { title: string; detail: string; checked: boolean; onChange(value: boolean): void }) {
  return <div className="toggle-row"><div><strong>{title}</strong><p>{detail}</p></div><label className="ui-switch"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={title} /><span /></label></div>;
}

export function OptionsApp({ bridge }: { bridge: UiBridge }) {
  const [settings, setSettings] = useState<UiSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<UiSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  // Tracked separately from `model` because an empty string is ambiguous otherwise: it
  // means both "Default" and "Other, nothing typed yet", and deriving the select's value
  // from `model` alone would snap back to "Default" the instant "Other" is picked but
  // before anything has been typed into the custom field.
  const [customModelSelected, setCustomModelSelected] = useState(false);
  const [validation, setValidation] = useState<'idle' | 'checking' | 'valid' | ApiKeyValidationResult['reason']>('idle');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [confirmClear, setConfirmClear] = useState(false);
  const autosaveTimer = useRef<number | null>(null);
  const saveRequest = useRef(0);
  const settingsRef = useRef(settings);
  const savedSettingsRef = useRef(savedSettings);
  settingsRef.current = settings;
  savedSettingsRef.current = savedSettings;
  useEffect(() => {
    bridge.getSettings().then((next) => {
      setSettings(next);
      setSavedSettings(next);
      const savedModel = next.model ?? '';
      setModel(savedModel);
      const isCustom = savedModel !== '' && !GEMINI_MODEL_CHOICES.includes(savedModel as GeminiModelId);
      setCustomModelSelected(isCustom);
      if (isCustom) setCustomModel(savedModel);
      // Seed the banner from the last real use of the key (a rewrite or a prior verify) so
      // e.g. an exhausted quota shows up as soon as it happens, not only after re-verifying.
      if (next.apiKeyStatus) setValidation(next.apiKeyStatus);
    }).catch(() => setSaveState('error'));
  }, [bridge]);
  const modelSelectValue = customModelSelected ? CUSTOM_MODEL_VALUE : model;
  const uiCopy = getUiCopy(settings.language);
  const copy = uiCopy.options;
  const common = uiCopy.common;
  const hasUnsavedChanges = savedSettings !== null
    && (!editableSettingsMatch(settings, savedSettings) || (apiKey.trim().length > 0 && validation !== 'valid'));

  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.title = `Ondrift — ${copy.header.title}`;
  }, [copy.header.title, settings.language]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const confirmUnsavedChanges = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', confirmUnsavedChanges);
    return () => window.removeEventListener('beforeunload', confirmUnsavedChanges);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (saveState !== 'saved') return;
    const timer = window.setTimeout(() => setSaveState('idle'), 2800);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  function update<K extends keyof UiSettings>(key: K, value: UiSettings[K]) { setSettings((current) => ({ ...current, [key]: value })); setSaveState('idle'); }
  function updateSite(site: SiteId, value: boolean) { update('siteAccess', { ...settings.siteAccess, [site]: value }); }
  // Keeps the picked model in `settings` (not just local state) so it is included in the
  // same automatic save as the rest of the preferences.
  function applyModel(next: string) { setModel(next); update('model', next.trim() || undefined); }
  const save = useCallback(async (snapshot: UiSettings) => {
    const requestId = ++saveRequest.current;
    setSaveState('saving');
    try {
      const saved = await bridge.saveSettings(snapshot);
      if (requestId !== saveRequest.current) return;
      setSavedSettings(saved);
      setSettings((current) => editableSettingsMatch(current, snapshot) ? saved : current);
      setSaveState('saved');
    } catch {
      if (requestId !== saveRequest.current) return;
      setSaveState('error');
    }
  }, [bridge]);

  useEffect(() => {
    if (savedSettings === null || editableSettingsMatch(settings, savedSettings)) return;
    const snapshot = settings;
    const timer = window.setTimeout(() => {
      autosaveTimer.current = null;
      void save(snapshot);
    }, 700);
    autosaveTimer.current = timer;
    return () => {
      window.clearTimeout(timer);
      if (autosaveTimer.current === timer) autosaveTimer.current = null;
    };
  }, [save, savedSettings, settings]);

  useEffect(() => {
    const saveBeforeTabSwitch = () => {
      if (document.visibilityState !== 'hidden') return;
      const current = settingsRef.current;
      const saved = savedSettingsRef.current;
      if (saved === null || editableSettingsMatch(current, saved)) return;
      if (autosaveTimer.current !== null) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
      void save(current);
    };
    document.addEventListener('visibilitychange', saveBeforeTabSwitch);
    return () => document.removeEventListener('visibilitychange', saveBeforeTabSwitch);
  }, [save]);

  async function verify() {
    setValidation('checking');
    try {
      const trimmedModel = model.trim();
      const result = await bridge.validateApiKey(settings.provider, apiKey.trim(), trimmedModel || undefined);
      setValidation(result.ok ? 'valid' : result.reason ?? 'unknown');
      if (result.ok) {
        const savedModel = trimmedModel || undefined;
        setSettings((current) => ({ ...current, apiKeyConfigured: true, model: savedModel }));
        setSavedSettings((current) => current && ({ ...current, provider: settings.provider, apiKeyConfigured: true, model: savedModel }));
        setSaveState('saved');
      }
    } catch { setValidation('network'); }
  }

  return <main className="options-shell">
    <aside className="options-sidebar"><div className="options-brand"><img className="brand-logo" src="/icons/ondrift-32.png" alt="" /><span>Ondrift</span></div><nav aria-label={copy.header.title}><a href="#provider">{copy.sidebar.nav.provider}</a><a href="#persona">{copy.sidebar.nav.persona}</a><a href="#sites">{copy.sidebar.nav.sites}</a><a href="#privacy">{copy.sidebar.nav.privacy}</a><a href="#support">{copy.sidebar.nav.support}</a></nav><p>{copy.sidebar.version}</p></aside>
    <div className="options-content">
      <header><p className="ui-eyebrow">{copy.header.eyebrow}</p><h1>{copy.header.title}</h1><p>{copy.header.lead}</p></header>

      <section id="provider"><div className="section-title"><span>01</span><div><h2>{copy.provider.sectionTitle}</h2><p>{copy.provider.sectionLead}</p></div></div>
        <div className="settings-card">
          <label className="ui-field"><span className="ui-label">{copy.provider.providerLabel}</span><select className="ui-select" aria-label={copy.provider.providerLabel} value={settings.provider} onChange={(event) => update('provider', event.target.value as ProviderId)}><option value="gemini">{copy.provider.providerGemini}</option><option value="openai" disabled>{copy.provider.providerOpenAi}</option><option value="claude" disabled>{copy.provider.providerClaude}</option></select></label>
          <div className="ui-field"><label className="ui-label" htmlFor="settings-key">{copy.provider.apiKeyLabel}</label><div className="settings-key-row"><input id="settings-key" className="ui-input" type="password" autoComplete="off" value={apiKey} onChange={(event) => { setApiKey(event.target.value); setValidation('idle'); }} placeholder={settings.apiKeyConfigured ? copy.provider.apiKeyPlaceholderSaved : copy.provider.apiKeyPlaceholderEmpty} /><button className="ui-button ui-button--secondary" disabled={(!apiKey.trim() && !settings.apiKeyConfigured) || validation === 'checking'} onClick={verify}>{validation === 'checking' ? common.checking : copy.provider.verifyCta}</button></div><p className="ui-help">{copy.provider.apiKeyHelp} <button className="text-button" onClick={() => bridge.openExternal(AI_STUDIO_API_KEY_URL)}>{copy.provider.getKeyCta} <Icon name="external" /></button></p></div>
          <label className="ui-field"><span className="ui-label">{copy.provider.modelLabel}</span><select id="settings-model" className="ui-select" aria-label={copy.provider.modelLabel} value={modelSelectValue} onChange={(event) => { const next = event.target.value; const isCustom = next === CUSTOM_MODEL_VALUE; setCustomModelSelected(isCustom); applyModel(isCustom ? customModel : next); setValidation('idle'); }}><option value="">{copy.provider.modelAutoLabel}</option>{GEMINI_MODEL_CHOICES.map((id) => <option key={id} value={id}>{copy.provider.modelOptionLabels[id]}</option>)}<option value={CUSTOM_MODEL_VALUE}>{copy.provider.modelCustomLabel}</option></select>{customModelSelected && <input className="ui-input" type="text" autoComplete="off" aria-label={copy.provider.modelCustomLabel} value={customModel} onChange={(event) => { setCustomModel(event.target.value); applyModel(event.target.value); setValidation('idle'); }} placeholder={copy.provider.modelCustomPlaceholder} />}<span className="ui-help">{copy.provider.modelHelp}</span></label>
          {validation === 'valid' && <div className="ui-status ui-status--success"><Icon name="check" />{copy.provider.keySuccess}</div>}
          {validation && !['idle', 'checking', 'valid'].includes(validation) && <div className="ui-status ui-status--error">{copy.provider.validation[validation as keyof typeof copy.provider.validation]}</div>}
        </div>
      </section>

      <section id="persona"><div className="section-title"><span>02</span><div><h2>{copy.persona.sectionTitle}</h2><p>{copy.persona.sectionLead}</p></div></div>
        <div className="settings-card"><label className="ui-field"><span className="ui-label">{copy.persona.languageLabel}</span><select className="ui-select" aria-label={copy.persona.languageLabel} value={settings.language} onChange={(event) => update('language', event.target.value as LanguageId)}>{SUPPORTED_LANGUAGES.map((id) => <option key={id} value={id}>{LANGUAGE_NAMES[id]}</option>)}</select><span className="ui-help">{copy.persona.languageHelp}</span></label></div>
        <div className="persona-grid">{PERSONA_IDS.map((id) => <label className={`persona-option${settings.persona === id ? ' persona-option--selected' : ''}`} key={id}><input type="radio" name="persona" checked={settings.persona === id} onChange={() => update('persona', id)} /><span><strong>{copy.persona.personas[id].name}</strong><small>{copy.persona.personas[id].description}</small></span><Icon name="check" /></label>)}</div>
      </section>

      <section id="sites"><div className="section-title"><span>03</span><div><h2>{copy.sites.sectionTitle}</h2><p>{copy.sites.sectionLead}</p></div></div>
        <div className="settings-card settings-card--rows">{SITE_IDS.map((id) => <ToggleRow key={id} title={copy.sites.sites[id].title} detail={copy.sites.sites[id].detail} checked={settings.siteAccess[id]} onChange={(value) => updateSite(id, value)} />)}</div>
      </section>

      <section id="privacy"><div className="section-title"><span>04</span><div><h2>{copy.privacy.sectionTitle}</h2><p>{copy.privacy.sectionLead}</p></div></div>
        <div className="settings-card settings-card--rows"><ToggleRow title={copy.privacy.historyToggleTitle} detail={copy.privacy.historyToggleDetail} checked={settings.saveHistory} onChange={(value) => update('saveHistory', value)} /><div className="privacy-row"><div><strong>{copy.privacy.responsesTitle}</strong><p>{copy.privacy.responsesDetail}</p></div><span className="locked-label">{copy.privacy.alwaysOn}</span></div><div className="privacy-row"><div><strong>{copy.privacy.deleteTitle}</strong><p>{copy.privacy.deleteDetail}</p></div>{confirmClear ? <span className="clear-actions"><button className="ui-button ui-button--quiet" onClick={() => setConfirmClear(false)}>{copy.privacy.cancelCta}</button><button className="ui-button danger-button" onClick={async () => { await bridge.clearHistory(); setConfirmClear(false); }}>{copy.privacy.deleteAllCta}</button></span> : <button className="ui-button ui-button--secondary" onClick={() => setConfirmClear(true)}>{copy.privacy.clearHistoryCta}</button>}</div></div>
      </section>

      <section id="support"><div className="section-title"><span>05</span><div><h2>{copy.support.sectionTitle}</h2><p>{copy.support.sectionLead}</p></div></div>
        <div className="settings-card"><button className="ui-button ui-button--secondary" onClick={() => bridge.openExternal(GITHUB_REPO_URL)}>{copy.support.starCta} <Icon name="external" /></button></div>
      </section>

      <div className="autosave-note"><Icon name="check" /><span>{copy.saveBar.idle}</span></div>
    </div>
    {saveState !== 'idle' && <div className={`autosave-toast autosave-toast--${saveState}`} role={saveState === 'error' ? 'alert' : 'status'} aria-live={saveState === 'error' ? 'assertive' : 'polite'}>
      <span className="autosave-toast__icon"><Icon name={saveState === 'error' ? 'close' : 'check'} /></span>
      <div><strong>{saveState === 'saving' ? copy.saveBar.saving : saveState === 'saved' ? copy.saveBar.savedTitle : copy.saveBar.errorTitle}</strong><p>{saveState === 'saving' ? copy.saveBar.savingDetail : saveState === 'saved' ? copy.saveBar.saved : copy.saveBar.error}</p></div>
      {saveState === 'error' && <button className="ui-button ui-button--quiet" onClick={() => void save(settings)}>{copy.saveBar.retryCta}</button>}
    </div>}
  </main>;
}
