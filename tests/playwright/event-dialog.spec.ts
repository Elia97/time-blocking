import { expect, test } from "@playwright/test"

test.describe("Event dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("week-grid")).toBeVisible()
  })

  test("opens when New event in the topbar is clicked", async ({ page }) => {
    await page.getByRole("button", { name: "New event" }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("heading", { name: "New event" })).toBeVisible()
  })

  test("shows a validation error when the title is empty", async ({ page }) => {
    await page.getByRole("button", { name: "New event" }).click()
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.getByText("Title is required")).toBeVisible()
  })

  test("hides the time inputs when All day is toggled on", async ({ page }) => {
    await page.getByRole("button", { name: "New event" }).click()
    await expect(page.getByLabel("Start")).toBeVisible()
    await page.getByRole("switch", { name: /all day/i }).click()
    await expect(page.getByLabel("Start")).toHaveCount(0)
  })

  test("closes when Cancel is clicked", async ({ page }) => {
    await page.getByRole("button", { name: "New event" }).click()
    await page.getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("dialog")).toHaveCount(0)
  })
})
