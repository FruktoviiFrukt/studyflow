import { expect, test } from "@playwright/test";

// Run without the saved session to check the protection itself.
test.use({ storageState: { cookies: [], origins: [] } });

test("protected pages redirect an anonymous visitor to sign in", async ({
  page,
}) => {
  for (const path of ["/dashboard", "/tasks", "/schedule", "/gpa"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth$/);
  }
});

test("wrong password shows an error and keeps the visitor on the form", async ({
  page,
}) => {
  await page.goto("/auth");
  await page.locator("#login-email").fill("nobody@utm.md");
  await page.locator("#login-password").fill("wrong-password");
  await page.locator("form").getByRole("button", { name: "Войти" }).click();
  await expect(page.getByText("Неверный email или пароль")).toBeVisible();
  await expect(page).toHaveURL(/\/auth$/);
});
