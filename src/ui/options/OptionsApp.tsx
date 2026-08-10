import { useEffect, useState } from 'react';
import { AI_STUDIO_API_KEY_URL, DEFAULT_SETTINGS, type ApiKeyValidationResult, type PersonaId, type ProviderId, type SiteId, type UiBridge, type UiSettings } from '../shared/contracts';
import { Icon } from '../shared/Icon';
import '../shared/ui.css';
import './options.css';

const personas: Array<{ id: PersonaId; name: string; description: string }> = [
  { id: 'general', name: 'Balanced', description: 'Clear intent, context, constraints, and output format.' },
  { id: 'developer', name: 'Developer', description: 'Adds technical assumptions, edge cases, and acceptance criteria.' },
  { id: 'writer', name: 'Writer', description: 'Sharpens audience, voice, structure, and editorial goals.' },
  { id: 'student', name: 'Student', description: 'Asks for progressive explanations and checks understanding.' },
  { id: 'translator', name: 'Translator', description: 'Preserves meaning while specifying locale, tone, and register.' },
];

function ToggleRow({ title, detail, checked, onChange }: { title: string; detail: string; checked: boolean; onChange(value: boolean): void }) {
  return <div className="toggle-row"><div><strong>{title}</strong><p>{detail}</p></div><label className="ui-switch"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={title} /><span /></label></div>;
}

export function OptionsApp({ bridge }: { bridge: UiBridge }) {
  const [settings, setSettings] = useState<UiSettings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKey] = useState('');
  const [validation, setValidation] = useState<'idle' | 'checking' | 'valid' | ApiKeyValidationResult['reason']>('idle');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => { bridge.getSettings().then(setSettings).catch(() => setSaveState('error')); }, []);

  function update<K extends keyof UiSettings>(key: K, value: UiSettings[K]) { setSettings((current) => ({ ...current, [key]: value })); setSaveState('idle'); }
  function updateSite(site: SiteId, value: boolean) { update('siteAccess', { ...settings.siteAccess, [site]: value }); }
  async function save() { setSaveState('saving'); try { setSettings(await bridge.saveSettings(settings)); setSaveState('saved'); } catch { setSaveState('error'); } }
  async function verify() {
    setValidation('checking');
    try {
      const result = await bridge.validateApiKey(settings.provider, apiKey.trim());
      setValidation(result.ok ? 'valid' : result.reason ?? 'unknown');
      if (result.ok) setSettings((current) => ({ ...current, apiKeyConfigured: true }));
    } catch { setValidation('network'); }
  }

  return <main className="options-shell">
    <aside className="options-sidebar"><div className="options-brand"><span className="brand-mark">O</span><span>Ondrift</span></div><nav aria-label="Settings"><a href="#provider">Provider</a><a href="#persona">Rewrite style</a><a href="#sites">Sites</a><a href="#privacy">Privacy</a></nav><p>Version 0.1 · Free MVP</p></aside>
    <div className="options-content">
      <header><p className="ui-eyebrow">Extension preferences</p><h1>Settings</h1><p>Choose how Ondrift rewrites and what stays in your browser.</p></header>

      <section id="provider"><div className="section-title"><span>01</span><div><h2>Provider & API key</h2><p>Rewrite requests go directly from the extension to your selected provider.</p></div></div>
        <div className="settings-card">
          <label className="ui-field"><span className="ui-label">Provider</span><select className="ui-select" value={settings.provider} onChange={(event) => update('provider', event.target.value as ProviderId)}><option value="gemini">Google Gemini · recommended</option><option value="openai" disabled>OpenAI · coming later</option><option value="claude" disabled>Anthropic Claude · coming later</option></select></label>
          <div className="ui-field"><label className="ui-label" htmlFor="settings-key">API key</label><div className="settings-key-row"><input id="settings-key" className="ui-input" type="password" autoComplete="off" value={apiKey} onChange={(event) => { setApiKey(event.target.value); setValidation('idle'); }} placeholder={settings.apiKeyConfigured ? 'Key saved · enter a replacement' : 'Paste your Gemini API key'} /><button className="ui-button ui-button--secondary" disabled={!apiKey.trim() || validation === 'checking'} onClick={verify}>{validation === 'checking' ? 'Checking…' : 'Verify & save'}</button></div><p className="ui-help">Stored with <code>chrome.storage.local</code>, never sync storage. <button className="text-button" onClick={() => bridge.openExternal(AI_STUDIO_API_KEY_URL)}>Get a key <Icon name="external" /></button></p></div>
          {validation === 'valid' && <div className="ui-status ui-status--success"><Icon name="check" />Key verified and ready to use.</div>}
          {validation && !['idle', 'checking', 'valid'].includes(validation) && <div className="ui-status ui-status--error">{validation === 'invalid_key' ? 'The provider rejected this key. Check that it was copied completely.' : validation === 'quota' ? 'This key is valid, but its quota is currently exhausted.' : validation === 'network' ? 'Could not reach the provider. Check your connection.' : 'The key could not be verified.'}</div>}
        </div>
      </section>

      <section id="persona"><div className="section-title"><span>02</span><div><h2>Rewrite style</h2><p>A focused preset guides what Ondrift emphasizes. You can still edit every result.</p></div></div>
        <div className="persona-grid">{personas.map((persona) => <label className={`persona-option${settings.persona === persona.id ? ' persona-option--selected' : ''}`} key={persona.id}><input type="radio" name="persona" checked={settings.persona === persona.id} onChange={() => update('persona', persona.id)} /><span><strong>{persona.name}</strong><small>{persona.description}</small></span><Icon name="check" /></label>)}</div>
      </section>

      <section id="sites"><div className="section-title"><span>03</span><div><h2>Supported sites</h2><p>Ondrift only reads prompt text on sites you explicitly enable.</p></div></div>
        <div className="settings-card settings-card--rows"><ToggleRow title="ChatGPT" detail="Show the rewrite widget on chatgpt.com." checked={settings.siteAccess.chatgpt} onChange={(value) => updateSite('chatgpt', value)} /><ToggleRow title="Claude" detail="Show the rewrite widget on claude.ai." checked={settings.siteAccess.claude} onChange={(value) => updateSite('claude', value)} /></div>
      </section>

      <section id="privacy"><div className="section-title"><span>04</span><div><h2>Privacy & local data</h2><p>No cloud account, sync, or developer-operated server is used in this version.</p></div></div>
        <div className="settings-card settings-card--rows"><ToggleRow title="Save local prompt history" detail="Store original and improved prompts, score, site, and timestamp in this browser." checked={settings.saveHistory} onChange={(value) => update('saveHistory', value)} /><div className="privacy-row"><div><strong>AI responses are never saved</strong><p>Ondrift only handles the prompt you choose to rewrite and local rewrite metadata.</p></div><span className="locked-label">Always on</span></div><div className="privacy-row"><div><strong>Delete local history</strong><p>Remove all saved prompts and usage aggregates from this browser.</p></div>{confirmClear ? <span className="clear-actions"><button className="ui-button ui-button--quiet" onClick={() => setConfirmClear(false)}>Cancel</button><button className="ui-button danger-button" onClick={async () => { await bridge.clearHistory(); setConfirmClear(false); }}>Delete all</button></span> : <button className="ui-button ui-button--secondary" onClick={() => setConfirmClear(true)}>Clear history</button>}</div></div>
      </section>

      <div className="save-bar"><span aria-live="polite">{saveState === 'saved' ? 'Changes saved locally.' : saveState === 'error' ? 'Could not save changes.' : 'Settings stay on this device.'}</span><button className="ui-button ui-button--primary" disabled={saveState === 'saving'} onClick={save}>{saveState === 'saving' ? 'Saving…' : 'Save changes'}</button></div>
    </div>
  </main>;
}
