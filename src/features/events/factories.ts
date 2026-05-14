import type { EventRow, NewEvent } from "@/db/schema"
import type { EventFormValues } from "./schema"
import { formValuesToTimeRange } from "./transforms"

function normalizeOptional(value: string | undefined): string | null {
  if (value === undefined) return null
  const trimmed = value.trim()
  if (trimmed === "") return null
  return trimmed
}

function resolveNow(nowMs: number | undefined): number {
  if (nowMs !== undefined) return nowMs
  return Date.now()
}

export function newEventFromForm(values: EventFormValues, nowMs?: number): NewEvent {
  const { startAt, endAt } = formValuesToTimeRange(values)
  const timestamp = resolveNow(nowMs)
  return {
    id: crypto.randomUUID(),
    title: values.title.trim(),
    description: normalizeOptional(values.description),
    startAt,
    endAt,
    allDay: values.allDay ? 1 : 0,
    categoryId: null,
    color: normalizeOptional(values.color),
    notes: null,
    googleId: null,
    googleEtag: null,
    rrule: null,
    parentId: null,
    dirty: 1,
    deletedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function eventUpdateFromForm(values: EventFormValues, nowMs?: number): Partial<EventRow> {
  const { startAt, endAt } = formValuesToTimeRange(values)
  const timestamp = resolveNow(nowMs)
  return {
    title: values.title.trim(),
    description: normalizeOptional(values.description),
    startAt,
    endAt,
    allDay: values.allDay ? 1 : 0,
    color: normalizeOptional(values.color),
    dirty: 1,
    updatedAt: timestamp,
  }
}
