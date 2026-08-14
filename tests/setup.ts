import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement layout, so window.scrollTo() is a stub that logs
// "Not implemented" to the console on every call. Silence it here rather than
// in every test that happens to trigger a scroll.
window.scrollTo = () => undefined;
