import { afterEach, describe, expect, it, vi } from "vitest";
import { computeFloatingPosition, placeFloatingWidget } from "../src/core/floating-widget-position";

describe("Gemini floating widget placement", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("places the widget immediately below the composer when space is available", () => {
    expect(computeFloatingPosition(
      { top: 200, right: 800, bottom: 300, left: 200, width: 600, height: 100 },
      { width: 390, height: 120 },
      { width: 1200, height: 800 },
    )).toEqual({ left: 200, top: 308, width: 430 });
  });

  it("moves the widget above the composer when the lower edge would be clipped", () => {
    expect(computeFloatingPosition(
      { top: 500, right: 800, bottom: 600, left: 200, width: 600, height: 100 },
      { width: 390, height: 180 },
      { width: 1200, height: 700 },
    )).toEqual({ left: 200, top: 312, width: 430 });
  });

  it("keeps the widget inside the horizontal viewport", () => {
    expect(computeFloatingPosition(
      { top: 100, right: 520, bottom: 180, left: 420, width: 100, height: 80 },
      { width: 390, height: 100 },
      { width: 500, height: 700 },
    )).toEqual({ left: 98, top: 188, width: 430 });
  });

  it("portals the widget to body and updates its fixed coordinates", () => {
    document.body.innerHTML = '<main><div id="composer"></div></main>';
    const anchor = document.querySelector<HTMLElement>("#composer")!;
    const widget = document.createElement("aside");
    vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue({
      top: 200, right: 800, bottom: 300, left: 200, width: 600, height: 100,
      x: 200, y: 200, toJSON: () => undefined,
    });
    vi.spyOn(widget, "getBoundingClientRect").mockReturnValue({
      top: 0, right: 390, bottom: 120, left: 0, width: 390, height: 120,
      x: 0, y: 0, toJSON: () => undefined,
    });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });

    const placement = placeFloatingWidget(widget, anchor);

    expect(widget.parentElement).toBe(document.body);
    expect(anchor.contains(widget)).toBe(false);
    expect(widget.style.position).toBe("fixed");
    expect(widget.style.left).toBe("200px");
    expect(widget.style.top).toBe("308px");
    placement.destroy();
  });
});
