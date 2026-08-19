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

  it("drags the widget by its handle and reports the repositioned state", () => {
    document.body.innerHTML = '<main><div id="composer"></div></main>';
    const anchor = document.querySelector<HTMLElement>("#composer")!;
    const widget = document.createElement("aside");
    const handle = document.createElement("header");
    widget.append(handle);
    vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue({
      top: 200, right: 800, bottom: 300, left: 200, width: 600, height: 100,
      x: 200, y: 200, toJSON: () => undefined,
    });
    vi.spyOn(widget, "getBoundingClientRect").mockReturnValue({
      top: 308, right: 590, bottom: 428, left: 200, width: 390, height: 120,
      x: 200, y: 308, toJSON: () => undefined,
    });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    handle.setPointerCapture = vi.fn();
    handle.releasePointerCapture = vi.fn();
    handle.hasPointerCapture = vi.fn().mockReturnValue(true);

    const onRepositionedChange = vi.fn();
    const placement = placeFloatingWidget(widget, anchor, { dragHandle: handle, onRepositionedChange });

    expect(handle.getAttribute("data-draggable")).toBe("");
    expect(placement.isRepositioned()).toBe(false);

    handle.dispatchEvent(new PointerEvent("pointerdown", { clientX: 210, clientY: 320, pointerId: 1 }));
    expect(handle.getAttribute("data-dragging")).toBe("");
    handle.dispatchEvent(new PointerEvent("pointermove", { clientX: 260, clientY: 370, pointerId: 1 }));
    expect(widget.style.left).toBe("250px");
    expect(widget.style.top).toBe("358px");
    handle.dispatchEvent(new PointerEvent("pointerup", { clientX: 260, clientY: 370, pointerId: 1 }));

    expect(handle.hasAttribute("data-dragging")).toBe(false);
    expect(placement.isRepositioned()).toBe(true);
    expect(onRepositionedChange).toHaveBeenCalledWith(true);

    placement.resetPosition();
    expect(placement.isRepositioned()).toBe(false);
    expect(onRepositionedChange).toHaveBeenCalledWith(false);
    expect(widget.style.left).toBe("200px");
    expect(widget.style.top).toBe("308px");

    placement.destroy();
    expect(handle.getAttribute("data-draggable")).toBeNull();
  });

  it("resizes the widget by its handle and reports the repositioned state", () => {
    document.body.innerHTML = '<main><div id="composer"></div></main>';
    const anchor = document.querySelector<HTMLElement>("#composer")!;
    const widget = document.createElement("aside");
    const resizeHandle = document.createElement("div");
    widget.append(resizeHandle);
    let width = 390;
    vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue({
      top: 200, right: 800, bottom: 300, left: 200, width: 600, height: 100,
      x: 200, y: 200, toJSON: () => undefined,
    });
    vi.spyOn(widget, "getBoundingClientRect").mockImplementation(() => ({
      top: 308, right: 200 + width, bottom: 428, left: 200, width, height: 120,
      x: 200, y: 308, toJSON: () => undefined,
    }));
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    resizeHandle.setPointerCapture = vi.fn();
    resizeHandle.releasePointerCapture = vi.fn();
    resizeHandle.hasPointerCapture = vi.fn().mockReturnValue(true);

    const onRepositionedChange = vi.fn();
    const placement = placeFloatingWidget(widget, anchor, { resizeHandle, onRepositionedChange });

    expect(placement.isRepositioned()).toBe(false);

    resizeHandle.dispatchEvent(new PointerEvent("pointerdown", { clientX: 590, clientY: 428, pointerId: 1 }));
    expect(resizeHandle.getAttribute("data-resizing")).toBe("");
    resizeHandle.dispatchEvent(new PointerEvent("pointermove", { clientX: 640, clientY: 428, pointerId: 1 }));
    expect(widget.style.width).toBe("440px");
    width = 440;
    resizeHandle.dispatchEvent(new PointerEvent("pointerup", { clientX: 640, clientY: 428, pointerId: 1 }));

    expect(resizeHandle.hasAttribute("data-resizing")).toBe(false);
    expect(placement.isRepositioned()).toBe(true);
    expect(onRepositionedChange).toHaveBeenCalledWith(true);

    placement.resetPosition();
    expect(placement.isRepositioned()).toBe(false);
    expect(widget.style.width).toBe("430px");

    placement.destroy();
  });

  it("re-anchors without losing a manual drag when the caller swaps in a live anchor", () => {
    document.body.innerHTML = '<main><div id="composer"></div><div id="composer-2"></div></main>';
    const anchor = document.querySelector<HTMLElement>("#composer")!;
    const nextAnchor = document.querySelector<HTMLElement>("#composer-2")!;
    const widget = document.createElement("aside");
    const handle = document.createElement("header");
    widget.append(handle);
    vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue({
      top: 200, right: 800, bottom: 300, left: 200, width: 600, height: 100,
      x: 200, y: 200, toJSON: () => undefined,
    });
    vi.spyOn(nextAnchor, "getBoundingClientRect").mockReturnValue({
      top: 400, right: 800, bottom: 500, left: 250, width: 600, height: 100,
      x: 250, y: 400, toJSON: () => undefined,
    });
    vi.spyOn(widget, "getBoundingClientRect").mockReturnValue({
      top: 358, right: 640, bottom: 478, left: 250, width: 390, height: 120,
      x: 250, y: 358, toJSON: () => undefined,
    });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    handle.setPointerCapture = vi.fn();
    handle.releasePointerCapture = vi.fn();
    handle.hasPointerCapture = vi.fn().mockReturnValue(true);

    const placement = placeFloatingWidget(widget, anchor, { dragHandle: handle });
    handle.dispatchEvent(new PointerEvent("pointerdown", { clientX: 210, clientY: 320, pointerId: 1 }));
    handle.dispatchEvent(new PointerEvent("pointermove", { clientX: 260, clientY: 370, pointerId: 1 }));
    handle.dispatchEvent(new PointerEvent("pointerup", { clientX: 260, clientY: 370, pointerId: 1 }));
    expect(placement.isRepositioned()).toBe(true);

    // Simulate the composer's wrapping anchor getting detached, the way chat apps
    // replace it on every turn while `input` itself is untouched.
    anchor.remove();
    expect(anchor.isConnected).toBe(false);
    // A sentinel value distinct from anything computeFloatingPosition would ever
    // produce here, so a no-op update() is distinguishable from one that overwrote it.
    widget.style.left = "999px";
    placement.update();
    expect(widget.style.left).toBe("999px");

    placement.setAnchor(nextAnchor);
    expect(widget.style.left).not.toBe("999px");
    expect(placement.isRepositioned()).toBe(true);

    placement.destroy();
  });
});
