import { useEffect, useMemo, useRef, useState } from 'react';
import { AI_STUDIO_API_KEY_URL, DEFAULT_SETTINGS, isValidationError, type ApiKeyValidationState, type LanguageId, type UiBridge } from '../shared/contracts';
import { getUiCopy, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../shared/i18n';
import { Icon } from '../shared/Icon';
import '../shared/ui.css';
import './onboarding.css';

type Phase = 'intro' | 'key' | 'privacy' | 'complete';
// How far (in px) content must overflow the scroll area before the "scroll for more" hint shows.
const SCROLL_HINT_THRESHOLD_PX = 24;

export function OnboardingApp({ bridge }: { bridge: UiBridge }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [apiKey, setApiKey] = useState('');
  const [validation, setValidation] = useState<ApiKeyValidationState>('idle');
  const [consent, setConsent] = useState(false);
  const [showGuideImages, setShowGuideImages] = useState(true);
  const [keyStep, setKeyStep] = useState<0 | 1 | 2>(0);
  const [language, setLanguage] = useState<LanguageId>(DEFAULT_SETTINGS.language);
  const [canScrollMore, setCanScrollMore] = useState(false);
  const step = useMemo(() => ({ intro: 1, key: 2, privacy: 3, complete: 3 })[phase], [phase]);
  const copy = getUiCopy(language).onboarding;
  const common = getUiCopy(language).common;
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = 'Ondrift';
  }, [language]);

  useEffect(() => { bridge.getSettings().then((settings) => setLanguage(settings.language)).catch((error) => console.error('Ondrift: failed to load saved language', error)); }, [bridge]);

  // Each key-setup slide can be a different height (screenshots, help text, status
  // messages). Resetting the scroll area to the top on every step/phase change means
  // a taller previous screen never leaves the next one starting mid-scroll.
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [phase, keyStep]);

  // Shows a bouncing "scroll for more" hint whenever the current slide's content
  // (a tall screenshot, say) overflows the scroll area. Watches both the scroll
  // container (viewport size changes) and the panel itself (content size changes,
  // e.g. an image finishing layout) so it stays accurate without polling.
  useEffect(() => {
    const scrollEl = scrollRef.current;
    const panelEl = panelRef.current;
    if (!scrollEl || !panelEl) return;
    function update() {
      if (!scrollEl) return;
      const remaining = scrollEl.scrollHeight - scrollEl.clientHeight - scrollEl.scrollTop;
      setCanScrollMore(remaining > SCROLL_HINT_THRESHOLD_PX);
    }
    update();
    scrollEl.addEventListener('scroll', update);
    const observer = new ResizeObserver(update);
    observer.observe(scrollEl);
    observer.observe(panelEl);
    return () => {
      scrollEl.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [phase, keyStep]);

  function scrollToBottom() {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
  }

  async function changeLanguage(next: LanguageId) {
    setLanguage(next);
    await bridge.saveSettings({ language: next }).catch((error) => console.error('Ondrift: failed to save language', error));
  }

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
      <a className="brand" href="#main" aria-label={common.brandHomeAria}><img className="brand-logo" src="/icons/ondrift-32.png" alt="" /><span>Ondrift</span></a>
      <div className="onboarding-header-right">
        <label className="language-select"><span className="sr-only">{common.languageLabel}</span><select aria-label={copy.languageSelectorAria} value={language} onChange={(event) => changeLanguage(event.target.value as LanguageId)}>{SUPPORTED_LANGUAGES.map((id) => <option key={id} value={id}>{LANGUAGE_NAMES[id]}</option>)}</select></label>
        <span className="step-count">{copy.stepCount(step, 3)}</span>
      </div>
    </header>
    <div className="step-track" aria-hidden="true"><span style={{ width: `${step / 3 * 100}%` }} /></div>

    <div className="onboarding-scroll-area">
    <div className="onboarding-scroll" ref={scrollRef}>
      <section className="onboarding-panel" id="main" aria-live="polite" ref={panelRef}>
      {phase === 'intro' && <>
        <p className="ui-eyebrow">{copy.intro.eyebrow}</p>
        <h1>{copy.intro.title}</h1>
        <p className="onboarding-lead">{copy.intro.lead}</p>
        <div className="promise-list">
          {copy.intro.promises.map((promise, index) => <div key={promise.title}><span>{String(index + 1).padStart(2, '0')}</span><p><strong>{promise.title}</strong>{promise.body}</p></div>)}
        </div>
      </>}

      {phase === 'key' && <>
        <p className="ui-eyebrow">{copy.key.eyebrow}</p>
        <div className="key-title-row"><h1>{copy.key.title}</h1><button type="button" className="guide-toggle" onClick={() => setShowGuideImages((current) => !current)}>{copy.key.guideToggleCta(showGuideImages)}</button></div>
        <div className="key-dots" aria-hidden="true"><span className={keyStep === 0 ? 'is-active' : undefined} /><span className={keyStep === 1 ? 'is-active' : undefined} /><span className={keyStep === 2 ? 'is-active' : undefined} /></div>
        <p className="sr-only" aria-live="polite">{copy.key.subStepCount(keyStep + 1, 3)}</p>

        <div className="key-slide" key={keyStep}>
          {keyStep === 0 && <>
            <span className="key-slide-number">1</span>
            <strong>{copy.key.step1Title}</strong>
            <p>{copy.key.step1Body}</p>
            <button className="ui-button ui-button--secondary" onClick={() => bridge.openExternal(AI_STUDIO_API_KEY_URL)}>{copy.key.step1Cta} <Icon name="external" /></button>
            {showGuideImages && <img className="key-step-image" src="/onboarding/api-keys-empty.png" alt={copy.key.step1ImageAlt} />}
          </>}

          {keyStep === 1 && <>
            <span className="key-slide-number">2</span>
            <strong>{copy.key.step2Title}</strong>
            <p>{copy.key.step2Body}</p>
            {showGuideImages && <img className="key-step-image" src="/onboarding/create-key-dialog.png" alt={copy.key.step2ImageAlt} />}
          </>}

          {keyStep === 2 && <>
            <span className="key-slide-number">3</span>
            <div className="ui-field">
              <label className="ui-label" htmlFor="onboarding-key">{copy.key.step3Label}</label>
              <div className="key-row"><input id="onboarding-key" className="ui-input" type="password" autoComplete="off" spellCheck={false} value={apiKey} onChange={(event) => { setApiKey(event.target.value); setValidation('idle'); }} placeholder={copy.key.step3Placeholder} /><button className="ui-button ui-button--primary" disabled={!apiKey.trim() || validation === 'checking'} onClick={validateKey}>{validation === 'checking' ? common.checking : copy.key.verifyCta}</button></div>
              <p className="ui-help">{copy.key.step3Help}</p>
              {showGuideImages && <img className="key-step-image" src="/onboarding/key-created.png" alt={copy.key.step3ImageAlt} />}
            </div>
            {validation === 'valid' && <div className="ui-status ui-status--success" role="status"><Icon name="check" />{copy.key.keySuccess}</div>}
            {isValidationError(validation) && <div className="ui-status ui-status--error validation-error" role="alert">
              <span>{copy.key.validation[validation]}</span>
              <button type="button" className="ui-button ui-button--secondary" onClick={() => bridge.openExternal(AI_STUDIO_API_KEY_URL)}>{copy.key.step1Cta} <Icon name="external" /></button>
            </div>}
          </>}
        </div>
      </>}

      {phase === 'privacy' && <>
        <p className="ui-eyebrow">{copy.privacy.eyebrow}</p>
        <h1>{copy.privacy.title}</h1>
        <div className="data-route" aria-label={copy.privacy.routeAria}><div><strong>{copy.privacy.routePrompt.title}</strong><span>{copy.privacy.routePrompt.detail}</span></div><Icon name="arrow" /><div><strong>{copy.privacy.routeApi.title}</strong><span>{copy.privacy.routeApi.detail}</span></div><Icon name="arrow" /><div><strong>{copy.privacy.routeHistory.title}</strong><span>{copy.privacy.routeHistory.detail}</span></div></div>
        <div className="privacy-notes">
          {copy.privacy.notes.map((note) => <p key={note.lead}><strong>{note.lead}</strong>{note.rest}</p>)}
        </div>
        <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{copy.privacy.consentLabel}</span></label>
      </>}

      {phase === 'complete' && <div className="complete-state"><span className="complete-mark"><Icon name="check" /></span><p className="ui-eyebrow">{copy.complete.eyebrow}</p><h1>{copy.complete.title}</h1><p>{copy.complete.body}</p><button className="ui-button ui-button--primary" onClick={() => bridge.openExternal('https://chatgpt.com/')}>{copy.complete.cta} <Icon name="external" /></button></div>}
      </section>
    </div>
    {canScrollMore && <button type="button" className="scroll-hint" aria-label={common.scrollHintAria} onClick={scrollToBottom}><Icon name="chevron" /></button>}
    </div>

    {phase !== 'complete' && <div className="onboarding-nav">
      <div className="onboarding-nav-left">
        {phase === 'key' && <button className="ui-button ui-button--quiet" onClick={() => (keyStep === 0 ? setPhase('intro') : setKeyStep((keyStep - 1) as 0 | 1))}>{common.back}</button>}
        {phase === 'privacy' && <button className="ui-button ui-button--quiet" onClick={() => setPhase('key')}>{common.back}</button>}
      </div>
      <div className="onboarding-nav-right">
        {phase === 'intro' && <button className="ui-button ui-button--primary" onClick={() => setPhase('key')}>{copy.intro.cta} <Icon name="arrow" /></button>}
        {phase === 'key' && (keyStep < 2
          ? <button className="ui-button ui-button--primary" onClick={() => setKeyStep((keyStep + 1) as 1 | 2)}>{copy.key.nextCta} <Icon name="arrow" /></button>
          : <button className="ui-button ui-button--primary" disabled={validation !== 'valid'} onClick={() => setPhase('privacy')}>{copy.key.continueCta} <Icon name="arrow" /></button>)}
        {phase === 'privacy' && <button className="ui-button ui-button--primary" disabled={!consent} onClick={finish}>{copy.privacy.enableCta} <Icon name="check" /></button>}
      </div>
    </div>}

    <footer>{copy.footer}</footer>
  </main>;
}
