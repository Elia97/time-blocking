import { describe, expect, it } from "vitest"

import type { EventRow } from "@/db/schema"
import {
  defaultFormValues,
  eventFormSchema,
  eventToFormValues,
  eventUpdateFromForm,
  formValuesToTimeRange,
  newEventFromForm,
} from "./schema"

const baseRow: EventRow = {
  id: "x",
  title: "Stub",
  description: null,
  startAt: new Date(2026, 4, 14, 9, 30).getTime(),
  endAt: new Date(2026, 4, 14, 10, 0).getTime(),
  allDay: 0,
  categoryId: null,
  color: null,
  notes: null,
  googleId: null,
  googleEtag: null,
  rrule: null,
  parentId: null,
  dirty: 0,
  deletedAt: null,
  createdAt: 0,
  updatedAt: 0,
}

describe("eventFormSchema", () => {
  it("rejects an empty title", () => {
    const result = eventFormSchema.safeParse({
      title: "",
      date: "2026-05-14",
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
    })
    expect(result.success).toBe(false)
  })

  it("requires time fields when not all-day", () => {
    const result = eventFormSchema.safeParse({
      title: "Foo",
      date: "2026-05-14",
      allDay: false,
    })
    expect(result.success).toBe(false)
  })

  it("rejects end time ≤ start time", () => {
    const result = eventFormSchema.safeParse({
      title: "Foo",
      date: "2026-05-14",
      startTime: "10:00",
      endTime: "09:00",
      allDay: false,
    })
    expect(result.success).toBe(false)
  })

  it("accepts an all-day event without times", () => {
    const result = eventFormSchema.safeParse({
      title: "Holiday",
      date: "2026-05-14",
      allDay: true,
    })
    expect(result.success).toBe(true)
  })

  it("accepts a valid timed event", () => {
    const result = eventFormSchema.safeParse({
      title: "Standup",
      date: "2026-05-14",
      startTime: "09:00",
      endTime: "09:30",
      allDay: false,
    })
    expect(result.success).toBe(true)
  })

  it("rejects malformed color", () => {
    const result = eventFormSchema.safeParse({
      title: "Foo",
      date: "2026-05-14",
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      color: "blue",
    })
    expect(result.success).toBe(false)
  })
})

describe("eventToFormValues / newEventFromForm round trip", () => {
  it("preserves timed event fields", () => {
    const form = eventToFormValues(baseRow)
    expect(form.date).toBe("2026-05-14")
    expect(form.startTime).toBe("09:30")
    expect(form.endTime).toBe("10:00")
    expect(form.allDay).toBe(false)
  })

  it("maps all-day rows to empty time fields", () => {
    const allDayRow: EventRow = {
      ...baseRow,
      allDay: 1,
      startAt: new Date(2026, 4, 14, 0, 0).getTime(),
      endAt: new Date(2026, 4, 15, 0, 0).getTime(),
    }
    const form = eventToFormValues(allDayRow)
    expect(form.allDay).toBe(true)
    expect(form.startTime).toBe("")
    expect(form.endTime).toBe("")
  })
})

describe("formValuesToTimeRange", () => {
  it("computes a 30-minute timed range", () => {
    const range = formValuesToTimeRange({
      title: "x",
      date: "2026-05-14",
      startTime: "09:00",
      endTime: "09:30",
      allDay: false,
    })
    expect(range.endAt - range.startAt).toBe(30 * 60_000)
  })

  it("spans one full day for all-day events", () => {
    const range = formValuesToTimeRange({
      title: "x",
      date: "2026-05-14",
      allDay: true,
    })
    expect(range.endAt - range.startAt).toBe(24 * 60 * 60_000)
  })
})

describe("newEventFromForm", () => {
  it("seeds id, dirty flag, and timestamps", () => {
    const row = newEventFromForm(
      {
        title: "  Trim me  ",
        description: " note ",
        date: "2026-05-14",
        startTime: "09:00",
        endTime: "10:00",
        allDay: false,
      },
      1000,
    )
    expect(row.id).toMatch(/^[\w-]+$/)
    expect(row.title).toBe("Trim me")
    expect(row.description).toBe("note")
    expect(row.dirty).toBe(1)
    expect(row.createdAt).toBe(1000)
    expect(row.updatedAt).toBe(1000)
  })

  it("normalizes empty description and color to null", () => {
    const row = newEventFromForm(
      {
        title: "x",
        description: "",
        date: "2026-05-14",
        startTime: "09:00",
        endTime: "10:00",
        allDay: false,
        color: "",
      },
      0,
    )
    expect(row.description).toBeNull()
    expect(row.color).toBeNull()
  })
})

describe("eventUpdateFromForm", () => {
  it("flips dirty and updates timestamps", () => {
    const patch = eventUpdateFromForm(
      {
        title: "Foo",
        date: "2026-05-14",
        startTime: "09:00",
        endTime: "10:00",
        allDay: false,
      },
      2000,
    )
    expect(patch.dirty).toBe(1)
    expect(patch.updatedAt).toBe(2000)
    expect(patch.title).toBe("Foo")
  })
})

describe("defaultFormValues", () => {
  it("respects explicit start/end defaults", () => {
    const start = new Date(2026, 4, 14, 10, 0).getTime()
    const end = new Date(2026, 4, 14, 11, 0).getTime()
    const v = defaultFormValues({ startAt: start, endAt: end })
    expect(v.date).toBe("2026-05-14")
    expect(v.startTime).toBe("10:00")
    expect(v.endTime).toBe("11:00")
    expect(v.allDay).toBe(false)
  })

  it("produces blank times when allDay default is true", () => {
    const v = defaultFormValues({
      startAt: new Date(2026, 4, 14, 0, 0).getTime(),
      allDay: true,
    })
    expect(v.allDay).toBe(true)
    expect(v.startTime).toBe("")
    expect(v.endTime).toBe("")
  })
})
