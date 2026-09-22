import { expect, test as setup } from "@playwright/test";

import { STORAGE_STATE } from "./storage-state";

// Credentials of the account created by `prisma db seed`.
const email = process.env.E2E_EMAIL ?? "admin@utm.md";
const password = process.env.E2E_PASSWORD ?? "admin123";

setup("sign in once and keep the session for other tests", async ({ page }) => {
  await page.goto("/auth");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.locator("form").getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().storageState({ path: STORAGE_STATE });
});
