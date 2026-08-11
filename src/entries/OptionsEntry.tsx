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

  useEffect(() => {
    // chrome.runtime.openOptionsPage() (e.g. the inline widget's gear icon) reuses an
    // already-open options tab instead of opening a fresh one. If that tab was left open
    // mid-onboarding, it would otherwise keep showing whatever onboarding step it was on
    // forever, even after onboarding was actually finished in that same tab -- refetch
    // settings whenever the tab regains focus so it re-decides Onboarding vs. Options.
    function refresh() {
      uiBridge.getSettings().then(setSettings).catch(() => undefined);
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", refresh);
    };
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
