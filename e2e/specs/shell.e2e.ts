import { $, expect } from "@wdio/globals"

describe("App shell", () => {
  it("renders the sidebar brand", async () => {
    const brand = await $("aside span")
    await brand.waitForDisplayed({ timeout: 10_000 })
    await expect(brand).toHaveText("Time Blocking")
  })

  it("renders a week-range header in the topbar", async () => {
    const header = await $("header h1")
    await header.waitForDisplayed({ timeout: 10_000 })
    await expect(header).toHaveText(expect.stringMatching(/20\d{2}/))
  })
})
