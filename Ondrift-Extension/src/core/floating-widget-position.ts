const GAP = 8;
const VIEWPORT_MARGIN = 12;
const WIDGET_WIDTH = 390;

interface Rectangle {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

export interface FloatingPosition {
  left: number;
  top: number;
  width: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function computeFloatingPosition(
  anchor: Rectangle,
  widget: Pick<Rectangle, "width" | "height">,
  viewport: Viewport,
): FloatingPosition {
  const width = Math.min(WIDGET_WIDTH, viewport.width - VIEWPORT_MARGIN * 2);
  const measuredWidth = widget.width || width;
  const left = clamp(anchor.left, VIEWPORT_MARGIN, viewport.width - measuredWidth - VIEWPORT_MARGIN);
  const below = anchor.bottom + GAP;
  const above = anchor.top - widget.height - GAP;
  const top = below + widget.height <= viewport.height - VIEWPORT_MARGIN
    ? below
    : Math.max(VIEWPORT_MARGIN, above);
  return { left, top, width };
}

export interface FloatingWidgetPlacement {
  update(): void;
  destroy(): void;
}

export function placeFloatingWidget(widget: HTMLElement, anchor: HTMLElement): FloatingWidgetPlacement {
  widget.style.position = "fixed";
  widget.style.marginTop = "0";
  widget.style.zIndex = "2147483646";
  document.body.append(widget);

  const update = () => {
    if (!anchor.isConnected || !widget.isConnected) return;
    const anchorRect = anchor.getBoundingClientRect();
    const widgetRect = widget.getBoundingClientRect();
    const position = computeFloatingPosition(anchorRect, widgetRect, {
      width: window.innerWidth,
      height: window.innerHeight,
    });
    widget.style.width = `${position.width}px`;
    widget.style.left = `${position.left}px`;
    widget.style.top = `${position.top}px`;
  };

  window.addEventListener("resize", update);
  document.addEventListener("scroll", update, true);
  const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
  observer?.observe(widget);
  observer?.observe(anchor);
  update();

  return {
    update,
    destroy() {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    },
  };
}
