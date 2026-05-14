import { addDays, differenceInMinutes, startOfDay } from "date-fns"

import type { EventRow } from "@/db/schema"
import { SLOT_HEIGHT_PX } from "./constants"
import { layoutOverlaps, type OverlapPosition } from "./overlap"

export type PositionedEvent = {
  event: EventRow
  topPx: number
  heightPx: number
  layout: OverlapPosition
}

export function minutesToPx(minutes: number): number {
  return (minutes / 15) * SLOT_HEIGHT_PX
}

export function buildDayLayout(dayStart: Date, dayEnd: Date, all: EventRow[]): PositionedEvent[] {
  const dayStartMs = dayStart.getTime()
  const dayEndMs = dayEnd.getTime()
  const visible = all.filter((e) => !e.allDay && e.endAt > dayStartMs && e.startAt < dayEndMs)
  if (visible.length === 0) return []
  const positions = layoutOverlaps(
    visible.map((e) => ({
      id: e.id,
      startAt: Math.max(e.startAt, dayStartMs),
      endAt: Math.min(e.endAt, dayEndMs),
    })),
  )
  return visible.map((event) => {
    const clippedStart = Math.max(event.startAt, dayStartMs)
    const clippedEnd = Math.min(event.endAt, dayEndMs)
    const topMin = differenceInMinutes(new Date(clippedStart), dayStart)
    const durationMin = Math.max(
      15,
      differenceInMinutes(new Date(clippedEnd), new Date(clippedStart)),
    )
    return {
      event,
      topPx: minutesToPx(topMin),
      heightPx: minutesToPx(durationMin),
      // layoutOverlaps always emits a position for every input id, so the lookup never misses.
      layout: positions.get(event.id) as OverlapPosition,
    }
  })
}

export function allDayEventsForDay(day: Date, all: EventRow[]): EventRow[] {
  const dayStart = startOfDay(day).getTime()
  const dayEnd = addDays(startOfDay(day), 1).getTime()
  return all.filter((e) => e.allDay && e.endAt > dayStart && e.startAt < dayEnd)
}
