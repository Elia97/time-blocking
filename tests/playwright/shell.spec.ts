import { expect, test } from "@playwright/test"

test.describe("App shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("week-grid")).toBeVisible()
  })

  test("renders the sidebar brand", async ({ page }) => {
    await expect(page.locator("aside span", { hasText: "Time Blocking" })).toBeVisible()
  })

  test("renders a week-range heading in the topbar", async ({ page }) => {
    const heading = page.locator("header h1")
    await expect(heading).toBeVisible()
    await expect(heading).toHaveText(/\d{1,2}.*\d{4}/)
  })
})
