import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { screen, within } from "@testing-library/react"

import { renderWithQueryClient } from "@/test/render"
import { useCalendarUiStore } from "@/stores/calendarUiStore"
import { startOfCalendarWeek } from "@/lib/date"
import type { EventRow } from "@/db/schema"
import * as useEventsModule from "./useEvents"
import { WeekView } from "./WeekView"

const FIXED_NOW = new Date(2026, 4, 14, 10, 0) // Thursday May 14 2026, 10:00

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

function mockEvents(rows: EventRow[]) {
  vi.spyOn(useEventsModule, "useEvents").mockReturnValue({
    data: rows,
    isLoading: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useEventsModule.useEvents>)
}

describe("WeekView", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    useCalendarUiStore.setState({ anchorDate: startOfCalendarWeek(FIXED_NOW) })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("renders 7 day columns and 23 hour labels", () => {
    mockEvents([])
    renderWithQueryClient(<WeekView />)
    expect(screen.getAllByTestId("day-column")).toHaveLength(7)
    // 23 because 00:00 is omitted (visual choice)
    expect(screen.getByText("01:00")).toBeInTheDocument()
    expect(screen.getByText("23:00")).toBeInTheDocument()
  })

  it("renders an event in the matching day column", () => {
    const monday = new Date(2026, 4, 11, 9, 0).getTime()
    mockEvents([
      makeEvent({ id: "e1", title: "Standup", startAt: monday, endAt: monday + 30 * 60_000 }),
    ])

    renderWithQueryClient(<WeekView />)
    const block = screen.getByText("Standup").closest("[data-event-block]") as HTMLElement
    expect(block).toBeTruthy()
    expect(block.getAttribute("data-total-columns")).toBe("1")
  })

  it("splits two overlapping events into two columns", () => {
    const monday9 = new Date(2026, 4, 11, 9, 0).getTime()
    const monday930 = new Date(2026, 4, 11, 9, 30).getTime()
    mockEvents([
      makeEvent({ id: "a", title: "A", startAt: monday9, endAt: monday9 + 60 * 60_000 }),
      makeEvent({ id: "b", title: "B", startAt: monday930, endAt: monday930 + 60 * 60_000 }),
    ])

    renderWithQueryClient(<WeekView />)
    const a = screen.getByText("A").closest("[data-event-block]") as HTMLElement
    const b = screen.getByText("B").closest("[data-event-block]") as HTMLElement
    expect(a.getAttribute("data-total-columns")).toBe("2")
    expect(b.getAttribute("data-total-columns")).toBe("2")
    expect(a.getAttribute("data-column")).not.toBe(b.getAttribute("data-column"))
  })

  it("skips all-day events", () => {
    const monday = new Date(2026, 4, 11, 0, 0).getTime()
    mockEvents([
      makeEvent({
        id: "a",
        title: "All Day Thing",
        allDay: 1,
        startAt: monday,
        endAt: monday + 24 * 3600_000,
      }),
    ])

    renderWithQueryClient(<WeekView />)
    expect(screen.queryByText("All Day Thing")).not.toBeInTheDocument()
  })

  it("renders a current-time indicator on today's column only", () => {
    mockEvents([])
    renderWithQueryClient(<WeekView />)
    const indicators = screen.getAllByTestId("current-time-indicator")
    expect(indicators).toHaveLength(1)
    const todayCol = screen
      .getAllByTestId("day-column")
      .find((col) => col.dataset.day === "2026-05-14")
    expect(todayCol).toBeTruthy()
    expect(within(todayCol!).getByTestId("current-time-indicator")).toBeInTheDocument()
  })
})
