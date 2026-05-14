import { describe, expect, it } from "vitest"

import type { EventRow } from "@/db/schema"
import { defaultFormValues, eventToFormValues, formValuesToTimeRange } from "./transforms"

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

describe("eventToFormValues", () => {
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
