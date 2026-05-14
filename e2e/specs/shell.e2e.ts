import { $, expect } from "@wdio/globals"

describe("App shell", () => {
  it("renders the sidebar brand", async () => {
    const brand = await $("aside span")
    await brand.waitForDisplayed({ timeout: 10_000 })
    await expect(brand).toHaveText("Time Blocking")
  })

  it("renders the current view header in the topbar", async () => {
    const header = await $("header h1")
    await expect(header).toHaveText("Today")
  })

  it("shows the Phase 0 placeholder in the main pane", async () => {
    const headline = await $("main h2")
    await expect(headline).toHaveText("App shell ready")
  })
})
