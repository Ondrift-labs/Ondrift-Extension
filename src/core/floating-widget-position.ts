const GAP = 8;
const VIEWPORT_MARGIN = 12;
const WIDGET_WIDTH = 430;

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
  /** Snaps the widget back to its auto-computed position, undoing any manual drag. */
  resetPosition(): void;
  /** True once the widget has been dragged away from its auto-computed position. */
  isRepositioned(): boolean;
}

export interface FloatingWidgetPlacementOptions {
  /** Element that starts a drag on pointerdown (e.g. the widget's header). Dragging is
   * disabled entirely when this is omitted. */
  dragHandle?: HTMLElement;
  /** Called whenever the repositioned flag flips, so the caller can show or hide a
   * "reset position" affordance. */
  onRepositionedChange?(repositioned: boolean): void;
}

export function placeFloatingWidget(
  widget: HTMLElement,
  anchor: HTMLElement,
  options: FloatingWidgetPlacementOptions = {},
): FloatingWidgetPlacement {
  widget.style.position = "fixed";
  widget.style.marginTop = "0";
  widget.style.zIndex = "2147483646";
  document.body.append(widget);

  // Offset (in px) the user has manually dragged the widget away from wherever
  // computeFloatingPosition would have placed it. Re-applied on top of the auto
  // position on every update, so the widget still tracks the composer on
  // scroll/resize instead of staying pinned to stale absolute coordinates.
  let manualOffset: { dx: number; dy: number } | null = null;

  const update = () => {
    if (!anchor.isConnected || !widget.isConnected) return;
    const anchorRect = anchor.getBoundingClientRect();
    const widgetRect = widget.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const position = computeFloatingPosition(anchorRect, widgetRect, viewport);
    const left = manualOffset
      ? clamp(position.left + manualOffset.dx, VIEWPORT_MARGIN, viewport.width - widgetRect.width - VIEWPORT_MARGIN)
      : position.left;
    const top = manualOffset
      ? clamp(position.top + manualOffset.dy, VIEWPORT_MARGIN, viewport.height - widgetRect.height - VIEWPORT_MARGIN)
      : position.top;
    widget.style.width = `${position.width}px`;
    widget.style.left = `${left}px`;
    widget.style.top = `${top}px`;
  };

  window.addEventListener("resize", update);
  document.addEventListener("scroll", update, true);
  const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
  observer?.observe(widget);
  observer?.observe(anchor);

  function resetPosition() {
    if (!manualOffset) return;
    manualOffset = null;
    options.onRepositionedChange?.(false);
    update();
  }

  const handle = options.dragHandle;
  let dragOrigin: { pointerX: number; pointerY: number; left: number; top: number } | null = null;

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if ((event.target as HTMLElement | null)?.closest("button")) return;
    const rect = widget.getBoundingClientRect();
    dragOrigin = { pointerX: event.clientX, pointerY: event.clientY, left: rect.left, top: rect.top };
    handle!.setPointerCapture(event.pointerId);
    handle!.setAttribute("data-dragging", "");
    event.preventDefault();
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!dragOrigin) return;
    const widgetRect = widget.getBoundingClientRect();
    const left = clamp(dragOrigin.left + (event.clientX - dragOrigin.pointerX), VIEWPORT_MARGIN, window.innerWidth - widgetRect.width - VIEWPORT_MARGIN);
    const top = clamp(dragOrigin.top + (event.clientY - dragOrigin.pointerY), VIEWPORT_MARGIN, window.innerHeight - widgetRect.height - VIEWPORT_MARGIN);
    widget.style.left = `${left}px`;
    widget.style.top = `${top}px`;
  };
  const endDrag = (event: PointerEvent) => {
    if (!dragOrigin) return;
    dragOrigin = null;
    handle!.removeAttribute("data-dragging");
    if (handle!.hasPointerCapture(event.pointerId)) handle!.releasePointerCapture(event.pointerId);
    const widgetRect = widget.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const auto = computeFloatingPosition(anchorRect, widgetRect, { width: window.innerWidth, height: window.innerHeight });
    manualOffset = { dx: widgetRect.left - auto.left, dy: widgetRect.top - auto.top };
    options.onRepositionedChange?.(true);
  };

  if (handle) {
    handle.setAttribute("data-draggable", "");
    handle.addEventListener("pointerdown", onPointerDown);
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
  }

  update();

  return {
    update,
    resetPosition,
    isRepositioned: () => manualOffset !== null,
    destroy() {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
      if (handle) {
        handle.removeEventListener("pointerdown", onPointerDown);
        handle.removeEventListener("pointermove", onPointerMove);
        handle.removeEventListener("pointerup", endDrag);
        handle.removeEventListener("pointercancel", endDrag);
        handle.removeAttribute("data-draggable");
        handle.removeAttribute("data-dragging");
      }
    },
  };
}
