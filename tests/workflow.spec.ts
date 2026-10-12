import { test, expect } from "@playwright/test";

test("user can load Wordle page and generate saved activity", async ({ page }) => {
  await page.goto("/wordle");

  await expect(
    page.getByRole("heading", { name: "Phoneme Wordle Builder" })
  ).toBeVisible();

  const activitySelect = page.locator("#savedActivity");

  await expect(activitySelect).toBeVisible();

  // Wait until saved activities have loaded from the database.
  await expect
    .poll(async () => {
      return await activitySelect.locator("option").count();
    })
    .toBeGreaterThan(1);

  // Select the first saved Wordle activity.
  await activitySelect.selectOption({ index: 1 });

  // Wait until the activity data has loaded.
  await expect(page.locator("#activityName")).not.toHaveValue("");

  const generateButton = page.getByRole("button", {
    name: "Generate HTML from Saved Activity",
  });

  await expect(generateButton).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");

  await generateButton.click();

  const download = await downloadPromise;

  expect(download.suggestedFilename()).toContain(
    "phoneme-wordle"
  );

  await expect(
    page.getByText(
      "Wordle HTML generated successfully using saved database data."
    )
  ).toBeVisible();
});