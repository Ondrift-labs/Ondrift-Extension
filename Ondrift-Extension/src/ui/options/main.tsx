import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OnboardingApp } from '../onboarding';
import { chromeUiBridge } from '../shared/chromeBridge';
import { OptionsApp } from './OptionsApp';

function OptionsEntry() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  useEffect(() => { chromeUiBridge.getSettings().then((settings) => setOnboarded(settings.consentGranted)).catch(() => setOnboarded(true)); }, []);
  if (onboarded === null) return <main className="popup-state" role="status">Loading settings…</main>;
  return onboarded ? <OptionsApp bridge={chromeUiBridge} /> : <OnboardingApp bridge={{ ...chromeUiBridge, saveSettings: async (patch) => { const settings = await chromeUiBridge.saveSettings(patch); if (settings.consentGranted) setOnboarded(true); return settings; } }} />;
}

const root = document.getElementById('root');
if (!root) throw new Error('Options root element is missing');
createRoot(root).render(<React.StrictMode><OptionsEntry /></React.StrictMode>);
