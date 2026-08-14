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
// Only free-text typing (the custom model field) needs this: it keeps a save from firing on
// every keystroke. A select/radio/checkbox pick is already a complete, one-shot decision, so
// it saves with no artificial delay -- otherwise picking a different model and refreshing (or
// closing the tab) within the window loses the pick and silently falls back to whatever was
// last actually persisted.
const MODEL_TEXT_DEBOUNCE_MS = 700;

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
  const [confirmRemoveKey, setConfirmRemoveKey] = useState(false);
  const autosaveTimer = useRef<number | null>(null);
  const saveRequest = useRef(0);
  // 0 = save as soon as the pending-change effect below sees it (the default, for discrete
  // picks); set to MODEL_TEXT_DEBOUNCE_MS right before a keystroke-driven update.
  const nextSaveDelayMs = useRef(0);
  // The most recent snapshot a save has already been dispatched for, kept separate from
  // `savedSettings` (which only updates once that save round-trips back). Without this, a
  // second quick change that happens to match the *previous* savedSettings value -- e.g.
  // picking model A then quickly picking back Default while A's save is still in flight --
  // would compare against the stale savedSettings, look like "no change", and silently never
  // get its own save dispatched until A's save resolves (or not at all, if the page is
  // refreshed first).
  const pendingSnapshotRef = useRef<UiSettings | null>(null);
  // Chains actual bridge.saveSettings() calls one after another so two overlapping saves
  // (dispatched before the first one's round trip completes) can't race at the storage layer
  // and land out of order -- otherwise whichever happens to resolve last wins, even if it
  // was dispatched first with older data.
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());
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

  function update<K extends keyof UiSettings>(key: K, value: UiSettings[K], opts: { debounce?: boolean } = {}) {
    nextSaveDelayMs.current = opts.debounce ? MODEL_TEXT_DEBOUNCE_MS : 0;
    setSettings((current) => ({ ...current, [key]: value }));
    setSaveState('idle');
  }
  function updateSite(site: SiteId, value: boolean) { update('siteAccess', { ...settings.siteAccess, [site]: value }); }
  // Keeps the picked model in `settings` (not just local state) so it is included in the
  // same automatic save as the rest of the preferences. `opts.debounce` should only be set
  // by the custom-model text input -- every other caller is a one-shot select, not typing.
  function applyModel(next: string, opts: { debounce?: boolean } = {}) { setModel(next); update('model', next.trim() || undefined, opts); }
  const save = useCallback((snapshot: UiSettings) => {
    const requestId = ++saveRequest.current;
    setSaveState('saving');
    // Queue behind any save still in flight instead of firing straight away, so two
    // overlapping saves always reach the storage layer in dispatch order.
    const run = async () => {
      try {
        const saved = await bridge.saveSettings(snapshot);
        if (requestId !== saveRequest.current) return;
        setSavedSettings(saved);
        if (pendingSnapshotRef.current === snapshot) pendingSnapshotRef.current = null;
        setSettings((current) => editableSettingsMatch(current, snapshot) ? saved : current);
        setSaveState('saved');
      } catch {
        if (requestId !== saveRequest.current) return;
        if (pendingSnapshotRef.current === snapshot) pendingSnapshotRef.current = null;
        setSaveState('error');
      }
    };
    saveChain.current = saveChain.current.then(run, run);
    return saveChain.current;
  }, [bridge]);

  useEffect(() => {
    // Compare against the latest snapshot a save has already been dispatched for, not
    // `savedSettings` -- that one lags behind while a save is still in flight.
    const baseline = pendingSnapshotRef.current ?? savedSettings;
    if (baseline === null || editableSettingsMatch(settings, baseline)) return;
    const snapshot = settings;
    pendingSnapshotRef.current = snapshot;
    const delay = nextSaveDelayMs.current;
    nextSaveDelayMs.current = 0; // reset to "immediate" so the next discrete pick isn't accidentally debounced too
    if (delay <= 0) {
      void save(snapshot);
      return;
    }
    const timer = window.setTimeout(() => {
      autosaveTimer.current = null;
      void save(snapshot);
    }, delay);
    autosaveTimer.current = timer;
    return () => {
      window.clearTimeout(timer);
      if (autosaveTimer.current === timer) autosaveTimer.current = null;
      // The debounce window was interrupted by a newer change before it fired -- this
      // snapshot was never actually dispatched, so don't leave it blocking the comparison.
      if (pendingSnapshotRef.current === snapshot) pendingSnapshotRef.current = null;
    };
  }, [save, savedSettings, settings]);

  useEffect(() => {
    const saveBeforeTabSwitch = () => {
      if (document.visibilityState !== 'hidden') return;
      const current = settingsRef.current;
      const saved = savedSettingsRef.current;
      const baseline = pendingSnapshotRef.current ?? saved;
      if (baseline === null || editableSettingsMatch(current, baseline)) return;
      if (autosaveTimer.current !== null) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
      pendingSnapshotRef.current = current;
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
        // Deliberately doesn't touch `model` here. `trimmedModel` was captured when this
        // request started, and it can take a while to resolve (it's a live request); if the
        // user picks a different model before it comes back, writing that stale value here
        // would silently revert the newer pick, which the autosave effect already persisted
        // correctly on its own the moment it was made.
        setSettings((current) => ({ ...current, apiKeyConfigured: true }));
        setSavedSettings((current) => current && ({ ...current, apiKeyConfigured: true }));
        setSaveState('saved');
      }
    } catch { setValidation('network'); }
  }

  async function removeKey() {
    const next = await bridge.removeApiKey(settings.provider);
    setSettings(next);
    setSavedSettings(next);
    setApiKey('');
    setValidation('idle');
    setConfirmRemoveKey(false);
    setSaveState('saved');
  }

  return <main className="options-shell">
    <aside className="options-sidebar"><div className="options-sidebar-inner"><div className="options-brand"><img className="brand-logo" src="/icons/ondrift-32.png" alt="" /><span>Ondrift</span></div><nav aria-label={copy.header.title}><a href="#provider">{copy.sidebar.nav.provider}</a><a href="#persona">{copy.sidebar.nav.persona}</a><a href="#sites">{copy.sidebar.nav.sites}</a><a href="#privacy">{copy.sidebar.nav.privacy}</a><a href="#support">{copy.sidebar.nav.support}</a></nav><p>{copy.sidebar.version}</p></div></aside>
    <div className="options-content">
      <header><p className="ui-eyebrow">{copy.header.eyebrow}</p><h1>{copy.header.title}</h1><p>{copy.header.lead}</p></header>

      <section id="provider"><div className="section-title"><span>01</span><div><h2>{copy.provider.sectionTitle}</h2><p>{copy.provider.sectionLead}</p></div></div>
        <div className="settings-card">
          <label className="ui-field"><span className="ui-label">{copy.provider.providerLabel}</span><select className="ui-select" aria-label={copy.provider.providerLabel} value={settings.provider} onChange={(event) => update('provider', event.target.value as ProviderId)}><option value="gemini">{copy.provider.providerGemini}</option><option value="openai" disabled>{copy.provider.providerOpenAi}</option><option value="claude" disabled>{copy.provider.providerClaude}</option></select></label>
          <div className="ui-field"><label className="ui-label" htmlFor="settings-key">{copy.provider.apiKeyLabel}</label><div className="settings-key-row"><input id="settings-key" className="ui-input" type="password" autoComplete="off" value={apiKey} onChange={(event) => { setApiKey(event.target.value); setValidation('idle'); }} placeholder={settings.apiKeyConfigured ? copy.provider.apiKeyPlaceholderSaved : copy.provider.apiKeyPlaceholderEmpty} /><button className="ui-button ui-button--secondary" disabled={(!apiKey.trim() && !settings.apiKeyConfigured) || validation === 'checking'} onClick={verify}>{validation === 'checking' ? common.checking : copy.provider.verifyCta}</button></div><p className="ui-help">{copy.provider.apiKeyHelp} <button className="text-button" onClick={() => bridge.openExternal(AI_STUDIO_API_KEY_URL)}>{copy.provider.getKeyCta} <Icon name="external" /></button></p>
            {settings.apiKeyConfigured && (confirmRemoveKey
              ? <div className="ui-help remove-key-confirm"><span>{copy.provider.removeKeyConfirmDetail}</span><span className="clear-actions"><button className="ui-button ui-button--quiet" onClick={() => setConfirmRemoveKey(false)}>{copy.provider.removeKeyCancelCta}</button><button className="ui-button danger-button" onClick={removeKey}>{copy.provider.removeKeyConfirmCta}</button></span></div>
              : <button type="button" className="ui-button ui-button--secondary remove-key-cta" onClick={() => setConfirmRemoveKey(true)}><Icon name="trash" /> {copy.provider.removeKeyCta}</button>)}
          </div>
          <label className="ui-field"><span className="ui-label">{copy.provider.modelLabel}</span><select id="settings-model" className="ui-select" aria-label={copy.provider.modelLabel} value={modelSelectValue} onChange={(event) => { const next = event.target.value; const isCustom = next === CUSTOM_MODEL_VALUE; setCustomModelSelected(isCustom); applyModel(isCustom ? customModel : next); setValidation('idle'); }}><option value="">{copy.provider.modelAutoLabel}</option>{GEMINI_MODEL_CHOICES.map((id) => <option key={id} value={id}>{copy.provider.modelOptionLabels[id]}</option>)}<option value={CUSTOM_MODEL_VALUE}>{copy.provider.modelCustomLabel}</option></select>{customModelSelected && <input className="ui-input" type="text" autoComplete="off" aria-label={copy.provider.modelCustomLabel} value={customModel} onChange={(event) => { setCustomModel(event.target.value); applyModel(event.target.value, { debounce: true }); setValidation('idle'); }} placeholder={copy.provider.modelCustomPlaceholder} />}<span className="ui-help">{copy.provider.modelHelp}</span></label>
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
