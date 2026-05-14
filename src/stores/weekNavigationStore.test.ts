import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { startOfCalendarWeek } from "@/lib/date"
import { useWeekNavigation } from "./weekNavigationStore"

const FIXED_NOW = new Date(2026, 4, 14, 10, 30)

describe("weekNavigationStore", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    useWeekNavigation.setState({ anchorDate: startOfCalendarWeek(FIXED_NOW) })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("anchors on the Monday of the current week by default", () => {
    const { anchorDate } = useWeekNavigation.getState()
    expect(anchorDate.getDay()).toBe(1)
    expect(anchorDate.getDate()).toBe(11)
  })

  it("goToNextWeek shifts the anchor by 7 days forward", () => {
    useWeekNavigation.getState().goToNextWeek()
    expect(useWeekNavigation.getState().anchorDate.getDate()).toBe(18)
  })

  it("goToPrevWeek shifts the anchor by 7 days back", () => {
    useWeekNavigation.getState().goToPrevWeek()
    expect(useWeekNavigation.getState().anchorDate.getDate()).toBe(4)
  })

  it("goToToday snaps back to the Monday of the current real week", () => {
    useWeekNavigation.getState().goToNextWeek()
    useWeekNavigation.getState().goToNextWeek()
    useWeekNavigation.getState().goToToday()
    expect(useWeekNavigation.getState().anchorDate.getDate()).toBe(11)
  })

  it("setAnchorDate normalizes any date to its week-start Monday", () => {
    useWeekNavigation.getState().setAnchorDate(new Date(2026, 5, 4, 16, 0))
    const a = useWeekNavigation.getState().anchorDate
    expect(a.getDay()).toBe(1)
    expect(a.getDate()).toBe(1)
    expect(a.getMonth()).toBe(5)
  })
})
