import { test, expect } from "@playwright/test";

test("holidays hide dated lessons, support editing and stay within their schedule", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-09-15T09:00:00Z"));
  await page.goto("/admin/schedule");
  await page
    .getByRole("button", { name: "Добавить каникулы", exact: true })
    .click();
  await page.getByLabel("Название", { exact: true }).fill("Осенние каникулы");
  await page.getByRole("combobox", { name: "Продолжительность" }).click();
  await page.getByRole("option", { name: "Промежуток дат" }).click();
  await page
    .getByRole("button", { name: "Начало каникул", exact: true })
    .click();
  await page.getByRole("button", { name: /14 сентября 2026/ }).click();
  await page
    .getByRole("button", { name: "Окончание каникул", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /13 сентября 2026/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /15 сентября 2026/ }).click();
  await page.getByRole("button", { name: "Сохранить каникулы" }).click();
  await page.getByRole("button", { name: "Как у студента" }).click();
  await page.getByLabel("Дата предпросмотра").fill("2026-09-14");
  const preview = page.getByRole("region", {
    name: "Предпросмотр расписания студента",
  });
  await expect(preview.getByText("Осенние каникулы · занятий нет")).toHaveCount(
    2,
  );
  await expect(
    preview.getByText("Математический анализ", { exact: true }),
  ).toHaveCount(0);
  await expect(
    preview.getByText("Программирование", { exact: true }),
  ).toHaveCount(0);
  await expect(
    preview.getByText("Английский язык", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Изменить каникулы Осенние каникулы" })
    .click();
  await page.getByRole("combobox", { name: "Продолжительность" }).click();
  await page.getByRole("option", { name: "Один день", exact: true }).click();
  await page.getByRole("button", { name: "Сохранить каникулы" }).click();
  await expect(
    preview.getByText("Программирование", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Дата предпросмотра").fill("2026-09-21");
  await expect(
    preview.getByText("Математический анализ", { exact: true }),
  ).toHaveCount(2);
  await page.getByRole("button", { name: /Список расписаний/ }).click();
  await page
    .getByRole("button", { name: "Открыть", exact: true })
    .nth(1)
    .click();
  await expect(page.getByText("Осенние каникулы", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: /Список расписаний/ }).click();
  await page
    .getByRole("button", { name: "Открыть", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Удалить каникулы Осенние каникулы" })
    .click();
  await expect(
    page.getByText("Каникулы и дополнительные выходные пока не добавлены."),
  ).toHaveCount(0);
});

test("draft deletion can be cancelled and preserves the published schedule", async ({
  page,
}) => {
  await page.goto("/admin/schedule");
  await expect(page.getByText(/Демонстрационный режим: изменения/)).toHaveCount(
    0,
  );
  await expect(
    page.getByText("Только занятия · аттестации и экзамены позже"),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Список расписаний/ }).click();
  await expect(
    page.getByRole("button", { name: "Удалить черновик", exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Удалить черновик", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Отмена" })
    .click();
  await expect(
    page.getByText("Пример расписания · 1 курс", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Удалить черновик", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Удалить черновик", exact: true })
    .click();
  await expect(
    page.getByText("Пример расписания · 1 курс", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Пример расписания · 2 курс", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Удалить черновик", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Рабочее расписание" }).click();
  await expect(
    page.getByRole("heading", { name: "Пример расписания · 2 курс" }),
  ).toBeVisible();
  await expect(page.getByText("Показано 8 из 8 занятий")).toBeVisible();
});

test("review, student filters, publication and returning to a draft", async ({
  page,
}) => {
  await page.goto("/admin/schedule");
  await expect(
    page.getByRole("heading", { name: "Расписание студентов", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Публикация · демо" }),
  ).toBeDisabled();
  await page.getByText("Требуется проверка: 1. Открыть замечания").click();
  await page.getByRole("button", { name: "Исправить", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Данные, группы и подгруппы проверены" })
    .check();
  await page.getByRole("button", { name: "Сохранить в черновик" }).click();
  await expect(
    page.getByRole("button", { name: "Публикация · демо" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Как у студента" }).click();
  await page.getByLabel("Подгруппа", { exact: true }).selectOption("2");
  await page.getByLabel("Неделя", { exact: true }).selectOption("even");
  const preview = page.getByRole("region", {
    name: "Предпросмотр расписания студента",
  });
  await expect(
    preview.getByText("Линейная алгебра", { exact: true }),
  ).toBeVisible();
  await expect(preview.getByText("Chistol M.", { exact: true })).toBeVisible();
  await expect(preview.getByText("Danilov I.", { exact: true })).toHaveCount(0);
  await expect(preview.getByText("Криптография", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Публикация · демо" }).click();
  await page
    .getByRole("button", { name: "Подтвердить демопубликацию" })
    .click();
  await expect(
    page.getByRole("button", { name: "Добавить занятие", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Список расписаний/ }).click();
  await expect(
    page.getByRole("button", { name: "Открыть", exact: true }),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "Рабочее расписание" }).click();
  await page.getByRole("button", { name: "Вернуть в черновик" }).click();
  await expect(
    page.getByRole("button", { name: "Добавить занятие", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Создать копию" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Список расписаний 2" }).click();
  await expect(
    page.getByRole("button", { name: "Открыть", exact: true }),
  ).toHaveCount(2);
});

test("upload creates an empty local draft, CRUD works and refresh resets it", async ({
  page,
}) => {
  await page.goto("/admin/schedule");
  await page
    .getByRole("button", { name: "Новое расписание", exact: true })
    .click();
  await page.getByLabel("PDF расписания").setInputFiles({
    name: "bad.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not a PDF"),
  });
  await page
    .getByRole("button", { name: "Создать черновик", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("не похоже на PDF");
  await page.getByLabel("PDF расписания").setInputFiles({
    name: "schedule.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });
  await page
    .getByRole("button", { name: "Создать черновик", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Черновик пока пуст" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Публикация · демо" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Добавить первое занятие" }).click();
  await page.getByLabel("Предмет *", { exact: true }).fill("Вечерняя пара");
  await page.getByLabel("Группа 1 *", { exact: true }).fill("SI-261");
  await page.getByLabel("Быстрый выбор пары").selectOption("18:45–20:15");
  await page
    .getByRole("checkbox", { name: "Данные, группы и подгруппы проверены" })
    .check();
  await page.getByRole("button", { name: "Сохранить в черновик" }).click();
  await expect(page.getByRole("cell", { name: /18:45–20:15/ })).toBeVisible();
  await page
    .getByRole("button", { name: "Удалить Вечерняя пара, 18:45" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Отмена" })
    .click();
  await expect(page.getByText("Вечерняя пара", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Удалить Вечерняя пара, 18:45" })
    .click();
  await page
    .getByRole("button", { name: "Удалить занятие", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Черновик пока пуст" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Пример расписания · 1 курс" }),
  ).toBeVisible();
});

test("mobile dialogs fit the viewport and filters have an empty state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/schedule");
  await page
    .getByRole("searchbox", { name: "Поиск занятий" })
    .fill("несуществующий предмет");
  await expect(
    page.getByRole("heading", { name: "Занятия не найдены" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Сбросить" }).click();
  await page
    .getByRole("button", { name: "Новое расписание", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".review-output/admin-schedule-mobile.png",
    fullPage: true,
  });
});
