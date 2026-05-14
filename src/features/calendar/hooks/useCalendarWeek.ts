import { useMemo } from "react"

import { endOfCalendarWeek, startOfCalendarWeek } from "@/lib/date"
import { useEvents } from "../useEvents"
import { useWeekLayout, type ResizePreview, type WeekLayout } from "./useWeekLayout"

export function useCalendarWeek(anchorDate: Date, resizePreview: ResizePreview): WeekLayout {
  const [weekStart, weekEnd] = useMemo(
    () => [startOfCalendarWeek(anchorDate), endOfCalendarWeek(anchorDate)],
    [anchorDate],
  )
  const { data: events = [] } = useEvents(weekStart, weekEnd)
  return useWeekLayout(anchorDate, events, resizePreview)
}
