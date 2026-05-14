import { $, $$, expect } from "@wdio/globals"

describe("Week view", () => {
  it("renders 7 day columns", async () => {
    const firstColumn = await $('[data-testid="day-column"]')
    await firstColumn.waitForDisplayed({ timeout: 10_000 })
    const columns = await $$('[data-testid="day-column"]')
    await expect(columns).toBeElementsArrayOfSize(7)
  })

  it("renders hour labels in the time gutter", async () => {
    const grid = await $('[data-testid="week-grid"]')
    await grid.waitForDisplayed({ timeout: 10_000 })
    await expect($("*=01:00")).toBeDisplayed()
    await expect($("*=23:00")).toBeDisplayed()
  })

  it("navigates to the next week and updates the header", async () => {
    const header = await $("header h1")
    const initial = await header.getText()
    const nextBtn = await $('button[aria-label="Next week"]')
    await nextBtn.click()
    await browser.waitUntil(async () => (await header.getText()) !== initial, {
      timeout: 5_000,
      timeoutMsg: "Header did not update after clicking next week",
    })
    const todayBtn = await $("button=Today")
    await todayBtn.click()
    await browser.waitUntil(async () => (await header.getText()) === initial, {
      timeout: 5_000,
      timeoutMsg: "Header did not snap back after clicking Today",
    })
  })
})
