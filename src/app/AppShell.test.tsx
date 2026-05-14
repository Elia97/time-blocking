import { describe, expect, it, vi } from "vitest"

import { AppShell } from "./AppShell"
import { renderWithQueryClient } from "@/test/render"
import * as useEventsModule from "@/features/calendar/useEvents"

function stubUseEvents() {
  vi.spyOn(useEventsModule, "useEvents").mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useEventsModule.useEvents>)
}

describe("AppShell", () => {
  it("renders sidebar, topbar, and main pane regions", () => {
    stubUseEvents()
    const { container } = renderWithQueryClient(<AppShell />)

    expect(container.querySelector("aside")).not.toBeNull()
    expect(container.querySelector("header")).not.toBeNull()
    expect(container.querySelector("main")).not.toBeNull()
  })

  it("mounts the WeekView grid in the main pane", () => {
    stubUseEvents()
    const { getByTestId } = renderWithQueryClient(<AppShell />)
    expect(getByTestId("week-grid")).toBeInTheDocument()
  })
})
