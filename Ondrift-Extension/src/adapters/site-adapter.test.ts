import { afterEach, describe, expect, it, vi } from "vitest";
import { findComposerAnchor } from "./site-adapter";

function buildChain(depth: number): { input: HTMLElement; ancestors: HTMLElement[] } {
  const input = document.createElement("textarea");
  let current: HTMLElement = input;
  const ancestors: HTMLElement[] = [];
  for (let index = 0; index < depth; index += 1) {
    const wrapper = document.createElement("div");
    wrapper.appendChild(current);
    ancestors.push(wrapper);
    current = wrapper;
  }
  document.body.appendChild(current);
  return { input, ancestors };
}

/**
 * jsdom's getComputedStyle reports a non-zero borderTopWidth for every element
 * regardless of border-style (it doesn't implement the "none" case the way a real
 * browser does), so the real CSS cascade can't be used to exercise findComposerAnchor's
 * branches here. Stub it to read from explicit sets of "bordered" and "pill-styled"
 * elements instead.
 */
function stubComputedStyle(options: { bordered?: ReadonlySet<Element>; pill?: ReadonlySet<Element> } = {}): void {
  const bordered = options.bordered ?? new Set<Element>();
  const pill = options.pill ?? new Set<Element>();
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
    const borderWidth = bordered.has(element) ? "1px" : "0px";
    const isPill = pill.has(element);
    return {
      borderTopWidth: borderWidth,
      borderRightWidth: borderWidth,
      borderBottomWidth: borderWidth,
      borderLeftWidth: borderWidth,
      borderTopLeftRadius: isPill ? "9999px" : "0px",
      borderRadius: isPill ? "9999px" : "0px",
      backgroundColor: isPill ? "rgb(240, 240, 240)" : "rgba(0, 0, 0, 0)",
    } as CSSStyleDeclaration;
  });
}

describe("findComposerAnchor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("returns the nearest ancestor with a visible border", () => {
    const { input, ancestors } = buildChain(3);
    stubComputedStyle({ bordered: new Set([ancestors[1]]) });
    expect(findComposerAnchor(input)).toBe(ancestors[1]);
  });

  it("returns the nearest ancestor that looks like a rounded composer pill", () => {
    // Mirrors composers that wrap the input, leading icon, and trailing controls in a
    // single rounded, filled container with no real CSS border -- e.g. Grok's.
    const { input, ancestors } = buildChain(3);
    stubComputedStyle({ pill: new Set([ancestors[0]]) });
    expect(findComposerAnchor(input)).toBe(ancestors[0]);
  });

  it("falls back to the input itself when nothing looks like a composer box", () => {
    // Where the old fallback walked up to a wide, full-bleed ancestor and misplaced the
    // widget far from the actual input.
    const { input } = buildChain(3);
    stubComputedStyle();
    expect(findComposerAnchor(input)).toBe(input);
  });
});
