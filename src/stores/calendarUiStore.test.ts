import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { startOfCalendarWeek } from "@/lib/date"
import { useCalendarUiStore } from "./calendarUiStore"

const FIXED_NOW = new Date(2026, 4, 14, 10, 30) // Thursday

function resetStore() {
  useCalendarUiStore.setState({ anchorDate: startOfCalendarWeek(FIXED_NOW) })
}

describe("calendarUiStore", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    resetStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("anchors on the Monday of the current week by default", () => {
    const { anchorDate } = useCalendarUiStore.getState()
    expect(anchorDate.getDay()).toBe(1)
    expect(anchorDate.getDate()).toBe(11)
  })

  it("goToNextWeek shifts the anchor by 7 days forward", () => {
    useCalendarUiStore.getState().goToNextWeek()
    expect(useCalendarUiStore.getState().anchorDate.getDate()).toBe(18)
  })

  it("goToPrevWeek shifts the anchor by 7 days back", () => {
    useCalendarUiStore.getState().goToPrevWeek()
    expect(useCalendarUiStore.getState().anchorDate.getDate()).toBe(4)
  })

  it("goToToday snaps back to the Monday of the current real week", () => {
    useCalendarUiStore.getState().goToNextWeek()
    useCalendarUiStore.getState().goToNextWeek()
    useCalendarUiStore.getState().goToToday()
    expect(useCalendarUiStore.getState().anchorDate.getDate()).toBe(11)
  })

  it("setAnchorDate normalizes any date to its week-start Monday", () => {
    useCalendarUiStore.getState().setAnchorDate(new Date(2026, 5, 4, 16, 0)) // Thursday June 4
    const a = useCalendarUiStore.getState().anchorDate
    expect(a.getDay()).toBe(1)
    expect(a.getDate()).toBe(1)
    expect(a.getMonth()).toBe(5)
  })

  it("openCreateDialog stores defaults", () => {
    useCalendarUiStore.getState().openCreateDialog({ startAt: 1000, endAt: 2000 })
    expect(useCalendarUiStore.getState().dialogState).toEqual({
      mode: "create",
      defaults: { startAt: 1000, endAt: 2000 },
    })
  })

  it("openEditDialog stores the event", () => {
    const event = { id: "e1", title: "Foo" } as never
    useCalendarUiStore.getState().openEditDialog(event)
    expect(useCalendarUiStore.getState().dialogState).toEqual({ mode: "edit", event })
  })

  it("closeDialog resets to null", () => {
    useCalendarUiStore.getState().openCreateDialog({ startAt: 0, endAt: 0 })
    useCalendarUiStore.getState().closeDialog()
    expect(useCalendarUiStore.getState().dialogState).toBeNull()
  })
})
