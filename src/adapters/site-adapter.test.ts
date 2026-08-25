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
 * browser does), so the real CSS cascade can't be used to exercise either branch of
 * findComposerAnchor's border check here. Stub it to read from an explicit set of
 * "bordered" elements instead.
 */
function stubComputedBorder(bordered: ReadonlySet<Element>): void {
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
    const width = bordered.has(element) ? "1px" : "0px";
    return {
      borderTopWidth: width,
      borderRightWidth: width,
      borderBottomWidth: width,
      borderLeftWidth: width,
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
    stubComputedBorder(new Set([ancestors[1]]));
    expect(findComposerAnchor(input)).toBe(ancestors[1]);
  });

  it("falls back to the input itself when no ancestor has a border", () => {
    // Mirrors composers styled with box-shadow/background instead of a real CSS
    // border (e.g. Grok's), where the old fallback walked up to a wide,
    // full-bleed ancestor and misplaced the widget far from the actual input.
    const { input } = buildChain(3);
    stubComputedBorder(new Set());
    expect(findComposerAnchor(input)).toBe(input);
  });
});
