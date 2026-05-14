import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { renderWithProviders } from "@/test/render"
import { useCalendarUiStore } from "@/stores/calendarUiStore"
import { startOfCalendarWeek } from "@/lib/date"
import { Topbar } from "./Topbar"

const FIXED_NOW = new Date(2026, 4, 14, 10, 30)

describe("Topbar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(FIXED_NOW)
    useCalendarUiStore.setState({ anchorDate: startOfCalendarWeek(FIXED_NOW) })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the current week range as the heading", () => {
    renderWithProviders(<Topbar />)
    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading.textContent).toMatch(/May.*2026/)
  })

  it("renders the view switcher with Week active and the others disabled", () => {
    renderWithProviders(<Topbar />)
    expect(screen.getByRole("button", { name: "Day" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Week" })).not.toBeDisabled()
    expect(screen.getByRole("button", { name: "Month" })).toBeDisabled()
  })

  it("keeps the New event action disabled (slice 1b)", () => {
    renderWithProviders(<Topbar />)
    expect(screen.getByRole("button", { name: /new event/i })).toBeDisabled()
  })

  it("exposes the theme toggle", () => {
    renderWithProviders(<Topbar />)
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument()
  })

  it("advances the anchor by one week when clicking Next", async () => {
    const user = userEvent.setup()
    renderWithProviders(<Topbar />)
    await user.click(screen.getByRole("button", { name: /next week/i }))
    expect(useCalendarUiStore.getState().anchorDate.getDate()).toBe(18)
  })

  it("rewinds the anchor by one week when clicking Previous", async () => {
    const user = userEvent.setup()
    renderWithProviders(<Topbar />)
    await user.click(screen.getByRole("button", { name: /previous week/i }))
    expect(useCalendarUiStore.getState().anchorDate.getDate()).toBe(4)
  })

  it("snaps back to this week when clicking Today", async () => {
    const user = userEvent.setup()
    useCalendarUiStore.getState().goToNextWeek()
    useCalendarUiStore.getState().goToNextWeek()
    renderWithProviders(<Topbar />)
    await user.click(screen.getByRole("button", { name: "Today" }))
    expect(useCalendarUiStore.getState().anchorDate.getDate()).toBe(11)
  })
})
