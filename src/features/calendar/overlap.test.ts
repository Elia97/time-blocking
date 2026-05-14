import { describe, expect, it } from "vitest"

import { layoutOverlaps } from "./overlap"

const ev = (id: string, startAt: number, endAt: number) => ({ id, startAt, endAt })

describe("layoutOverlaps", () => {
  it("returns an empty map for no events", () => {
    expect(layoutOverlaps([]).size).toBe(0)
  })

  it("assigns column 0 / total 1 for disjoint events", () => {
    const out = layoutOverlaps([ev("a", 0, 100), ev("b", 200, 300)])
    expect(out.get("a")).toEqual({ column: 0, totalColumns: 1 })
    expect(out.get("b")).toEqual({ column: 0, totalColumns: 1 })
  })

  it("splits two parallel events into two columns", () => {
    const out = layoutOverlaps([ev("a", 0, 100), ev("b", 50, 150)])
    expect(out.get("a")?.totalColumns).toBe(2)
    expect(out.get("b")?.totalColumns).toBe(2)
    expect(out.get("a")?.column).not.toBe(out.get("b")?.column)
  })

  it("packs cascading events into three columns", () => {
    const out = layoutOverlaps([ev("a", 0, 30), ev("b", 10, 40), ev("c", 20, 50)])
    expect(out.get("a")?.totalColumns).toBe(3)
    expect(out.get("b")?.totalColumns).toBe(3)
    expect(out.get("c")?.totalColumns).toBe(3)
    const cols = new Set([out.get("a")!.column, out.get("b")!.column, out.get("c")!.column])
    expect(cols.size).toBe(3)
  })

  it("treats edge-touching events as non-overlapping", () => {
    // a ends at 100, b starts at 100 → b reuses column 0, cluster closes
    const out = layoutOverlaps([ev("a", 0, 100), ev("b", 100, 200)])
    expect(out.get("a")).toEqual({ column: 0, totalColumns: 1 })
    expect(out.get("b")).toEqual({ column: 0, totalColumns: 1 })
  })

  it("handles a long event with two short ones overlapping it sequentially", () => {
    // a:[0,100] outer; b:[10,40]; c:[50,90] — b and c don't overlap each other but both overlap a
    // Expect a in one column, b and c sharing the other column → total 2
    const out = layoutOverlaps([ev("a", 0, 100), ev("b", 10, 40), ev("c", 50, 90)])
    expect(out.get("a")?.totalColumns).toBe(2)
    expect(out.get("b")?.totalColumns).toBe(2)
    expect(out.get("c")?.totalColumns).toBe(2)
    expect(out.get("b")?.column).toBe(out.get("c")?.column)
    expect(out.get("a")?.column).not.toBe(out.get("b")?.column)
  })

  it("treats fully contained events as overlapping", () => {
    const out = layoutOverlaps([ev("outer", 0, 100), ev("inner", 30, 60)])
    expect(out.get("outer")?.totalColumns).toBe(2)
    expect(out.get("inner")?.totalColumns).toBe(2)
  })

  it("is stable regardless of input order", () => {
    const a = layoutOverlaps([ev("a", 0, 100), ev("b", 50, 150), ev("c", 200, 300)])
    const b = layoutOverlaps([ev("c", 200, 300), ev("b", 50, 150), ev("a", 0, 100)])
    expect(a).toEqual(b)
  })
})
