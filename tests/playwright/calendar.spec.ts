import { expect, test } from "@playwright/test"

test.describe("Calendar week view", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("week-grid")).toBeVisible()
  })

  test("renders 7 day columns", async ({ page }) => {
    await expect(page.getByTestId("day-column")).toHaveCount(7)
  })

  test("renders hour labels in the time gutter", async ({ page }) => {
    await expect(page.getByText("01:00", { exact: true })).toBeAttached()
    await expect(page.getByText("23:00", { exact: true })).toBeAttached()
  })

  test("navigates between weeks and snaps back via Today", async ({ page }) => {
    const heading = page.locator("header h1")
    const initial = await heading.textContent()

    await page.getByRole("button", { name: "Next week" }).click()
    await expect(heading).not.toHaveText(initial ?? "")

    await page.getByRole("button", { name: "Today" }).click()
    await expect(heading).toHaveText(initial ?? "")
  })
})
