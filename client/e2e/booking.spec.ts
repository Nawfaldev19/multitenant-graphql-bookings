import { expect, test } from "@playwright/test";
import { futureDate, signInAs } from "./helpers";

test("a member finds equipment, books it, and cancels the booking", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Shared equipment, booked fairly." })).toBeVisible();
  await signInAs(page, "Cora Mbeki");

  await page.getByLabel("Search").fill("lathe");
  await page.getByRole("link", { name: /Wood lathe/ }).click();
  await expect(page.getByRole("heading", { name: "Wood lathe", level: 1 })).toBeVisible();

  await page.getByLabel("Date").fill(futureDate(3));
  await page.getByLabel("Start").selectOption("19:00");
  await page.getByLabel("Duration").selectOption("90");
  await page.getByLabel("Note (optional)").fill("Turning a bowl");
  await page.getByRole("button", { name: "Book" }).click();

  await expect(page.getByText(/^Booked /)).toBeVisible();
  await expect(page.locator(".timeline")).toContainText("You");

  await page.getByRole("link", { name: "My reservations" }).click();
  const row = page.getByRole("row", { name: /Wood lathe/ }).filter({ hasText: "Turning a bowl" });
  await row.getByRole("button", { name: /Cancel/ }).click();
  await expect(page.getByText(/^Cancelled Wood lathe/)).toBeVisible();
  await expect(row.getByText("cancelled")).toBeVisible();
});

test("a second person cannot take a slot that is already booked", async ({ page }) => {
  const date = futureDate(4);
  await signInAs(page, "Cora Mbeki");
  await page.getByRole("link", { name: /Sewing machine/ }).click();
  await page.getByLabel("Date").fill(date);
  await page.getByLabel("Start").selectOption("18:00");
  await page.getByRole("button", { name: "Book" }).click();
  await expect(page.getByText(/^Booked /)).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();

  await signInAs(page, "Ben Lindqvist");
  await page.getByRole("link", { name: /Sewing machine/ }).click();
  await page.getByLabel("Date").fill(date);
  await page.getByLabel("Start").selectOption("18:30");
  await page.getByRole("button", { name: "Book" }).click();

  await expect(page.getByText("This time overlaps an existing reservation")).toBeVisible();
  await expect(page.getByLabel("Start")).toHaveAttribute("aria-invalid", "true");
});
