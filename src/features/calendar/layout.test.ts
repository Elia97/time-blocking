import { describe, expect, it } from "vitest"

import type { EventRow } from "@/db/schema"
import { allDayEventsForDay, buildDayLayout, minutesToPx } from "./layout"
import { SLOT_HEIGHT_PX } from "./constants"

const monday = new Date(2026, 4, 11)
const tuesday = new Date(2026, 4, 12)
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const dayEnd = (d: Date) => {
  const start = dayStart(d)
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
}

function makeEvent(overrides: Partial<EventRow>): EventRow {
  return {
    id: "x",
    title: "Event",
    description: null,
    startAt: 0,
    endAt: 0,
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
    ...overrides,
  }
}

describe("minutesToPx", () => {
  it("returns 0 for 0 minutes", () => {
    expect(minutesToPx(0)).toBe(0)
  })

  it("returns one slot per 15 minutes", () => {
    expect(minutesToPx(15)).toBe(SLOT_HEIGHT_PX)
    expect(minutesToPx(60)).toBe(SLOT_HEIGHT_PX * 4)
  })
})

describe("buildDayLayout", () => {
  it("returns an empty array when there are no events", () => {
    expect(buildDayLayout(dayStart(monday), dayEnd(monday), [])).toEqual([])
  })

  it("filters out all-day events", () => {
    const out = buildDayLayout(dayStart(monday), dayEnd(monday), [
      makeEvent({
        id: "ad",
        allDay: 1,
        startAt: dayStart(monday).getTime(),
        endAt: dayEnd(monday).getTime(),
      }),
    ])
    expect(out).toEqual([])
  })

  it("filters out events outside the day window", () => {
    const out = buildDayLayout(dayStart(monday), dayEnd(monday), [
      makeEvent({
        id: "other",
        startAt: dayStart(tuesday).getTime(),
        endAt: dayEnd(tuesday).getTime(),
      }),
    ])
    expect(out).toEqual([])
  })

  it("clips an event that starts before the day", () => {
    const start = new Date(2026, 4, 10, 23, 0).getTime() // Sunday 23:00
    const end = new Date(2026, 4, 11, 1, 0).getTime() // Monday 01:00
    const out = buildDayLayout(dayStart(monday), dayEnd(monday), [
      makeEvent({ id: "spans", startAt: start, endAt: end }),
    ])
    expect(out).toHaveLength(1)
    expect(out[0].topPx).toBe(0)
    expect(out[0].heightPx).toBe(minutesToPx(60))
  })

  it("enforces a 15-minute minimum height for shorter events", () => {
    const start = new Date(2026, 4, 11, 9, 0).getTime()
    const end = new Date(2026, 4, 11, 9, 5).getTime() // 5-minute event
    const out = buildDayLayout(dayStart(monday), dayEnd(monday), [
      makeEvent({ id: "tiny", startAt: start, endAt: end }),
    ])
    expect(out[0].heightPx).toBe(minutesToPx(15))
  })

  it("positions a regular event at the correct offset", () => {
    const start = new Date(2026, 4, 11, 9, 30).getTime()
    const end = new Date(2026, 4, 11, 10, 0).getTime()
    const out = buildDayLayout(dayStart(monday), dayEnd(monday), [
      makeEvent({ id: "a", startAt: start, endAt: end }),
    ])
    expect(out[0].topPx).toBe(minutesToPx(9 * 60 + 30))
    expect(out[0].heightPx).toBe(minutesToPx(30))
    expect(out[0].layout).toEqual({ column: 0, totalColumns: 1 })
  })
})

describe("allDayEventsForDay", () => {
  it("keeps only all-day events that intersect the day", () => {
    const events = [
      makeEvent({
        id: "ad",
        allDay: 1,
        startAt: dayStart(monday).getTime(),
        endAt: dayEnd(monday).getTime(),
      }),
      makeEvent({
        id: "timed",
        startAt: new Date(2026, 4, 11, 10, 0).getTime(),
        endAt: new Date(2026, 4, 11, 11, 0).getTime(),
      }),
    ]
    const out = allDayEventsForDay(monday, events)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe("ad")
  })
})
