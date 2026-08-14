import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement layout, so it has no Element.scrollTo() at all (unlike
// window.scrollTo, which exists as a "not implemented" stub). Polyfill it so
// components that scroll a specific container don't have to guard every call.
if (!Element.prototype.scrollTo) Element.prototype.scrollTo = function scrollTo() { /* noop in jsdom */ };
