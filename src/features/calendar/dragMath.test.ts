import { describe, expect, it } from "vitest"

import { SLOT_HEIGHT_PX } from "./constants"
import {
  applyDragEnd,
  computeMoveRange,
  computeResizeRange,
  dayShiftFrom,
  MIN_EVENT_MINUTES,
  pxToMinutes,
  snapMinutes,
  SNAP_MINUTES,
} from "./dragMath"

const ONE_HOUR_MS = 60 * 60_000

describe("pxToMinutes", () => {
  it("translates one slot height into 15 minutes", () => {
    expect(pxToMinutes(SLOT_HEIGHT_PX)).toBe(SNAP_MINUTES)
  })

  it("scales linearly with pixels", () => {
    expect(pxToMinutes(SLOT_HEIGHT_PX * 4)).toBe(60)
  })
})

describe("snapMinutes", () => {
  it("snaps to the closest 15-min step", () => {
    expect(snapMinutes(7)).toBe(0)
    expect(snapMinutes(8)).toBe(15)
    expect(snapMinutes(22)).toBe(15)
    expect(snapMinutes(23)).toBe(30)
  })
})

describe("computeMoveRange", () => {
  const base = {
    startAt: new Date(2026, 4, 14, 9, 0).getTime(),
    endAt: new Date(2026, 4, 14, 10, 0).getTime(),
  }

  it("returns the source range when delta is zero", () => {
    expect(computeMoveRange(base, 0, 0)).toEqual(base)
  })

  it("shifts both start and end by snapped minutes", () => {
    const next = computeMoveRange(base, SLOT_HEIGHT_PX * 2, 0) // +30 min
    expect(next.startAt - base.startAt).toBe(30 * 60_000)
    expect(next.endAt - base.endAt).toBe(30 * 60_000)
  })

  it("snaps sub-slot pixel deltas", () => {
    const next = computeMoveRange(base, 5, 0) // ~6.25 min → 0
    expect(next.startAt).toBe(base.startAt)
  })

  it("shifts by whole days when dayShift is non-zero", () => {
    const next = computeMoveRange(base, 0, 2)
    expect(next.startAt - base.startAt).toBe(2 * 24 * 60 * 60_000)
    expect(next.endAt - base.endAt).toBe(2 * 24 * 60 * 60_000)
  })

  it("preserves duration after a combined move", () => {
    const next = computeMoveRange(base, SLOT_HEIGHT_PX * 5, -1) // +1h15m, -1 day
    expect(next.endAt - next.startAt).toBe(base.endAt - base.startAt)
  })
})

describe("dayShiftFrom", () => {
  const monday = new Date(2026, 4, 11, 9, 30).getTime()
  const tuesdayDayStart = new Date(2026, 4, 12, 0, 0).getTime()
  const thursdayDayStart = new Date(2026, 4, 14, 0, 0).getTime()

  it("returns 0 when no target is provided", () => {
    expect(dayShiftFrom(monday, undefined)).toBe(0)
  })

  it("computes a positive day shift", () => {
    expect(dayShiftFrom(monday, thursdayDayStart)).toBe(3)
  })

  it("computes a +1 day shift", () => {
    expect(dayShiftFrom(monday, tuesdayDayStart)).toBe(1)
  })
})

describe("applyDragEnd", () => {
  const event = {
    id: "e1",
    startAt: new Date(2026, 4, 11, 9, 0).getTime(),
    endAt: new Date(2026, 4, 11, 10, 0).getTime(),
  }

  it("returns null when there is no real movement", () => {
    expect(applyDragEnd(event, 0, undefined)).toBeNull()
  })

  it("returns a patch when day shift moves the event", () => {
    const tuesdayDayStart = new Date(2026, 4, 12, 0, 0).getTime()
    const patch = applyDragEnd(event, 0, tuesdayDayStart)
    expect(patch).not.toBeNull()
    expect(new Date(patch!.startAt).getDate()).toBe(12)
    expect(patch!.endAt - patch!.startAt).toBe(event.endAt - event.startAt)
  })

  it("returns a patch when vertical delta crosses a snap boundary", () => {
    const patch = applyDragEnd(event, SLOT_HEIGHT_PX * 2, undefined)
    expect(patch).not.toBeNull()
    expect(patch!.startAt - event.startAt).toBe(30 * 60_000)
  })
})

describe("computeResizeRange (top)", () => {
  const base = {
    startAt: new Date(2026, 4, 14, 9, 0).getTime(),
    endAt: new Date(2026, 4, 14, 10, 0).getTime(),
  }

  it("shifts startAt by snapped minutes, keeps endAt", () => {
    const next = computeResizeRange(base, "top", -SLOT_HEIGHT_PX * 2) // earlier 30 min
    expect(next.endAt).toBe(base.endAt)
    expect(base.startAt - next.startAt).toBe(30 * 60_000)
  })

  it("clamps to min duration (start cannot pass end - 15 min)", () => {
    const next = computeResizeRange(base, "top", SLOT_HEIGHT_PX * 100)
    expect(next.endAt - next.startAt).toBe(MIN_EVENT_MINUTES * 60_000)
  })
})

describe("computeResizeRange (bottom)", () => {
  const base = {
    startAt: new Date(2026, 4, 14, 9, 0).getTime(),
    endAt: new Date(2026, 4, 14, 10, 0).getTime(),
  }

  it("extends endAt by snapped minutes, keeps startAt", () => {
    const next = computeResizeRange(base, "bottom", SLOT_HEIGHT_PX * 4) // +1h
    expect(next.startAt).toBe(base.startAt)
    expect(next.endAt - base.endAt).toBe(ONE_HOUR_MS)
  })

  it("clamps to min duration when shrinking past start", () => {
    const next = computeResizeRange(base, "bottom", -SLOT_HEIGHT_PX * 100)
    expect(next.endAt - next.startAt).toBe(MIN_EVENT_MINUTES * 60_000)
  })
})
