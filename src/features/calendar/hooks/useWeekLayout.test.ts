import { describe, expect, it } from "vitest"
import { renderHook } from "@testing-library/react"

import type { EventRow } from "@/db/schema"
import { useWeekLayout } from "./useWeekLayout"

const anchor = new Date(2026, 4, 14) // Thursday May 14

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

describe("useWeekLayout", () => {
  it("returns 7 days starting from Monday", () => {
    const { result } = renderHook(() => useWeekLayout(anchor, [], null))
    expect(result.current.dayLayouts).toHaveLength(7)
    expect(result.current.dayLayouts[0].day.getDay()).toBe(1)
    expect(result.current.weekStart.getDay()).toBe(1)
  })

  it("places a timed event in the matching day", () => {
    const monday = new Date(2026, 4, 11, 9, 0).getTime()
    const events = [makeEvent({ id: "e1", startAt: monday, endAt: monday + 60 * 60_000 })]
    const { result } = renderHook(() => useWeekLayout(anchor, events, null))
    const mondayLayout = result.current.dayLayouts[0]
    expect(mondayLayout.positioned).toHaveLength(1)
    expect(mondayLayout.positioned[0].event.id).toBe("e1")
  })

  it("applies a resize preview override only to the targeted event", () => {
    const monday = new Date(2026, 4, 11, 9, 0).getTime()
    const events = [
      makeEvent({ id: "a", startAt: monday, endAt: monday + 60 * 60_000 }),
      makeEvent({ id: "b", startAt: monday + 2 * 3600_000, endAt: monday + 3 * 3600_000 }),
    ]
    const preview = {
      eventId: "a",
      startAt: monday,
      endAt: monday + 120 * 60_000,
    }
    const { result } = renderHook(() => useWeekLayout(anchor, events, preview))
    const mondayLayout = result.current.dayLayouts[0]
    const aEntry = mondayLayout.positioned.find((p) => p.event.id === "a")
    expect(aEntry?.event.endAt).toBe(monday + 120 * 60_000)
    const bEntry = mondayLayout.positioned.find((p) => p.event.id === "b")
    expect(bEntry?.event.startAt).toBe(monday + 2 * 3600_000)
  })

  it("separates all-day events into a dedicated bucket", () => {
    const monday = new Date(2026, 4, 11, 0, 0).getTime()
    const events = [
      makeEvent({ id: "ad", allDay: 1, startAt: monday, endAt: monday + 24 * 3600_000 }),
    ]
    const { result } = renderHook(() => useWeekLayout(anchor, events, null))
    expect(result.current.dayLayouts[0].allDay).toHaveLength(1)
    expect(result.current.dayLayouts[0].positioned).toHaveLength(0)
  })
})
