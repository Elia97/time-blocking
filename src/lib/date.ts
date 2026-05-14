import {
  addDays,
  addWeeks,
  differenceInMinutes,
  endOfWeek,
  format,
  isSameMonth,
  isSameYear,
  startOfDay,
  startOfWeek,
} from "date-fns"

const WEEK_STARTS_ON = 1 as const
const SLOT_MINUTES = 15
export const SLOTS_PER_DAY = (24 * 60) / SLOT_MINUTES

export function startOfCalendarWeek(anchor: Date): Date {
  return startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON })
}

export function endOfCalendarWeek(anchor: Date): Date {
  return endOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON })
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfCalendarWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function slotIndex(date: Date): number {
  const minutes = differenceInMinutes(date, startOfDay(date))
  const index = Math.floor(minutes / SLOT_MINUTES)
  return Math.max(0, Math.min(SLOTS_PER_DAY - 1, index))
}

export function formatHourLabel(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`
}

export function formatWeekRange(anchor: Date): string {
  const start = startOfCalendarWeek(anchor)
  const end = endOfCalendarWeek(anchor)
  if (isSameMonth(start, end)) {
    return `${format(start, "d")}-${format(end, "d MMM yyyy")}`
  }
  if (isSameYear(start, end)) {
    return `${format(start, "d MMM")} - ${format(end, "d MMM yyyy")}`
  }
  return `${format(start, "d MMM yyyy")} - ${format(end, "d MMM yyyy")}`
}

export function shiftWeek(anchor: Date, weeks: number): Date {
  return addWeeks(anchor, weeks)
}
