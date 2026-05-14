import type { EventRow, NewEvent } from "@/db/schema"
import type { EventFormValues } from "./schema"
import { formValuesToTimeRange } from "./transforms"

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
