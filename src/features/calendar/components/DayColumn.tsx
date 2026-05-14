import { differenceInMinutes, format, isSameDay } from "date-fns"
import { useDroppable } from "@dnd-kit/core"
import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react"

import type { EventRow } from "@/db/schema"
import { cn } from "@/lib/utils"
import { HOURS_PER_DAY, HOUR_HEIGHT_PX, SLOT_HEIGHT_PX } from "../constants"
import { EventBlock } from "../EventBlock"
import { minutesToPx, type PositionedEvent } from "../layout"

export type DayColumnProps = {
  day: Date
  dayStart: Date
  positioned: PositionedEvent[]
  now: Date
  resizingEventId: string | null
  onSlotClick: (startAt: number, endAt: number) => void
  onEventClick: (event: EventRow) => void
  onResizeStart: (event: EventRow, direction: "top" | "bottom", e: ReactPointerEvent) => void
}

export function DayColumn({
  day,
  dayStart,
  positioned,
  now,
  resizingEventId,
  onSlotClick,
  onEventClick,
  onResizeStart,
}: DayColumnProps) {
  const isToday = isSameDay(day, now)
  const nowOffsetPx = isToday ? minutesToPx(differenceInMinutes(now, dayStart)) : null

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${format(day, "yyyy-MM-dd")}`,
    data: { dayStart: dayStart.getTime() },
  })

  const handleSlotClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-event-block]")) return
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const minutesFromMidnight = (offsetY / SLOT_HEIGHT_PX) * 15
    const snapped = Math.max(0, Math.min(24 * 60 - 30, Math.floor(minutesFromMidnight / 15) * 15))
    const startAt = dayStart.getTime() + snapped * 60_000
    const endAt = startAt + 30 * 60_000
    onSlotClick(startAt, endAt)
  }

  return (
    // Click-to-create on the column body; nested events/indicators are real buttons.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      ref={setNodeRef}
      className={cn(
        "border-border relative border-l",
        isToday && "bg-primary/4",
        isOver && "bg-accent/20",
      )}
      data-day={format(day, "yyyy-MM-dd")}
      data-testid="day-column"
      onClick={handleSlotClick}
    >
      {Array.from({ length: HOURS_PER_DAY * 2 }, (_, i) => {
        const isHour = i % 2 === 0
        return (
          <div
            key={i}
            className={cn(
              "absolute right-0 left-0 border-t",
              isHour ? "border-border/60" : "border-border/25 border-dashed",
            )}
            style={{ top: `${(i * HOUR_HEIGHT_PX) / 2}px` }}
            aria-hidden
          />
        )
      })}
      {positioned.map(({ event, topPx, heightPx, layout }) => (
        <EventBlock
          key={event.id}
          event={event}
          topPx={topPx}
          heightPx={heightPx}
          column={layout.column}
          totalColumns={layout.totalColumns}
          startLabel={format(new Date(event.startAt), "HH:mm")}
          endLabel={format(new Date(event.endAt), "HH:mm")}
          isResizing={resizingEventId === event.id}
          onClick={() => onEventClick(event)}
          onResizeStart={(direction, e) => onResizeStart(event, direction, e)}
        />
      ))}
      {nowOffsetPx !== null && (
        <div
          data-testid="current-time-indicator"
          className="bg-destructive pointer-events-none absolute right-0 left-0 z-20 h-px"
          style={{ top: `${nowOffsetPx}px` }}
        >
          <div className="bg-destructive absolute -top-1 -left-1 size-2 rounded-full" />
        </div>
      )}
    </div>
  )
}
