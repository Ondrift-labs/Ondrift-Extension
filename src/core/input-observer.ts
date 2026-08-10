export interface InputObserverOptions {
  debounceMs?: number;
  root?: Node;
}

export function observeInput(
  locateInput: () => HTMLElement | null,
  onChange: (input: HTMLElement | null) => void,
  options: InputObserverOptions = {},
): () => void {
  const root = options.root ?? document.documentElement;
  const debounceMs = options.debounceMs ?? 250;
  let current: HTMLElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const check = () => {
    timer = undefined;
    const next = locateInput();
    if (next !== current || (next && !next.isConnected)) {
      current = next?.isConnected ? next : null;
    }
    // Supported chat apps frequently replace the widget's parent while keeping
    // the same composer node. Re-emit so consumers can reconcile detached UI.
    onChange(current);
  };
  const schedule = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(check, debounceMs);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "contenteditable", "hidden"] });
  check();

  return () => {
    observer.disconnect();
    if (timer !== undefined) clearTimeout(timer);
  };
}
