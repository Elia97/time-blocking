import { describe, expect, it } from "vitest"

import { eventUpdateFromForm, newEventFromForm } from "./factories"

describe("newEventFromForm", () => {
  it("seeds id, dirty flag, and timestamps", () => {
    const row = newEventFromForm(
      {
        title: "  Trim me  ",
        description: " note ",
        date: "2026-05-14",
        startTime: "09:00",
        endTime: "10:00",
        allDay: false,
      },
      1000,
    )
    expect(row.id).toMatch(/^[\w-]+$/)
    expect(row.title).toBe("Trim me")
    expect(row.description).toBe("note")
    expect(row.dirty).toBe(1)
    expect(row.createdAt).toBe(1000)
    expect(row.updatedAt).toBe(1000)
  })

  it("normalizes empty description and color to null", () => {
    const row = newEventFromForm(
      {
        title: "x",
        description: "",
        date: "2026-05-14",
        startTime: "09:00",
        endTime: "10:00",
        allDay: false,
        color: "",
      },
      0,
    )
    expect(row.description).toBeNull()
    expect(row.color).toBeNull()
  })
})

describe("eventUpdateFromForm", () => {
  it("flips dirty and updates timestamps", () => {
    const patch = eventUpdateFromForm(
      {
        title: "Foo",
        date: "2026-05-14",
        startTime: "09:00",
        endTime: "10:00",
        allDay: false,
      },
      2000,
    )
    expect(patch.dirty).toBe(1)
    expect(patch.updatedAt).toBe(2000)
    expect(patch.title).toBe("Foo")
  })
})
