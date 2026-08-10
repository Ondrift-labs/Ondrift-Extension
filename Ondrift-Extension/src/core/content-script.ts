import { contentController } from "./content-controller";
import { createInlineWidget } from "../ui/inline-widget";
import { ProviderError } from "../providers/errors";
import type { ExtensionSettings } from "../shared/types";
import { sendRuntimeMessage } from "./rewrite-client";
import { adapterRegistry } from "./adapter-registry";
import { findComposerAnchor } from "../adapters/site-adapter";

let currentInput: HTMLElement | null = null;
let removeInputListener: (() => void) | undefined;
let latestImprovedText = "";
let latestScore = 0;

const widget = createInlineWidget({
  onRewrite: () => { void runRewrite(); },
  onRetry: () => { void runRewrite(); },
  onApply: () => {
    contentController.apply();
    widget.setState({ status: "applied", score: latestScore, improvedText: latestImprovedText });
  },
  onOpenSettings: () => { void chrome.runtime.openOptionsPage(); },
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
}

async function runRewrite(): Promise<void> {
  widget.setState({ status: "loading" });
  try {
    const settings = await sendRuntimeMessage<ExtensionSettings>({ type: "settings_get" });
    const result = await contentController.rewrite(settings.persona);
    latestImprovedText = result.improvedText;
    latestScore = result.score;
    widget.setState({ status: "result", score: result.score, rationale: result.rationale, improvedText: result.improvedText });
  } catch (error) {
    if (error instanceof ProviderError && error.code === "not_configured") {
      widget.setState({ status: "missing_key" });
      return;
    }
    const code = error instanceof ProviderError ? error.code : "unknown";
    widget.setState({
      status: "error",
      kind: code === "quota_exceeded" ? "quota" : code === "network" ? "network" : code === "invalid_key" ? "invalid_key" : code === "request_rejected" ? "request" : code === "model_unavailable" || code === "service_unavailable" ? "unavailable" : code === "invalid_response" ? "parse" : "unknown",
      message: error instanceof Error ? error.message : undefined,
    });
  }
}

contentController.subscribe(({ input }) => {
  if (input === currentInput && widget.element.isConnected) return;
  removeInputListener?.();
  currentInput = input;
  if (!input) {
    widget.element.remove();
    return;
  }
  const listener = () => showReady();
  input.addEventListener("input", listener);
  removeInputListener = () => input.removeEventListener("input", listener);
  const anchor = findComposerAnchor(input);
  anchor.insertAdjacentElement("afterend", widget.element);
  showReady();
});

async function boot(): Promise<void> {
  const adapter = adapterRegistry.resolve();
  if (!adapter) return;
  try {
    const settings = await sendRuntimeMessage<ExtensionSettings>({ type: "settings_get" });
    if (!settings.enabledSites[adapter.id]) return;
  } catch {
    // The background may be waking up; rewrite will surface a structured error if it remains unavailable.
  }
  contentController.start();
}

void boot();

window.addEventListener("pagehide", () => {
  removeInputListener?.();
  widget.destroy();
  contentController.stop();
}, { once: true });
