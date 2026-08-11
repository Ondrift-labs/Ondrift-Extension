import { contentController } from "./content-controller";
import { createInlineWidget } from "../ui/inline-widget";
import { ProviderError } from "../providers/errors";
import type { ExtensionSettings } from "../shared/types";
import { sendRuntimeMessage } from "./rewrite-client";
import { adapterRegistry } from "./adapter-registry";
import { findComposerAnchor } from "../adapters/site-adapter";
import { placeFloatingWidget, type FloatingWidgetPlacement } from "./floating-widget-position";
import { isLanguageId } from "../ui/shared/i18n";
import { SETTINGS_STORAGE_KEY } from "../storage/settings";

let currentInput: HTMLElement | null = null;
let removeInputListener: (() => void) | undefined;
let floatingPlacement: FloatingWidgetPlacement | undefined;
let latestImprovedText = "";
let latestScore = 0;

const widget = createInlineWidget({
  onRewrite: () => { void runRewrite(); },
  onRetry: () => { void runRewrite(); },
  onApply: () => { void applyRewrite(); },
  onOpenSettings: () => { void sendRuntimeMessage<void>({ type: "open_options" }); },
});
widget.element.style.display = "block";
widget.element.style.marginTop = "8px";
widget.element.style.position = "relative";
widget.element.style.zIndex = "2147483646";

function promptLength(): number {
  if (!currentInput) return 0;
  return (currentInput instanceof HTMLTextAreaElement || currentInput instanceof HTMLInputElement
    ? currentInput.value
    : currentInput.innerText || currentInput.textContent || "").trim().length;
}

function showReady(): void {
  widget.setState({ status: "ready", promptLength: promptLength() });
  floatingPlacement?.update();
}

async function applyRewrite(): Promise<void> {
  try {
    await contentController.apply();
    widget.setState({ status: "applied", score: latestScore, improvedText: latestImprovedText });
    floatingPlacement?.update();
  } catch (error) {
    widget.setState({
      status: "error",
      kind: "unknown",
      message: error instanceof Error ? error.message : "The rewritten prompt could not be applied.",
    });
    floatingPlacement?.update();
  }
}

async function runRewrite(): Promise<void> {
  widget.setState({ status: "loading" });
  floatingPlacement?.update();
  try {
    const settings = await sendRuntimeMessage<ExtensionSettings>({ type: "settings_get" });
    widget.setLanguage(settings.language);
    const result = await contentController.rewrite(settings.persona);
    latestImprovedText = result.improvedText;
    latestScore = result.score;
    widget.setState({ status: "result", score: result.score, rationale: result.rationale, improvedText: result.improvedText });
    floatingPlacement?.update();
  } catch (error) {
    if (error instanceof ProviderError && error.code === "not_configured") {
      widget.setState({ status: "missing_key" });
      floatingPlacement?.update();
      return;
    }
    const code = error instanceof ProviderError ? error.code : "unknown";
    widget.setState({
      status: "error",
      kind: code === "quota_exceeded" ? "quota" : code === "network" ? "network" : code === "invalid_key" ? "invalid_key" : code === "request_rejected" ? "request" : code === "model_unavailable" || code === "service_unavailable" ? "unavailable" : code === "invalid_response" ? "parse" : "unknown",
      message: error instanceof Error ? error.message : undefined,
    });
    floatingPlacement?.update();
  }
}

contentController.subscribe(({ input }) => {
  if (input === currentInput && widget.element.isConnected) return;
  removeInputListener?.();
  floatingPlacement?.destroy();
  floatingPlacement = undefined;
  currentInput = input;
  if (!input) {
    widget.element.remove();
    return;
  }
  const listener = () => showReady();
  input.addEventListener("input", listener);
  removeInputListener = () => input.removeEventListener("input", listener);
  const adapter = adapterRegistry.resolve();
  const anchor = adapter?.getComposerAnchor?.(input) ?? findComposerAnchor(input);
  if (adapter?.id === "gemini") {
    floatingPlacement = placeFloatingWidget(widget.element, anchor);
  } else {
    widget.element.style.position = "relative";
    widget.element.style.marginTop = "8px";
    widget.element.style.width = "";
    widget.element.style.left = "";
    widget.element.style.top = "";
    anchor.insertAdjacentElement("afterend", widget.element);
  }
  showReady();
});

async function boot(): Promise<void> {
  const adapter = adapterRegistry.resolve();
  if (!adapter) return;
  try {
    const settings = await sendRuntimeMessage<ExtensionSettings>({ type: "settings_get" });
    widget.setLanguage(settings.language);
    if (!settings.enabledSites[adapter.id]) return;
  } catch {
    // The background may be waking up; rewrite will surface a structured error if it remains unavailable.
  }
  contentController.start();
}

void boot();

function onStorageChanged(changes: Record<string, chrome.storage.StorageChange>, areaName: string): void {
  if (areaName !== "local") return;
  const next = changes[SETTINGS_STORAGE_KEY]?.newValue as Partial<ExtensionSettings> | undefined;
  if (next && isLanguageId(next.language)) widget.setLanguage(next.language);
}
chrome.storage.onChanged.addListener(onStorageChanged);

window.addEventListener("pagehide", () => {
  chrome.storage.onChanged.removeListener(onStorageChanged);
  removeInputListener?.();
  floatingPlacement?.destroy();
  widget.destroy();
  contentController.stop();
}, { once: true });
