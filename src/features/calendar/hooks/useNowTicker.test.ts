import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { useNowTicker } from "./useNowTicker"

describe("useNowTicker", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 14, 10, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns the current time at first render", () => {
    const { result } = renderHook(() => useNowTicker(1000))
    expect(result.current.getMinutes()).toBe(0)
  })

  it("updates on each interval tick", () => {
    const { result } = renderHook(() => useNowTicker(1000))
    const first = result.current.getTime()
    act(() => {
      vi.setSystemTime(new Date(2026, 4, 14, 10, 1))
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.getTime()).toBeGreaterThan(first)
  })

  it("clears the interval on unmount", () => {
    const { unmount } = renderHook(() => useNowTicker(1000))
    const spy = vi.spyOn(globalThis, "clearInterval")
    unmount()
    expect(spy).toHaveBeenCalled()
  })
})
