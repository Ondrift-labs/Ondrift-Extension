import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { uiBridge } from "../core/ui-bridge";
import { OnboardingApp } from "../ui/onboarding";
import { OptionsApp } from "../ui/options";
import type { UiSettings } from "../ui/shared/contracts";

function OptionsEntry() {
  const [settings, setSettings] = useState<UiSettings | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    uiBridge.getSettings().then(setSettings).catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <main role="alert">
        <h1>Ondrift settings could not load</h1>
        <p>Reload this page. Your local settings and history have not been changed.</p>
      </main>
    );
  }
  if (!settings) return <main role="status">Loading Ondrift settings…</main>;
  return settings.consentGranted ? (
    <OptionsApp bridge={uiBridge} />
  ) : (
    <OnboardingApp bridge={uiBridge} />
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("Ondrift options root was not found.");

createRoot(container).render(
  <React.StrictMode>
    <OptionsEntry />
  </React.StrictMode>,
);
