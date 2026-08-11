import { useEffect, useState } from 'react';
import { AI_STUDIO_API_KEY_URL, DEFAULT_SETTINGS, type ApiKeyValidationResult, type LanguageId, type PersonaId, type ProviderId, type SiteId, type UiBridge, type UiSettings } from '../shared/contracts';
import { getUiCopy, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../shared/i18n';
import { GEMINI_MODEL_CHOICES, type GeminiModelId } from '../../shared/models';
import { Icon } from '../shared/Icon';
import '../shared/ui.css';
import './options.css';

const PERSONA_IDS: readonly PersonaId[] = ['general', 'developer', 'writer', 'student', 'translator'];
const SITE_IDS: readonly SiteId[] = ['chatgpt', 'claude', 'gemini', 'perplexity'];

function ToggleRow({ title, detail, checked, onChange }: { title: string; detail: string; checked: boolean; onChange(value: boolean): void }) {
  return <div className="toggle-row"><div><strong>{title}</strong><p>{detail}</p></div><label className="ui-switch"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={title} /><span /></label></div>;
}

export function OptionsApp({ bridge }: { bridge: UiBridge }) {
  const [settings, setSettings] = useState<UiSettings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [validation, setValidation] = useState<'idle' | 'checking' | 'valid' | ApiKeyValidationResult['reason']>('idle');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    bridge.getSettings().then((next) => {
      setSettings(next);
      setModel(next.model ?? '');
      // Seed the banner from the last real use of the key (a rewrite or a prior verify) so
      // e.g. an exhausted quota shows up as soon as it happens, not only after re-verifying.
      if (next.apiKeyStatus) setValidation(next.apiKeyStatus);
    }).catch(() => setSaveState('error'));
  }, [bridge]);
  const uiCopy = getUiCopy(settings.language);
  const copy = uiCopy.options;
  const common = uiCopy.common;

  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.title = `Ondrift — ${copy.header.title}`;
  }, [copy.header.title, settings.language]);

  function update<K extends keyof UiSettings>(key: K, value: UiSettings[K]) { setSettings((current) => ({ ...current, [key]: value })); setSaveState('idle'); }
  function updateSite(site: SiteId, value: boolean) { update('siteAccess', { ...settings.siteAccess, [site]: value }); }
  async function save() { setSaveState('saving'); try { setSettings(await bridge.saveSettings(settings)); setSaveState('saved'); } catch { setSaveState('error'); } }
  async function verify() {
    setValidation('checking');
    try {
      const trimmedModel = model.trim();
      const result = await bridge.validateApiKey(settings.provider, apiKey.trim(), trimmedModel || undefined);
      setValidation(result.ok ? 'valid' : result.reason ?? 'unknown');
      if (result.ok) setSettings((current) => ({ ...current, apiKeyConfigured: true, model: trimmedModel || undefined }));
    } catch { setValidation('network'); }
  }

  return <main className="options-shell">
    <aside className="options-sidebar"><div className="options-brand"><img className="brand-logo" src="/icons/ondrift-32.png" alt="" /><span>Ondrift</span></div><nav aria-label={copy.header.title}><a href="#provider">{copy.sidebar.nav.provider}</a><a href="#persona">{copy.sidebar.nav.persona}</a><a href="#sites">{copy.sidebar.nav.sites}</a><a href="#privacy">{copy.sidebar.nav.privacy}</a></nav><p>{copy.sidebar.version}</p></aside>
    <div className="options-content">
      <header><p className="ui-eyebrow">{copy.header.eyebrow}</p><h1>{copy.header.title}</h1><p>{copy.header.lead}</p></header>

      <section id="provider"><div className="section-title"><span>01</span><div><h2>{copy.provider.sectionTitle}</h2><p>{copy.provider.sectionLead}</p></div></div>
        <div className="settings-card">
          <label className="ui-field"><span className="ui-label">{copy.provider.providerLabel}</span><select className="ui-select" aria-label={copy.provider.providerLabel} value={settings.provider} onChange={(event) => update('provider', event.target.value as ProviderId)}><option value="gemini">{copy.provider.providerGemini}</option><option value="openai" disabled>{copy.provider.providerOpenAi}</option><option value="claude" disabled>{copy.provider.providerClaude}</option></select></label>
          <div className="ui-field"><label className="ui-label" htmlFor="settings-key">{copy.provider.apiKeyLabel}</label><div className="settings-key-row"><input id="settings-key" className="ui-input" type="password" autoComplete="off" value={apiKey} onChange={(event) => { setApiKey(event.target.value); setValidation('idle'); }} placeholder={settings.apiKeyConfigured ? copy.provider.apiKeyPlaceholderSaved : copy.provider.apiKeyPlaceholderEmpty} /><button className="ui-button ui-button--secondary" disabled={(!apiKey.trim() && !settings.apiKeyConfigured) || validation === 'checking'} onClick={verify}>{validation === 'checking' ? common.checking : copy.provider.verifyCta}</button></div><p className="ui-help">{copy.provider.apiKeyHelp} <button className="text-button" onClick={() => bridge.openExternal(AI_STUDIO_API_KEY_URL)}>{copy.provider.getKeyCta} <Icon name="external" /></button></p></div>
          <label className="ui-field"><span className="ui-label">{copy.provider.modelLabel}</span><select id="settings-model" className="ui-select" aria-label={copy.provider.modelLabel} value={model} onChange={(event) => { setModel(event.target.value); setValidation('idle'); }}><option value="">{copy.provider.modelAutoLabel}</option>{GEMINI_MODEL_CHOICES.map((id) => <option key={id} value={id}>{copy.provider.modelOptionLabels[id]}</option>)}{model && !GEMINI_MODEL_CHOICES.includes(model as GeminiModelId) && <option value={model}>{model}</option>}</select><span className="ui-help">{copy.provider.modelHelp}</span></label>
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

      <div className="save-bar"><span aria-live="polite">{saveState === 'saved' ? copy.saveBar.saved : saveState === 'error' ? copy.saveBar.error : copy.saveBar.idle}</span><button className="ui-button ui-button--primary" disabled={saveState === 'saving'} onClick={save}>{saveState === 'saving' ? common.saving : copy.saveBar.saveCta}</button></div>
    </div>
  </main>;
}
