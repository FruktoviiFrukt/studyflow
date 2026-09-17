import { test, expect, type Route } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { addDays } from "../../lib/schedule";

test.beforeEach(async ({ context }) => {
  const name = "authjs.session-token";
  const token = await encode({
    secret: "schedule-ui-test-secret-only",
    salt: name,
    token: {
      id: "test-student",
      sub: "test-student",
      name: "Test",
      role: "STUDENT",
    },
  });
  await context.addCookies([
    {
      name,
      value: token,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
});

function payload(url: string, kind = "READY", name = "Предмет из API") {
  const params = new URL(url).searchParams;
  const from = params.get("from")!;
  return {
    from,
    to: params.get("to"),
    status: kind === "PROFILE_REQUIRED" ? kind : "READY",
    group: { id: "g", name: "TI-245" },
    subgroup: { id: "s", number: 2 },
    days:
      kind === "PROFILE_REQUIRED"
        ? []
        : Array.from({ length: 7 }, (_, i) => ({
            date: addDays(from, i),
            status:
              kind === "MISSING"
                ? "NOT_PUBLISHED"
                : i === 1
                  ? "HOLIDAY"
                  : i === 2
                    ? "NO_LESSONS"
                    : "LESSONS",
            week: { number: 3, parity: "ODD" },
            scheduleId: "schedule",
            holidays: i === 1 ? [{ id: "h", name: "Каникулы" }] : [],
            lessons:
              kind === "MISSING" || i === 1 || i === 2
                ? []
                : [
                    {
                      id: `${from}-${i}`,
                      lessonId: "l",
                      scheduleId: "schedule",
                      date: addDays(from, i),
                      startMinutes: 1125,
                      endMinutes: 1215,
                      type: "LECTURE",
                      subject: { id: "subject", name, colorKey: "unknown" },
                      classroom: "611",
                      teacher: "Преподаватель",
                      topic: null,
                    },
                  ],
          })),
  };
}
async function reply(route: Route, kind = "READY", name?: string) {
  await route.fulfill({ json: payload(route.request().url(), kind, name) });
}

test("global page switches course and semester without a date picker", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route("**/api/schedule/global/template?*", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url.search);
    const course = Number(url.searchParams.get("course"));
    const semester = Number(url.searchParams.get("semester"));
    const groups =
      course === 1 && semester === 1
        ? [
            { id: "sd", name: "SD-241" },
            { id: "ti1", name: "TI-241" },
            { id: "ti2", name: "TI-242" },
          ]
        : [{ id: "other", name: `OTHER-${course}${semester}` }];
    await route.fulfill({
      json: {
        course,
        academicYear: "2026/2027",
        semester,
        groups,
        days: Array.from({ length: 7 }, (_, weekday) => ({
          weekday,
          lessons:
            weekday === 0
              ? [
                  {
                    id: "shared",
                    weekday,
                    weekPattern: "ODD",
                    groupIds: ["ti1", "ti2"],
                    startMinutes: 585,
                    endMinutes: 675,
                    subject: {
                      id: "math",
                      name: "Математика",
                      colorKey: "blue",
                    },
                    type: "LECTURE",
                    teacher: "Преподаватель",
                    classroom: "301",
                    topic: null,
                  },
                  {
                    id: "even",
                    weekday,
                    weekPattern: "EVEN",
                    groupIds: ["ti1"],
                    startMinutes: 585,
                    endMinutes: 675,
                    subject: {
                      id: "physics",
                      name: "Физика",
                      colorKey: "blue",
                    },
                    type: "LECTURE",
                    teacher: null,
                    classroom: null,
                    topic: null,
                  },
                ]
              : [],
        })),
      },
    });
  });
  await page.goto("/schedule/global");
  await expect(
    page.getByRole("columnheader", { name: "TI-241" }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "SD-241" }),
  ).toBeVisible();
  await expect(page.getByText("Математика", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Физика", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Выбрать неделю" }),
  ).toHaveCount(0);
  const initialRequests = requests.length;
  await page.getByRole("combobox", { name: "Направление" }).click();
  await page.getByRole("option", { name: "TI" }).click();
  await expect(page.getByRole("columnheader", { name: "SD-241" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Чётная", exact: true }).click();
  await expect(page.getByText("Физика", { exact: true })).toBeVisible();
  await expect(page.getByText("Математика", { exact: true })).toHaveCount(0);
  expect(requests.length).toBe(initialRequests);
  await page.getByRole("button", { name: "2 курс" }).click();
  await expect(
    page.getByRole("columnheader", { name: "OTHER-21" }),
  ).toBeVisible();
  expect(requests.some((value) => value.includes("course=2&semester=1"))).toBe(
    true,
  );
  await page.getByRole("combobox", { name: "Семестр" }).click();
  await page.getByRole("option", { name: "2 семестр" }).click();
  await expect(
    page.getByRole("columnheader", { name: "OTHER-22" }),
  ).toBeVisible();
  expect(requests.some((value) => value.includes("course=2&semester=2"))).toBe(
    true,
  );
});

test("API data, seven slots, holidays, nullable topic and day navigation", async ({
  page,
}) => {
  let count = 0;
  await page.route("**/api/schedule?*", async (route) => {
    count++;
    await reply(route);
  });
  await page.goto("/schedule");
  await expect(page.getByText(/Группа TI-245.*Подгруппа 2/)).toBeVisible();
  await expect(page.getByText("7 пара", { exact: true })).toBeVisible();
  await expect(page.getByText("Каникулы", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Демонстрационные данные.", { exact: false }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: /Предмет из API.*Подробнее/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("18:45 – 20:15");
  await expect(page.getByText("Тема занятия", { exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  const requestsBeforeView = count;
  await page.getByRole("button", { name: "День", exact: true }).click();
  await expect(
    page
      .getByRole("group", { name: "Вид расписания" })
      .getByRole("button", { name: "День", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(count).toBe(requestsBeforeView);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Неделя", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".review-output/student-schedule-api-mobile.png",
    fullPage: true,
  });
});

test("loading, retry, incomplete profile and missing publication", async ({
  page,
}) => {
  let kind = "ERROR";
  await page.route("**/api/schedule?*", async (route) => {
    if (kind === "ERROR")
      await route.fulfill({
        status: 500,
        json: { message: "Ошибка загрузки" },
      });
    else await reply(route, kind);
  });
  await page.goto("/schedule");
  await expect(
    page.getByRole("alert").filter({ hasText: "Ошибка загрузки" }),
  ).toBeVisible();
  kind = "PROFILE_REQUIRED";
  await page.getByRole("button", { name: "Повторить загрузку" }).click();
  await expect(
    page.getByRole("heading", { name: "Заполните профиль" }),
  ).toBeVisible();
  kind = "MISSING";
  await page.getByRole("button", { name: "Проверить снова" }).click();
  await expect(
    page.getByText("Расписание на эту неделю ещё не опубликовано"),
  ).toBeVisible();
});

test("late response cannot overwrite a newer week", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let count = 0;
  await page.route("**/api/schedule?*", async (route) => {
    count++;
    if (count === 1) {
      await gate;
      await reply(route, "READY", "Старый предмет").catch(() => {});
    } else await reply(route, "READY", "Новый предмет");
  });
  await page.goto("/schedule");
  await expect(page.getByRole("status")).toContainText("Загружаем расписание");
  await page.getByRole("button", { name: "Следующая неделя" }).click();
  await expect(
    page.getByRole("button", { name: /Новый предмет.*Подробнее/ }).first(),
  ).toBeVisible();
  release();
  await expect(page.getByText("Старый предмет", { exact: true })).toHaveCount(
    0,
  );
});
