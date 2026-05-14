import { describe, expect, it } from "vitest"

import {
  endOfCalendarWeek,
  formatHourLabel,
  formatWeekRange,
  getWeekDays,
  shiftWeek,
  SLOTS_PER_DAY,
  slotIndex,
  startOfCalendarWeek,
} from "./date"

describe("startOfCalendarWeek", () => {
  it("anchors to Monday", () => {
    // 2026-05-14 is a Thursday
    const monday = startOfCalendarWeek(new Date(2026, 4, 14, 10, 30))
    expect(monday.getDay()).toBe(1)
    expect(monday.getHours()).toBe(0)
    expect(monday.getDate()).toBe(11)
  })

  it("keeps Monday as Monday", () => {
    const input = new Date(2026, 4, 11, 9, 0)
    const result = startOfCalendarWeek(input)
    expect(result.getDate()).toBe(11)
  })

  it("wraps Sunday back to the previous Monday", () => {
    // Sunday 2026-05-17
    const result = startOfCalendarWeek(new Date(2026, 4, 17, 23, 59))
    expect(result.getDate()).toBe(11)
    expect(result.getDay()).toBe(1)
  })
})

describe("getWeekDays", () => {
  it("returns 7 days starting from Monday", () => {
    const days = getWeekDays(new Date(2026, 4, 14))
    expect(days).toHaveLength(7)
    expect(days[0].getDay()).toBe(1)
    expect(days[6].getDay()).toBe(0)
    expect(days[6].getDate()).toBe(17)
  })
})

describe("endOfCalendarWeek", () => {
  it("ends on Sunday 23:59:59", () => {
    const end = endOfCalendarWeek(new Date(2026, 4, 14))
    expect(end.getDay()).toBe(0)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
  })
})

describe("slotIndex", () => {
  it("returns 0 at midnight", () => {
    expect(slotIndex(new Date(2026, 4, 14, 0, 0))).toBe(0)
  })

  it("returns 1 at 00:15", () => {
    expect(slotIndex(new Date(2026, 4, 14, 0, 15))).toBe(1)
  })

  it("returns 40 at 10:00", () => {
    expect(slotIndex(new Date(2026, 4, 14, 10, 0))).toBe(40)
  })

  it("clamps to last slot at 23:59", () => {
    expect(slotIndex(new Date(2026, 4, 14, 23, 59))).toBe(SLOTS_PER_DAY - 1)
  })

  it("floors sub-slot minutes down", () => {
    expect(slotIndex(new Date(2026, 4, 14, 9, 7))).toBe(36)
  })
})

describe("formatHourLabel", () => {
  it("pads single digit hours", () => {
    expect(formatHourLabel(0)).toBe("00:00")
    expect(formatHourLabel(9)).toBe("09:00")
    expect(formatHourLabel(23)).toBe("23:00")
  })
})

describe("formatWeekRange", () => {
  it("formats a range within a single month", () => {
    expect(formatWeekRange(new Date(2026, 4, 14))).toMatch(/11.*17.*May.*2026/)
  })

  it("formats a range spanning two months", () => {
    // Week of 2026-04-27 → 2026-05-03
    const label = formatWeekRange(new Date(2026, 3, 30))
    expect(label).toMatch(/Apr/)
    expect(label).toMatch(/May/)
  })

  it("formats a range spanning two years", () => {
    // Week of 2026-12-28 → 2027-01-03
    const label = formatWeekRange(new Date(2026, 11, 30))
    expect(label).toMatch(/2026/)
    expect(label).toMatch(/2027/)
  })
})

describe("shiftWeek", () => {
  it("shifts forward by weeks", () => {
    const next = shiftWeek(new Date(2026, 4, 14), 1)
    expect(next.getDate()).toBe(21)
  })

  it("shifts backward by weeks", () => {
    const prev = shiftWeek(new Date(2026, 4, 14), -2)
    expect(prev.getDate()).toBe(30)
    expect(prev.getMonth()).toBe(3)
  })
})
