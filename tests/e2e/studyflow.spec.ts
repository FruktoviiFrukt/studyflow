import { expect, test } from "@playwright/test";

test("schedule calendar opens and restores focus after Escape", async ({
  page,
}) => {
  await page.goto("/schedule");
  const trigger = page.getByRole("button", { name: "Выбрать дату" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("mobile navigation opens and follows a schedule link", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  const menu = page.getByRole("dialog");
  await menu.getByRole("button", { name: "Расписание", exact: true }).click();
  await menu.getByRole("link", { name: "Расписание студента" }).click();
  await expect(page).toHaveURL(/\/schedule$/);
  await expect(menu).toBeHidden();
});

test("calculator rejects division by zero and applies a valid formula", async ({
  page,
}) => {
  await page.goto("/gpa/calculator");
  const grades = page.getByPlaceholder("Оценка от 1 до 10");
  await expect(grades).toHaveCount(5);
  for (const field of await grades.all()) await field.fill("8");
  const formula = page.getByLabel("Формула оценки за семестр");
  await formula.fill("g1 / 0");
  await page.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(formula).toHaveAttribute("aria-invalid", "true");
  await formula.fill("(g1 + g2) / 2");
  await page.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(
    page.getByText("Формула применена.", { exact: true }),
  ).toBeVisible();
  await expect(formula).toHaveAttribute("aria-invalid", "false");
});

test("AI generation starts disabled until input is supplied", async ({
  page,
}) => {
  await page.goto("/ai-coach");
  await expect(
    page.getByRole("button", { name: "Сгенерировать вопросы" }),
  ).toBeDisabled();
});
