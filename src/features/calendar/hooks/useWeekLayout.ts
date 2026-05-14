import { useMemo } from "react"
import { addDays, startOfDay } from "date-fns"

import type { EventRow } from "@/db/schema"
import { endOfCalendarWeek, getWeekDays, startOfCalendarWeek } from "@/lib/date"
import { allDayEventsForDay, buildDayLayout, type PositionedEvent } from "../layout"

type DayLayout = {
  day: Date
  dayStart: Date
  positioned: PositionedEvent[]
  allDay: EventRow[]
}

export type ResizePreview = {
  eventId: string
  startAt: number
  endAt: number
} | null

export type WeekLayout = {
  weekStart: Date
  weekEnd: Date
  weekDays: Date[]
  dayLayouts: DayLayout[]
}

export function useWeekLayout(
  anchorDate: Date,
  events: EventRow[],
  resizePreview: ResizePreview,
): WeekLayout {
  const { weekStart, weekEnd, weekDays } = useMemo(() => {
    const start = startOfCalendarWeek(anchorDate)
    const end = endOfCalendarWeek(anchorDate)
    return { weekStart: start, weekEnd: end, weekDays: getWeekDays(anchorDate) }
  }, [anchorDate])

  const displayedEvents = useMemo(() => {
    if (!resizePreview) return events
    return events.map((e) =>
      e.id === resizePreview.eventId
        ? { ...e, startAt: resizePreview.startAt, endAt: resizePreview.endAt }
        : e,
    )
  }, [events, resizePreview])

  const dayLayouts = useMemo<DayLayout[]>(
    () =>
      weekDays.map((day) => {
        const dayStart = startOfDay(day)
        const dayEnd = addDays(dayStart, 1)
        return {
          day,
          dayStart,
          positioned: buildDayLayout(dayStart, dayEnd, displayedEvents),
          allDay: allDayEventsForDay(day, displayedEvents),
        }
      }),
    [weekDays, displayedEvents],
  )

  return { weekStart, weekEnd, weekDays, dayLayouts }
}
