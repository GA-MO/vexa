"use client";

import { Button } from "vexa/ui/button";
import { cn } from "vexa/lib/utils";
import type { ComponentProps, MouseEvent, PointerEvent, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const FADE_WIDTH = "24px";
const DRAG_THRESHOLD_PX = 4;
const SCROLL_EPSILON_PX = 1;

type Overflow = { left: boolean; right: boolean };

const NO_OVERFLOW: Overflow = { left: false, right: false };

const FADE_MASKS: Record<"left" | "right" | "both", string> = {
  left: `linear-gradient(to right, transparent, black ${FADE_WIDTH})`,
  right: `linear-gradient(to right, black calc(100% - ${FADE_WIDTH}), transparent)`,
  both: `linear-gradient(to right, transparent, black ${FADE_WIDTH}, black calc(100% - ${FADE_WIDTH}), transparent)`,
};

function fadeMask({ left, right }: Overflow): string | undefined {
  if (left && right) return FADE_MASKS.both;
  if (left) return FADE_MASKS.left;
  if (right) return FADE_MASKS.right;
  return undefined;
}

function measureOverflow(element: HTMLElement): Overflow {
  const maxScrollLeft = element.scrollWidth - element.clientWidth;
  return {
    left: element.scrollLeft > SCROLL_EPSILON_PX,
    right: element.scrollLeft < maxScrollLeft - SCROLL_EPSILON_PX,
  };
}

function useOverflow(ref: RefObject<HTMLDivElement | null>) {
  const [overflow, setOverflow] = useState<Overflow>(NO_OVERFLOW);
  const update = useCallback(() => {
    if (ref.current) setOverflow(measureOverflow(ref.current));
  }, [ref]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    return () => observer.disconnect();
  }, [ref, update]);

  return { overflow, update };
}

function useWheelToHorizontal(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const { left, right } = measureOverflow(element);
      if (event.deltaY > 0 ? !right : !left) return;
      event.preventDefault();
      element.scrollLeft += event.deltaY;
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [ref]);
}

type DragState = { pointerId: number; startX: number; startScrollLeft: number; moved: boolean };

function useDragToScroll(ref: RefObject<HTMLDivElement | null>) {
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element || event.pointerType !== "mouse" || event.button !== 0) return;
    if (element.scrollWidth <= element.clientWidth) return;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startScrollLeft: element.scrollLeft, moved: false };
  }, [ref]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    const state = drag.current;
    if (!element || !state || state.pointerId !== event.pointerId) return;
    const distance = event.clientX - state.startX;
    if (!state.moved && Math.abs(distance) < DRAG_THRESHOLD_PX) return;
    if (!state.moved) {
      state.moved = true;
      element.setPointerCapture(event.pointerId);
    }
    element.scrollLeft = state.startScrollLeft - distance;
  }, [ref]);

  const endDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    suppressClick.current = state.moved;
    drag.current = null;
    if (state.moved && ref.current?.hasPointerCapture(event.pointerId)) ref.current.releasePointerCapture(event.pointerId);
  }, [ref]);

  const onClickCapture = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onClickCapture };
}

export type SuggestionsProps = ComponentProps<"div">;

/** A single row of suggestion chips: vertical wheel and mouse drag scroll it sideways, faded edges show there is more. */
export const Suggestions = ({ className, children, style, ...props }: SuggestionsProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { overflow, update } = useOverflow(ref);
  useWheelToHorizontal(ref);
  const dragHandlers = useDragToScroll(ref);
  const scrollable = overflow.left || overflow.right;

  return (
    <div
      ref={ref}
      className={cn(
        "flex w-full flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        scrollable && "cursor-grab select-none active:cursor-grabbing",
        className,
      )}
      style={{ ...style, maskImage: fadeMask(overflow), WebkitMaskImage: fadeMask(overflow) }}
      onScroll={update}
      {...dragHandlers}
      {...props}
    >
      {children}
    </div>
  );
};

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = "outline",
  size = "sm",
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = useCallback(() => {
    onClick?.(suggestion);
  }, [onClick, suggestion]);

  return (
    <Button
      className={cn("shrink-0 cursor-pointer rounded-full px-4", className)}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};
