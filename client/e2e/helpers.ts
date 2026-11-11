import { expect, type Page } from "@playwright/test";

export const API_URL = `http://localhost:${process.env.E2E_API_PORT ?? 3100}/graphql`;
export const DEMO_PASSWORD = "equipment-bookings-demo";

export async function signInAs(page: Page, name: string) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: new RegExp(`Continue as ${name}`) }).click();
  await expect(page.getByRole("heading", { name: "Equipment", level: 1 })).toBeVisible();
}

/** A local calendar date a few days ahead, as YYYY-MM-DD. Seeds only use today and tomorrow. */
export function futureDate(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
