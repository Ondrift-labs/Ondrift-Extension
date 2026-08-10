import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { uiBridge } from "../core/ui-bridge";
import { OnboardingApp } from "../ui/onboarding";
import { OptionsApp } from "../ui/options";
import type { UiSettings } from "../ui/shared/contracts";
import { getUiCopy, normalizeLanguage } from "../ui/shared/i18n";

function OptionsEntry() {
  const [settings, setSettings] = useState<UiSettings | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    uiBridge.getSettings().then(setSettings).catch(() => setFailed(true));
  }, []);

  const browserLanguage = normalizeLanguage(globalThis.navigator?.language);
  const common = getUiCopy(settings?.language ?? browserLanguage).common;

  useEffect(() => {
    document.documentElement.lang = settings?.language ?? browserLanguage;
  }, [browserLanguage, settings?.language]);

  if (failed) {
    return (
      <main role="alert">
        <h1>{common.settingsLoadErrorTitle}</h1>
        <p>{common.settingsLoadErrorBody}</p>
      </main>
    );
  }
  if (!settings) return <main role="status">{common.settingsLoading}</main>;
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
