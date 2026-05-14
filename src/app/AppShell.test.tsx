import { describe, expect, it } from "vitest"

import { AppShell } from "./AppShell"
import { renderWithProviders } from "@/test/render"

describe("AppShell", () => {
  it("renders sidebar, topbar, and main pane regions", () => {
    const { container } = renderWithProviders(<AppShell />)

    expect(container.querySelector("aside")).not.toBeNull()
    expect(container.querySelector("header")).not.toBeNull()
    expect(container.querySelector("main")).not.toBeNull()
  })

  it("shows the Phase 0 placeholder", () => {
    const { getByText } = renderWithProviders(<AppShell />)

    expect(getByText("App shell ready")).toBeInTheDocument()
    expect(getByText(/calendar grid, drag/i)).toBeInTheDocument()
  })
})
