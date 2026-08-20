import { contentController } from "./content-controller";
import { createInlineWidget } from "../ui/inline-widget";
import { ProviderError, providerErrorReason } from "../providers/errors";
import type { ExtensionSettings, RewriteResult } from "../shared/types";
import { isExtensionContextInvalidated, sendRuntimeMessage } from "./rewrite-client";
import { adapterRegistry } from "./adapter-registry";
import { findComposerAnchor } from "../adapters/site-adapter";
import { placeFloatingWidget, type FloatingWidgetPlacement } from "./floating-widget-position";
import { isLanguageId } from "../ui/shared/i18n";
import { SETTINGS_STORAGE_KEY } from "../storage/settings";

// Only the fields `applyRewrite` needs to re-apply after `runRewrite` reports a result --
// `rationale` is shown once from the fresh `RewriteResult` and never needed again.
type LatestResult = Pick<RewriteResult, "previousScore" | "score" | "improvedText">;

let currentInput: HTMLElement | null = null;
let currentAnchor: HTMLElement | null = null;
let removeInputListener: (() => void) | undefined;
let floatingPlacement: FloatingWidgetPlacement | undefined;
// Tracked separately from the placement itself so it survives a composer swap: `input ===
// currentInput` teardown below destroys and recreates `floatingPlacement` (a fresh anchor),
// and the new one needs to start compact too if the user had minimized the widget.
let minimized = false;
let latestResult: LatestResult = { previousScore: 0, score: 0, improvedText: "" };
// Guards against a rewrite fired while one is already in flight -- see runRewrite() and
// showReady() below.
let rewriteInFlight = false;

const widget = createInlineWidget({
  onRewrite: () => { void runRewrite(); },
  onRetry: () => { void runRewrite(); },
  onApply: () => { void applyRewrite(); },
  onOpenSettings: () => { void openSettings(); },
  onReloadPage: () => window.location.reload(),
  onResetPosition: () => floatingPlacement?.resetPosition(),
  onMinimizedChange: (next) => { minimized = next; floatingPlacement?.setCompact(next); },
});

function promptLength(): number {
  if (!currentInput) return 0;
  return (currentInput instanceof HTMLTextAreaElement || currentInput instanceof HTMLInputElement
    ? currentInput.value
    : currentInput.innerText || currentInput.textContent || "").trim().length;
}

function showReady(): void {
  // A prompt edit while a rewrite is in flight would otherwise flip the widget back to its
  // "ready" state (re-enabling the button) mid-request, letting a second, overlapping
  // rewrite fire on the same session -- see runRewrite(). Once the in-flight request
  // settles it renders its own "result"/"error" state, so there's nothing to restore here.
  if (rewriteInFlight) return;
  widget.setState({ status: "ready", promptLength: promptLength() });
  floatingPlacement?.update();
}

async function openSettings(): Promise<void> {
  try {
    await sendRuntimeMessage<void>({ type: "open_options" });
  } catch {
    // A tab kept open across an extension reload/update continues to show its old
    // widget, but Chrome invalidates that content script's extension context. The
    // page must reload before it can talk to the extension again.
    widget.setState({ status: "reload_required" });
    floatingPlacement?.update();
  }
}

async function applyRewrite(): Promise<void> {
  try {
    await contentController.apply();
    widget.setState({ status: "applied", ...latestResult });
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
  // onRewrite/onRetry both call this; a click while a request is already pending would
  // otherwise start a second, overlapping rewrite on the same session (see showReady()).
  if (rewriteInFlight) return;
  rewriteInFlight = true;
  widget.setState({ status: "loading" });
  floatingPlacement?.update();
  try {
    const settings = await sendRuntimeMessage<ExtensionSettings>({ type: "settings_get" });
    widget.setLanguage(settings.language);
    const result = await contentController.rewrite(settings.persona);
    latestResult = { previousScore: result.previousScore, score: result.score, improvedText: result.improvedText };
    widget.setState({ status: "result", previousScore: result.previousScore, score: result.score, rationale: result.rationale, improvedText: result.improvedText });
    floatingPlacement?.update();
  } catch (error) {
    if (error instanceof ProviderError && error.code === "not_configured") {
      widget.setState({ status: "missing_key" });
      floatingPlacement?.update();
      return;
    }
    // Mirrors openSettings()'s handling of the same failure: a non-ProviderError means the
    // background was never reached at all (most commonly because this tab's extension
    // context was invalidated by an extension reload/update), not that it responded with a
    // rewrite failure, so the recovery step is reloading the page rather than a retry.
    if (isExtensionContextInvalidated(error)) {
      widget.setState({ status: "reload_required" });
      floatingPlacement?.update();
      return;
    }
    const code = error instanceof ProviderError ? error.code : "unknown";
    widget.setState({
      status: "error",
      // `invalid_response` has no equivalent in the shared reason set (it's specific to a
      // rewrite call failing to parse, not an API-key validation outcome), so it's handled
      // here on top of the shared mapping instead of being folded into it.
      kind: code === "invalid_response" ? "parse" : providerErrorReason(code),
      message: error instanceof Error ? error.message : undefined,
    });
    floatingPlacement?.update();
  } finally {
    rewriteInFlight = false;
  }
}

contentController.subscribe(({ input }) => {
  if (input === currentInput && widget.element.isConnected) {
    // The composer node itself is unchanged, but chat apps frequently replace its
    // wrapping anchor on every turn while leaving `input` in place. When that happens
    // `currentAnchor` goes stale (detached from the document), which silently breaks
    // both auto-tracking and the reset-position button: floating-widget-position.ts's
    // update() bails out whenever the anchor it holds isn't connected, so clicking
    // reset still flips the button off but never actually moves the widget back.
    // Re-resolve a live anchor and hand it to the existing placement instead of
    // tearing the whole thing down, so a manual drag/resize survives the swap.
    if (currentAnchor && !currentAnchor.isConnected && input) {
      const adapter = adapterRegistry.resolve();
      currentAnchor = adapter?.getComposerAnchor?.(input) ?? findComposerAnchor(input);
      floatingPlacement?.setAnchor(currentAnchor);
    }
    return;
  }
  removeInputListener?.();
  floatingPlacement?.destroy();
  floatingPlacement = undefined;
  widget.setRepositioned(false);
  currentInput = input;
  if (!input) {
    widget.element.remove();
    currentAnchor = null;
    return;
  }
  const listener = () => showReady();
  input.addEventListener("input", listener);
  removeInputListener = () => input.removeEventListener("input", listener);
  const adapter = adapterRegistry.resolve();
  const anchor = adapter?.getComposerAnchor?.(input) ?? findComposerAnchor(input);
  currentAnchor = anchor;
  // Every adapter now pins the widget beside its composer with fixed coordinates
  // (originally added for Gemini alone, where inserting the widget into normal
  // document flow got it clipped/removed by the composer's own re-renders -- see
  // "mount Gemini widget outside composer" / "pin Gemini widget beside composer").
  // Using it everywhere also means dragging, resizing, and reset-position work on
  // every site.
  floatingPlacement = placeFloatingWidget(widget.element, anchor, {
    dragHandle: widget.dragHandle,
    resizeHandle: widget.resizeHandle,
    onRepositionedChange: (repositioned) => widget.setRepositioned(repositioned),
  });
  floatingPlacement.setCompact(minimized);
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
// `chrome.storage` itself (not just individual calls into it) goes undefined once this
// tab's extension context is invalidated -- e.g. the extension updates or reloads while
// the tab stays open. Reading `.onChanged` off it then throws a plain TypeError, which
// (unlike the rejections `sendRuntimeMessage` produces) isn't something a try/catch
// around an awaited call can catch, so guard the property access itself instead.
chrome.storage?.onChanged?.addListener(onStorageChanged);

function teardown(): void {
  chrome.storage?.onChanged?.removeListener(onStorageChanged);
  removeInputListener?.();
  floatingPlacement?.destroy();
  widget.destroy();
  contentController.stop();
}

// Not `{ once: true }`: a page that's eligible for the back/forward cache can go through
// pagehide/pageshow more than once without the content script ever being torn down and
// re-injected, so teardown has to be able to run every time the page is hidden, not just
// on the first (which might not even be a real unload).
window.addEventListener("pagehide", teardown);

window.addEventListener("pageshow", (event) => {
  // A non-persisted pageshow is just the page's normal first paint, already covered by the
  // boot() call below at module load. Only a bfcache restore (`persisted`) needs the
  // explicit re-init, since the script itself never re-ran for that case.
  if (!event.persisted) return;
  chrome.storage?.onChanged?.addListener(onStorageChanged);
  void boot();
});
