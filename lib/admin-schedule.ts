// Frontend-only contracts. These records are never written to a server.
export type Parity = "every" | "odd" | "even";
export type Audience = { group: string; subgroup: "all" | "1" | "2" };
export type AdminLesson = {
  id: string;
  subject: string;
  type: string;
  day: number;
  start: string;
  end: string;
  teacher: string;
  room: string;
  topic: string;
  parity: Parity;
  audiences: Audience[];
  reviewed: boolean;
  sourceText?: string;
};
export type ScheduleDraft = {
  id: string;
  year: string;
  course: string;
  semester: string;
  status: "draft" | "published";
  filename: string;
  sourceUrl?: string;
  lessons: AdminLesson[];
  holidays?: ScheduleHoliday[];
};
export type ScheduleHoliday = {
  id: string;
  name: string;
  start: string;
  end: string;
};

export function holidayOn(date: string, holidays: ScheduleHoliday[]) {
  return holidays.find(
    (holiday) => holiday.start <= date && date <= holiday.end,
  );
}
export const DAYS = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];
export const PARITIES: Record<Parity, string> = {
  every: "Каждую неделю",
  odd: "Нечётная",
  even: "Чётная",
};
export const SLOTS = [
  "08:00–09:30",
  "09:45–11:15",
  "11:30–13:00",
  "13:30–15:00",
  "15:15–16:45",
  "17:00–18:30",
  "18:45–20:15",
];
export const TYPES = [
  "Лекция",
  "Лабораторная",
  "Практика",
  "Семинар",
  "Не указан",
];

export function emptyLesson(): AdminLesson {
  return {
    id: "",
    subject: "",
    type: "Не указан",
    day: 0,
    start: "08:00",
    end: "09:30",
    teacher: "",
    room: "",
    topic: "",
    parity: "every",
    audiences: [{ group: "", subgroup: "all" }],
    reviewed: false,
  };
}

export function lessonErrors(lesson: AdminLesson): string[] {
  const errors: string[] = [];
  if (!lesson.subject.trim()) errors.push("Укажите предмет.");
  if (!Number.isInteger(lesson.day) || lesson.day < 0 || lesson.day > 6)
    errors.push("Выберите день недели.");
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (
    !time.test(lesson.start) ||
    !time.test(lesson.end) ||
    lesson.end <= lesson.start
  )
    errors.push("Окончание должно быть позже начала в пределах одного дня.");
  if (!lesson.audiences.length || lesson.audiences.some((a) => !a.group.trim()))
    errors.push("Укажите группу для каждого получателя.");
  const seen = new Map<string, string[]>();
  for (const a of lesson.audiences) {
    const group = a.group.trim().toUpperCase();
    const previous = seen.get(group) ?? [];
    if (
      previous.includes(a.subgroup) ||
      (previous.length && (previous.includes("all") || a.subgroup === "all"))
    )
      errors.push(`Группа ${group}: получатели дублируются.`);
    seen.set(group, [...previous, a.subgroup]);
  }
  return [...new Set(errors)];
}

export function audienceLabel(a: Audience) {
  return `${a.group} · ${a.subgroup === "all" ? "вся группа" : `подгр. ${a.subgroup}`}`;
}

export function matchesStudent(
  lesson: AdminLesson,
  group: string,
  subgroup: string,
  parity: string,
) {
  return (
    (parity === "all" ||
      lesson.parity === "every" ||
      lesson.parity === parity) &&
    lesson.audiences.some(
      (a) =>
        (!group || a.group === group) &&
        (subgroup === "all" || a.subgroup === "all" || a.subgroup === subgroup),
    )
  );
}

export function scheduleIssues(lessons: AdminLesson[]) {
  const issues: { id: string; message: string }[] = [];
  for (const lesson of lessons) {
    lessonErrors(lesson).forEach((message) =>
      issues.push({ id: lesson.id, message }),
    );
    if (!lesson.reviewed)
      issues.push({
        id: lesson.id,
        message: "Нужно проверить данные и распределение по подгруппам.",
      });
  }
  for (let i = 0; i < lessons.length; i++) {
    for (let j = i + 1; j < lessons.length; j++) {
      const a = lessons[i],
        b = lessons[j];
      if (
        a.day !== b.day ||
        a.start >= b.end ||
        b.start >= a.end ||
        (a.parity !== "every" && b.parity !== "every" && a.parity !== b.parity)
      )
        continue;
      const shared = a.audiences.some((x) =>
        b.audiences.some(
          (y) =>
            x.group.trim().toUpperCase() === y.group.trim().toUpperCase() &&
            (x.subgroup === "all" ||
              y.subgroup === "all" ||
              x.subgroup === y.subgroup),
        ),
      );
      if (shared)
        issues.push({
          id: b.id,
          message: `Пересечение с «${a.subject}»: одна группа или подгруппа в одно время.`,
        });
    }
  }
  return issues;
}

export function publishDemo(
  records: ScheduleDraft[],
  id: string,
): ScheduleDraft[] {
  const selected = records.find((r) => r.id === id);
  if (
    !selected ||
    selected.status !== "draft" ||
    !selected.lessons.length ||
    scheduleIssues(selected.lessons).length
  )
    return records;
  return records.map((r) => (r.id === id ? { ...r, status: "published" } : r));
}

export function exampleLessons(): AdminLesson[] {
  const make = (
    id: string,
    subject: string,
    patch: Partial<AdminLesson> = {},
  ): AdminLesson => ({
    ...emptyLesson(),
    id,
    subject,
    teacher: "Преподаватель из примера",
    room: "3-301",
    reviewed: true,
    audiences: [{ group: "SI-261", subgroup: "all" }],
    ...patch,
  });
  return [
    make("demo-1", "Математический анализ", {
      start: "09:45",
      end: "11:15",
      parity: "odd",
      teacher: "Stanciu L.",
      room: "611",
      type: "Практика",
    }),
    make("demo-2", "Линейная алгебра", {
      start: "09:45",
      end: "11:15",
      parity: "even",
      teacher: "Stanciu L.",
      room: "611",
      type: "Практика",
    }),
    make("demo-3", "Математический анализ", {
      start: "11:30",
      end: "13:00",
      teacher: "Costaș A.",
      room: "6-2",
      type: "Лекция",
      audiences: ["SI-261", "SI-262", "SI-263"].map((group) => ({
        group,
        subgroup: "all",
      })),
    }),
    make("demo-4", "Программирование", {
      day: 1,
      type: "Лабораторная",
      audiences: [{ group: "SI-261", subgroup: "1" }],
      room: "D01",
      teacher: "Danilov I.",
    }),
    make("demo-5", "Программирование", {
      day: 1,
      type: "Лабораторная",
      audiences: [{ group: "SI-261", subgroup: "2" }],
      room: "D03",
      teacher: "Chistol M.",
      reviewed: false,
    }),
    make("demo-6", "Английский язык", {
      day: 2,
      start: "13:30",
      end: "15:00",
      type: "Практика",
      teacher: "Veleșcu L.",
      room: "203",
    }),
    make("demo-7", "Криптография", {
      day: 3,
      start: "17:00",
      end: "18:30",
      parity: "odd",
      teacher: "Zaica M.",
      room: "402",
    }),
    make("demo-8", "Техники программирования", {
      day: 4,
      start: "18:45",
      end: "20:15",
      type: "Лекция",
      room: "6-2",
    }),
  ];
}

export function initialSchedules(): ScheduleDraft[] {
  return [
    {
      id: "example-draft",
      year: "2026/2027",
      course: "1",
      semester: "1",
      status: "draft",
      filename: "Пример расписания · 1 курс",
      lessons: exampleLessons(),
    },
    {
      id: "example-published",
      year: "2026/2027",
      course: "2",
      semester: "1",
      status: "published",
      filename: "Пример расписания · 2 курс",
      lessons: exampleLessons().map((l) => ({ ...l, reviewed: true })),
    },
  ];
}
