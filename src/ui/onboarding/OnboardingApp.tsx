import { useMemo, useState } from 'react';
import { AI_STUDIO_API_KEY_URL, type ApiKeyValidationResult, type UiBridge } from '../shared/contracts';
import { Icon } from '../shared/Icon';
import '../shared/ui.css';
import './onboarding.css';

type Phase = 'intro' | 'key' | 'privacy' | 'complete';
type ValidationState = 'idle' | 'checking' | 'valid' | ApiKeyValidationResult['reason'];

const validationCopy: Record<Exclude<ValidationState, 'idle' | 'checking' | 'valid' | undefined>, string> = {
  invalid_key: 'That key was not accepted. Copy the full key from Google AI Studio and try again.',
  quota: 'The key works, but its current quota is exhausted. Check the project quota or try again tomorrow.',
  network: 'Chrome could not reach Gemini. Check browser, VPN, or firewall access and try again.',
  request: 'Gemini rejected the verification request. Reload Ondrift and try again.',
  unavailable: 'Gemini is temporarily unavailable for this project. Ondrift also tried a compatible fallback model.',
  unknown: 'We could not verify this key. Nothing was saved; please try again.',
};

export function OnboardingApp({ bridge }: { bridge: UiBridge }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [apiKey, setApiKey] = useState('');
  const [validation, setValidation] = useState<ValidationState>('idle');
  const [consent, setConsent] = useState(false);
  const step = useMemo(() => ({ intro: 1, key: 2, privacy: 3, complete: 3 })[phase], [phase]);

  async function validateKey() {
    if (!apiKey.trim()) return;
    setValidation('checking');
    try {
      const result = await bridge.validateApiKey('gemini', apiKey.trim());
      setValidation(result.ok ? 'valid' : result.reason ?? 'unknown');
      if (result.ok) await bridge.saveSettings({ provider: 'gemini', apiKeyConfigured: true });
    } catch {
      setValidation('network');
    }
  }

  async function finish() {
    await bridge.saveSettings({ consentGranted: true, saveHistory: true });
    setPhase('complete');
  }

  return <main className="onboarding-shell">
    <header className="onboarding-header">
      <a className="brand" href="#main" aria-label="Ondrift home"><span className="brand-mark">O</span><span>Ondrift</span></a>
      <span className="step-count">Step {step} of 3</span>
    </header>
    <div className="step-track" aria-hidden="true"><span style={{ width: `${step / 3 * 100}%` }} /></div>

    <section className="onboarding-panel" id="main" aria-live="polite">
      {phase === 'intro' && <>
        <p className="ui-eyebrow">A clearer prompt, before you send</p>
        <h1>Bring better instructions to every conversation.</h1>
        <p className="onboarding-lead">Ondrift sits beside the prompt box in ChatGPT, Claude, Gemini, and Perplexity. It scores your draft, explains what is missing, and offers a rewrite you can apply in one click.</p>
        <div className="promise-list">
          <div><span>01</span><p><strong>Works where you already write</strong>Use the same focused workflow across supported AI sites.</p></div>
          <div><span>02</span><p><strong>Your key, your browser</strong>Your Gemini API key stays in local extension storage.</p></div>
          <div><span>03</span><p><strong>No developer server</strong>Prompts go directly to Gemini and history remains on this device.</p></div>
        </div>
        <button className="ui-button ui-button--primary onboarding-next" onClick={() => setPhase('key')}>Set up Gemini <Icon name="arrow" /></button>
      </>}

      {phase === 'key' && <>
        <p className="ui-eyebrow">Connect Gemini</p>
        <h1>Get a key in three short steps.</h1>
        <ol className="key-steps">
          <li><span>1</span><div><strong>Open Google AI Studio</strong><p>Sign in with your Google account. Gemini’s usage limits are managed by Google.</p><button className="ui-button ui-button--secondary" onClick={() => bridge.openExternal(AI_STUDIO_API_KEY_URL)}>Open AI Studio <Icon name="external" /></button></div></li>
          <li><span>2</span><div><strong>Create an API key</strong><p>Select “Create API key,” choose a project, then copy the generated value.</p></div></li>
          <li><span>3</span><div className="ui-field"><label className="ui-label" htmlFor="onboarding-key">Paste and verify it here</label><div className="key-row"><input id="onboarding-key" className="ui-input" type="password" autoComplete="off" spellCheck={false} value={apiKey} onChange={(event) => { setApiKey(event.target.value); setValidation('idle'); }} placeholder="AIza…" /><button className="ui-button ui-button--primary" disabled={!apiKey.trim() || validation === 'checking'} onClick={validateKey}>{validation === 'checking' ? 'Checking…' : 'Verify key'}</button></div><p className="ui-help">Verification makes one small test request. Your key is never sent to Ondrift.</p></div></li>
        </ol>
        {validation === 'valid' && <div className="ui-status ui-status--success" role="status"><Icon name="check" />Key verified. You’re ready for the privacy choices.</div>}
        {validation && !['idle', 'checking', 'valid'].includes(validation) && <div className="ui-status ui-status--error" role="alert">{validationCopy[validation as keyof typeof validationCopy]}</div>}
        <div className="onboarding-actions"><button className="ui-button ui-button--quiet" onClick={() => setPhase('intro')}>Back</button><button className="ui-button ui-button--primary" disabled={validation !== 'valid'} onClick={() => setPhase('privacy')}>Continue <Icon name="arrow" /></button></div>
      </>}

      {phase === 'privacy' && <>
        <p className="ui-eyebrow">Privacy choice</p>
        <h1>Local by design, explicit by default.</h1>
        <div className="data-route" aria-label="How your data moves"><div><strong>Your prompt</strong><span>Supported AI site</span></div><Icon name="arrow" /><div><strong>Gemini API</strong><span>Using your key</span></div><Icon name="arrow" /><div><strong>Local history</strong><span>This browser only</span></div></div>
        <div className="privacy-notes">
          <p><strong>Ondrift reads</strong> the text you ask it to rewrite, the supported site, score, and whether you applied the suggestion.</p>
          <p><strong>Ondrift does not collect</strong> AI response bodies, browsing history, or data from unsupported sites.</p>
          <p><strong>You stay in control.</strong> Disable either site, turn off history, or delete local records at any time in Settings.</p>
        </div>
        <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I understand how prompt text is processed and consent to enabling Ondrift on supported sites.</span></label>
        <div className="onboarding-actions"><button className="ui-button ui-button--quiet" onClick={() => setPhase('key')}>Back</button><button className="ui-button ui-button--primary" disabled={!consent} onClick={finish}>Enable Ondrift <Icon name="check" /></button></div>
      </>}

      {phase === 'complete' && <div className="complete-state"><span className="complete-mark"><Icon name="check" /></span><p className="ui-eyebrow">Setup complete</p><h1>You’re ready to write.</h1><p>Open ChatGPT, Claude, Gemini, or Perplexity and start a prompt. Ondrift will appear beside the composer when there is something useful to improve.</p><button className="ui-button ui-button--primary" onClick={() => bridge.openExternal('https://chatgpt.com/')}>Open ChatGPT <Icon name="external" /></button></div>}
    </section>
    <footer>Private, local, and reversible. No Ondrift account required.</footer>
  </main>;
}
