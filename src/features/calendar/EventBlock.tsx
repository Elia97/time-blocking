import { useMemo, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
import { useDraggable } from "@dnd-kit/core"

import type { EventRow } from "@/db/schema"
import { cn } from "@/lib/utils"
import { MIN_EVENT_HEIGHT_PX } from "./constants"

export type EventBlockProps = {
  event: EventRow
  topPx: number
  heightPx: number
  column: number
  totalColumns: number
  startLabel: string
  endLabel: string
  isResizing?: boolean
  onClick?: () => void
  onResizeStart?: (direction: "top" | "bottom", e: ReactPointerEvent) => void
}

export function EventBlock({
  event,
  topPx,
  heightPx,
  column,
  totalColumns,
  startLabel,
  endLabel,
  isResizing,
  onClick,
  onResizeStart,
}: EventBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `event-${event.id}`,
    data: { event },
    disabled: isResizing,
  })

  const style = useMemo<CSSProperties>(() => {
    const widthPct = 100 / totalColumns
    const leftPct = widthPct * column
    const base: CSSProperties = {
      top: `${topPx}px`,
      height: `${Math.max(MIN_EVENT_HEIGHT_PX, heightPx)}px`,
      left: `calc(${leftPct}% + 2px)`,
      width: `calc(${widthPct}% - 4px)`,
      borderLeftColor: event.color ?? undefined,
    }
    if (transform) {
      base.transform = `translate3d(${transform.x}px, ${transform.y}px, 0)`
      base.zIndex = 30
    }
    return base
  }, [topPx, heightPx, column, totalColumns, event.color, transform])

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) return
        e.stopPropagation()
        onClick?.()
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "border-primary/40 bg-primary/15 text-foreground absolute z-10 flex flex-col items-stretch gap-0.5",
        "cursor-grab overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-sm leading-snug",
        "hover:bg-primary/25 focus:ring-ring focus:ring-2 focus:outline-none",
        isDragging && "cursor-grabbing opacity-70 shadow-lg",
      )}
      data-event-block
      data-event-id={event.id}
      data-column={column}
      data-total-columns={totalColumns}
    >
      <ResizeHandle direction="top" onPointerDown={onResizeStart} />
      <span className="truncate font-medium">{event.title}</span>
      <span className="text-muted-foreground truncate text-xs">
        {startLabel}–{endLabel}
      </span>
      <ResizeHandle direction="bottom" onPointerDown={onResizeStart} />
    </div>
  )
}

function ResizeHandle({
  direction,
  onPointerDown,
}: {
  direction: "top" | "bottom"
  onPointerDown?: (direction: "top" | "bottom", e: ReactPointerEvent) => void
}) {
  return (
    <div
      data-resize-handle={direction}
      aria-label={`Resize ${direction}`}
      role="presentation"
      onPointerDown={(e) => {
        e.stopPropagation()
        onPointerDown?.(direction, e)
      }}
      className={cn(
        "absolute right-0 left-0 z-20 h-1.5 cursor-ns-resize",
        direction === "top" ? "top-0" : "bottom-0",
      )}
    />
  )
}
