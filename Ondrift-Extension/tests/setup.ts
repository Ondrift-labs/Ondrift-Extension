import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement layout, so it has no Element.scrollTo() at all (unlike
// window.scrollTo, which exists as a "not implemented" stub). Polyfill it so
// components that scroll a specific container don't have to guard every call.
if (!Element.prototype.scrollTo) Element.prototype.scrollTo = function scrollTo() { /* noop in jsdom */ };

// jsdom has no layout engine, so ResizeObserver doesn't exist at all. Components
// that watch an element's size (e.g. to detect scroll overflow) need this stub so
// they can observe/unobserve without throwing; since jsdom never actually resizes
// anything, the callback simply never fires here.
if (typeof ResizeObserver === "undefined") {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
