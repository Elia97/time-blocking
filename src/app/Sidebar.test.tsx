import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Sidebar } from "./Sidebar"

describe("Sidebar", () => {
  it("renders the app brand", () => {
    render(<Sidebar />)
    expect(screen.getByText("Time Blocking")).toBeInTheDocument()
  })

  it("lists the placeholder sections for upcoming phases", () => {
    render(<Sidebar />)
    expect(screen.getByText("Calendars")).toBeInTheDocument()
    expect(screen.getByText("Categories")).toBeInTheDocument()
    expect(screen.getByText("Tags")).toBeInTheDocument()
    expect(screen.getByText("Filters")).toBeInTheDocument()
  })
})
