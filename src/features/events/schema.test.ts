import { describe, expect, it } from "vitest"

import { eventFormSchema } from "./schema"

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
