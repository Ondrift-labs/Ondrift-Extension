const GAP = 8;
const VIEWPORT_MARGIN = 12;
const WIDGET_WIDTH = 430;
/** Bounds for a user-driven resize -- narrow enough to still fit the score/action rows
 * without wrapping, wide enough that a bigger pick doesn't dwarf the composer beside it. */
const MIN_WIDGET_WIDTH = 320;
const MAX_WIDGET_WIDTH = 640;
/** Pointer travel required before a press becomes a drag. This keeps ordinary clicks
 * and small hand jitter available for activating the minimized widget. */
const DRAG_THRESHOLD = 5;
/** Width used while the widget is minimized to just its logo (see setCompact()) --
 * matches the circular ".od-shell--minimized" size in inline-widget's styles.ts. Without
 * this the host element would keep its full inline width even though the shell inside
 * shrinks visually, leaving an invisible click-blocking area over the page. */
const COMPACT_WIDTH = 42;

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
  preferredWidth = WIDGET_WIDTH,
): FloatingPosition {
  const width = Math.min(preferredWidth, viewport.width - VIEWPORT_MARGIN * 2);
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
  /** Snaps the widget back to its auto-computed position and width, undoing any manual
   * drag or resize. */
  resetPosition(): void;
  /** True once the widget has been dragged or resized away from its auto-computed layout. */
  isRepositioned(): boolean;
  /** Points the placement at a new anchor element without losing manual drag/resize state.
   * Chat apps frequently replace the composer's wrapping element while the widget's own
   * anchor reference goes stale (detached from the document) -- the caller re-resolves a
   * live anchor and hands it in here instead of tearing down and recreating the placement. */
  setAnchor(anchor: HTMLElement): void;
  /** Switches the host element's inline width between the full auto/manual width and a
   * small fixed size, to match the widget collapsing down to just its logo. A manual
   * resize (if any) is preserved and reapplied once compact mode is turned back off. */
  setCompact(compact: boolean): void;
}

export interface FloatingWidgetPlacementOptions {
  /** Element that starts a drag on pointerdown (e.g. the widget's header). Dragging is
   * disabled entirely when this is omitted. */
  dragHandle?: HTMLElement;
  /** Element that starts a width resize on pointerdown (e.g. a corner grip). Resizing is
   * disabled entirely when this is omitted. */
  resizeHandle?: HTMLElement;
  /** Called whenever the repositioned flag flips, so the caller can show or hide a
   * "reset position" affordance. */
  onRepositionedChange?(repositioned: boolean): void;
}

export function placeFloatingWidget(
  widget: HTMLElement,
  initialAnchor: HTMLElement,
  options: FloatingWidgetPlacementOptions = {},
): FloatingWidgetPlacement {
  widget.style.position = "fixed";
  widget.style.marginTop = "0";
  widget.style.zIndex = "2147483646";
  document.body.append(widget);

  let anchor = initialAnchor;

  // Offset (in px) the user has manually dragged the widget away from wherever
  // computeFloatingPosition would have placed it. Re-applied on top of the auto
  // position on every update, so the widget still tracks the composer on
  // scroll/resize instead of staying pinned to stale absolute coordinates.
  let manualOffset: { dx: number; dy: number } | null = null;
  // Width (in px) the user has manually dragged the resize handle to. Takes over from
  // the auto-computed width the same way manualOffset takes over from the auto position.
  let manualWidth: number | null = null;
  // True while the widget is minimized to just its logo -- see setCompact().
  let compact = false;

  const update = () => {
    if (!anchor.isConnected || !widget.isConnected) return;
    const anchorRect = anchor.getBoundingClientRect();
    const widgetRect = widget.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const preferredWidth = compact ? COMPACT_WIDTH : manualWidth ?? undefined;
    const position = computeFloatingPosition(anchorRect, widgetRect, viewport, preferredWidth);
    const left = manualOffset
      ? clamp(position.left + manualOffset.dx, VIEWPORT_MARGIN, viewport.width - position.width - VIEWPORT_MARGIN)
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
    if (!manualOffset && manualWidth === null) return;
    manualOffset = null;
    manualWidth = null;
    options.onRepositionedChange?.(false);
    update();
  }

  function setCompact(nextCompact: boolean) {
    if (compact === nextCompact) return;
    compact = nextCompact;
    update();
  }

  function setAnchor(nextAnchor: HTMLElement) {
    if (nextAnchor === anchor) return;
    observer?.unobserve(anchor);
    anchor = nextAnchor;
    observer?.observe(anchor);
    update();
  }

  const handle = options.dragHandle;
  let dragOrigin: { pointerX: number; pointerY: number; left: number; top: number; activated: boolean } | null = null;
  let suppressNextClick = false;

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if ((event.target as HTMLElement | null)?.closest("button")) return;
    suppressNextClick = false;
    const rect = widget.getBoundingClientRect();
    dragOrigin = { pointerX: event.clientX, pointerY: event.clientY, left: rect.left, top: rect.top, activated: false };
    handle!.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!dragOrigin) return;
    const dx = event.clientX - dragOrigin.pointerX;
    const dy = event.clientY - dragOrigin.pointerY;
    if (!dragOrigin.activated) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      dragOrigin.activated = true;
      handle!.setAttribute("data-dragging", "");
    }
    const widgetRect = widget.getBoundingClientRect();
    const left = clamp(dragOrigin.left + dx, VIEWPORT_MARGIN, window.innerWidth - widgetRect.width - VIEWPORT_MARGIN);
    const top = clamp(dragOrigin.top + dy, VIEWPORT_MARGIN, window.innerHeight - widgetRect.height - VIEWPORT_MARGIN);
    widget.style.left = `${left}px`;
    widget.style.top = `${top}px`;
  };
  const endDrag = (event: PointerEvent, suppressSyntheticClick: boolean) => {
    if (!dragOrigin) return;
    const wasActivated = dragOrigin.activated;
    dragOrigin = null;
    handle!.removeAttribute("data-dragging");
    if (handle!.hasPointerCapture(event.pointerId)) handle!.releasePointerCapture(event.pointerId);
    if (!wasActivated) return;
    suppressNextClick = suppressSyntheticClick;
    const widgetRect = widget.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const auto = computeFloatingPosition(anchorRect, widgetRect, viewport, manualWidth ?? undefined);
    manualOffset = { dx: widgetRect.left - auto.left, dy: widgetRect.top - auto.top };
    options.onRepositionedChange?.(true);
  };
  const onPointerUp = (event: PointerEvent) => endDrag(event, true);
  const onPointerCancel = (event: PointerEvent) => endDrag(event, false);
  const onClickAfterDrag = (event: MouseEvent) => {
    if (!suppressNextClick) return;
    suppressNextClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  if (handle) {
    handle.setAttribute("data-draggable", "");
    handle.addEventListener("pointerdown", onPointerDown);
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
    handle.addEventListener("pointercancel", onPointerCancel);
    handle.addEventListener("click", onClickAfterDrag, true);
  }

  const resizeHandle = options.resizeHandle;
  let resizeOrigin: { pointerX: number; width: number; left: number } | null = null;

  const onResizePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const rect = widget.getBoundingClientRect();
    resizeOrigin = { pointerX: event.clientX, width: rect.width, left: rect.left };
    resizeHandle!.setPointerCapture(event.pointerId);
    resizeHandle!.setAttribute("data-resizing", "");
    event.preventDefault();
    // A resize drag also moves the pointer over the header/shell; stop it from being
    // read as the start of a position drag too.
    event.stopPropagation();
  };
  const onResizePointerMove = (event: PointerEvent) => {
    if (!resizeOrigin) return;
    const maxWidth = Math.min(MAX_WIDGET_WIDTH, window.innerWidth - VIEWPORT_MARGIN - resizeOrigin.left);
    const width = clamp(resizeOrigin.width + (event.clientX - resizeOrigin.pointerX), MIN_WIDGET_WIDTH, maxWidth);
    manualWidth = width;
    widget.style.width = `${width}px`;
  };
  const endResize = (event: PointerEvent) => {
    if (!resizeOrigin) return;
    resizeOrigin = null;
    resizeHandle!.removeAttribute("data-resizing");
    if (resizeHandle!.hasPointerCapture(event.pointerId)) resizeHandle!.releasePointerCapture(event.pointerId);
    manualWidth = widget.getBoundingClientRect().width;
    options.onRepositionedChange?.(true);
    update();
  };

  if (resizeHandle) {
    resizeHandle.addEventListener("pointerdown", onResizePointerDown);
    resizeHandle.addEventListener("pointermove", onResizePointerMove);
    resizeHandle.addEventListener("pointerup", endResize);
    resizeHandle.addEventListener("pointercancel", endResize);
  }

  update();

  return {
    update,
    resetPosition,
    setAnchor,
    setCompact,
    isRepositioned: () => manualOffset !== null || manualWidth !== null,
    destroy() {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
      if (handle) {
        handle.removeEventListener("pointerdown", onPointerDown);
        handle.removeEventListener("pointermove", onPointerMove);
        handle.removeEventListener("pointerup", onPointerUp);
        handle.removeEventListener("pointercancel", onPointerCancel);
        handle.removeEventListener("click", onClickAfterDrag, true);
        handle.removeAttribute("data-draggable");
        handle.removeAttribute("data-dragging");
      }
      if (resizeHandle) {
        resizeHandle.removeEventListener("pointerdown", onResizePointerDown);
        resizeHandle.removeEventListener("pointermove", onResizePointerMove);
        resizeHandle.removeEventListener("pointerup", endResize);
        resizeHandle.removeEventListener("pointercancel", endResize);
        resizeHandle.removeAttribute("data-resizing");
      }
    },
  };
}
