import { addDays, addMinutes, format, parse, startOfDay } from "date-fns"

import type { EventRow } from "@/db/schema"
import type { EventFormValues } from "./schema"

function combineDateTime(date: string, time: string): Date {
  return parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date())
}

export function eventToFormValues(event: EventRow): EventFormValues {
  const start = new Date(event.startAt)
  const isAllDay = event.allDay === 1
  return {
    title: event.title,
    description: event.description ?? "",
    date: format(start, "yyyy-MM-dd"),
    startTime: isAllDay ? "" : format(start, "HH:mm"),
    endTime: isAllDay ? "" : format(new Date(event.endAt), "HH:mm"),
    allDay: isAllDay,
    color: event.color ?? "",
  }
}

export function formValuesToTimeRange(values: EventFormValues): {
  startAt: number
  endAt: number
} {
  if (values.allDay) {
    const dayStart = startOfDay(parse(values.date, "yyyy-MM-dd", new Date()))
    return { startAt: dayStart.getTime(), endAt: addDays(dayStart, 1).getTime() }
  }
  // Non-allDay path: zod refinement guarantees both times are valid strings.
  const start = combineDateTime(values.date, values.startTime as string)
  const end = combineDateTime(values.date, values.endTime as string)
  return { startAt: start.getTime(), endAt: end.getTime() }
}

export function defaultFormValues(defaults?: {
  startAt?: number
  endAt?: number
  allDay?: boolean
}): EventFormValues {
  const now = new Date()
  const startSource = defaults?.startAt
    ? new Date(defaults.startAt)
    : addMinutes(now, 15 - (now.getMinutes() % 15 || 15))
  const endSource = defaults?.endAt ? new Date(defaults.endAt) : addMinutes(startSource, 30)
  const allDay = defaults?.allDay ?? false
  return {
    title: "",
    description: "",
    date: format(startSource, "yyyy-MM-dd"),
    startTime: allDay ? "" : format(startSource, "HH:mm"),
    endTime: allDay ? "" : format(endSource, "HH:mm"),
    allDay,
    color: "",
  }
}
