import { describe, expect, it } from "vitest"

import { Topbar } from "./Topbar"
import { renderWithProviders } from "@/test/render"

describe("Topbar", () => {
  it("shows the current view label", () => {
    const { getByText } = renderWithProviders(<Topbar />)
    expect(getByText("Today")).toBeInTheDocument()
  })

  it("renders all three view-switcher buttons", () => {
    const { getByText } = renderWithProviders(<Topbar />)
    expect(getByText("Day")).toBeInTheDocument()
    expect(getByText("Week")).toBeInTheDocument()
    expect(getByText("Month")).toBeInTheDocument()
  })

  it("renders a disabled New event action (enabled in Phase 1)", () => {
    const { getByRole } = renderWithProviders(<Topbar />)
    const newEvent = getByRole("button", { name: /new event/i })
    expect(newEvent).toBeDisabled()
  })

  it("exposes the theme toggle", () => {
    const { getByRole } = renderWithProviders(<Topbar />)
    expect(getByRole("button", { name: /toggle theme/i })).toBeInTheDocument()
  })
})
