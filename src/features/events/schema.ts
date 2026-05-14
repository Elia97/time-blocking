import { addDays, addMinutes, format, parse, startOfDay } from "date-fns"
import { z } from "zod"

import type { EventRow, NewEvent } from "@/db/schema"

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const colorRegex = /^#[0-9a-fA-F]{6}$/

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
    description: z.string().max(5000).optional(),
    date: z.string().regex(dateRegex, "Invalid date"),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    allDay: z.boolean(),
    color: z.string().regex(colorRegex, "Use a #RRGGBB hex color").optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    if (values.allDay) return
    if (!values.startTime || !timeRegex.test(values.startTime)) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Start time is required",
      })
    }
    if (!values.endTime || !timeRegex.test(values.endTime)) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time is required",
      })
    }
    if (
      values.startTime &&
      values.endTime &&
      timeRegex.test(values.startTime) &&
      timeRegex.test(values.endTime) &&
      values.endTime <= values.startTime
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End must be after start",
      })
    }
  })

export type EventFormValues = z.infer<typeof eventFormSchema>

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

function combineDateTime(date: string, time: string): Date {
  return parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date())
}

export function formValuesToTimeRange(values: EventFormValues): {
  startAt: number
  endAt: number
} {
  if (values.allDay) {
    const dayStart = startOfDay(parse(values.date, "yyyy-MM-dd", new Date()))
    return { startAt: dayStart.getTime(), endAt: addDays(dayStart, 1).getTime() }
  }
  const start = combineDateTime(values.date, values.startTime ?? "00:00")
  const end = combineDateTime(values.date, values.endTime ?? "00:00")
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

export function newEventFromForm(values: EventFormValues, nowMs: number = Date.now()): NewEvent {
  const { startAt, endAt } = formValuesToTimeRange(values)
  return {
    id: crypto.randomUUID(),
    title: values.title.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    startAt,
    endAt,
    allDay: values.allDay ? 1 : 0,
    categoryId: null,
    color: values.color ? values.color : null,
    notes: null,
    googleId: null,
    googleEtag: null,
    rrule: null,
    parentId: null,
    dirty: 1,
    deletedAt: null,
    createdAt: nowMs,
    updatedAt: nowMs,
  }
}

export function eventUpdateFromForm(
  values: EventFormValues,
  nowMs: number = Date.now(),
): Partial<EventRow> {
  const { startAt, endAt } = formValuesToTimeRange(values)
  return {
    title: values.title.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    startAt,
    endAt,
    allDay: values.allDay ? 1 : 0,
    color: values.color ? values.color : null,
    dirty: 1,
    updatedAt: nowMs,
  }
}
