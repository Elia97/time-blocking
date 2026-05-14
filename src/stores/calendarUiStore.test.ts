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
})
