import { beforeEach, describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  setTheme: vi.fn(),
  theme: "light" as "light" | "dark" | "system",
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: mocks.theme, setTheme: mocks.setTheme }),
}))

import { ThemeToggle } from "./ThemeToggle"
import { renderWithProviders } from "@/test/render"

beforeEach(() => {
  mocks.theme = "light"
  mocks.setTheme.mockClear()
})

function svgClassOfTrigger(container: HTMLElement) {
  const trigger = container.querySelector('button[aria-label="Toggle theme"]')
  return trigger?.querySelector("svg")?.getAttribute("class") ?? ""
}

describe("ThemeToggle", () => {
  it("renders the Sun icon when the theme is light", () => {
    mocks.theme = "light"
    const { container } = renderWithProviders(<ThemeToggle />)
    expect(svgClassOfTrigger(container)).toContain("lucide-sun")
  })

  it("renders the Moon icon when the theme is dark", () => {
    mocks.theme = "dark"
    const { container } = renderWithProviders(<ThemeToggle />)
    expect(svgClassOfTrigger(container)).toContain("lucide-moon")
  })

  it("renders the Monitor icon when the theme is system", () => {
    mocks.theme = "system"
    const { container } = renderWithProviders(<ThemeToggle />)
    expect(svgClassOfTrigger(container)).toContain("lucide-monitor")
  })

  it("opens a menu with Light / Dark / System options", async () => {
    const user = userEvent.setup()
    const { getByRole, findByRole } = renderWithProviders(<ThemeToggle />)

    await user.click(getByRole("button", { name: /toggle theme/i }))

    expect(await findByRole("menuitem", { name: /light/i })).toBeInTheDocument()
    expect(await findByRole("menuitem", { name: /dark/i })).toBeInTheDocument()
    expect(await findByRole("menuitem", { name: /system/i })).toBeInTheDocument()
  })

  it.each([
    ["light", /light/i],
    ["dark", /dark/i],
    ["system", /system/i],
  ] as const)("calls setTheme(%s) when the matching item is picked", async (value, label) => {
    const user = userEvent.setup()
    const { getByRole, findByRole } = renderWithProviders(<ThemeToggle />)

    await user.click(getByRole("button", { name: /toggle theme/i }))
    await user.click(await findByRole("menuitem", { name: label }))

    expect(mocks.setTheme).toHaveBeenCalledWith(value)
  })
})
