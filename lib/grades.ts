export type Semester = 1 | 2;
export type SemesterFilter = "all" | Semester;
export type GradeStage = { variable: string; name: string; grade: string };
export type GradeSubject = {
  id: string;
  name: string;
  semester: Semester;
  stages: GradeStage[];
  formula: string;
};
export type GradeResult = { value: number | null; error?: string };
export const semesterFormula =
  "g1 * 15% + g2 * 15% + g3 * 15% + g4 * 15% + g5 * 40%";
export function createSubject(
  id: string,
  name: string,
  semester: Semester = 1,
): GradeSubject {
  return {
    id,
    name,
    semester,
    formula: semesterFormula,
    stages: [
      { variable: "g1", name: "Аттестация 1", grade: "" },
      { variable: "g2", name: "Аттестация 2", grade: "" },
      { variable: "g3", name: "Лабораторные работы", grade: "" },
      { variable: "g4", name: "Индивидуальная работа", grade: "" },
      { variable: "g5", name: "Экзамен", grade: "" },
    ],
  };
}
export const initialSubjects = [
  createSubject("programming", "Программирование", 1),
  createSubject("math", "Высшая математика", 2),
];

// Parse arithmetic only: user formulas are never executed as JavaScript.
function evaluateFormula(
  source: string,
  variables: Map<string, number | null>,
): GradeResult {
  if (source.length > 500)
    return {
      value: null,
      error: "Формула слишком длинная (максимум 500 символов).",
    };
  const tokens =
    source
      .toLowerCase()
      .replaceAll(",", ".")
      .replaceAll("−", "-")
      .match(/g\d+|\d+(?:\.\d+)?|[()+*/-]|[^\s]/g) ?? [];
  let position = 0;
  let missing = false;
  function primary(): number {
    const token = tokens[position++];
    if (token === "+") return primary();
    if (token === "-") return -primary();
    if (token === "(") {
      const value = expression();
      if (tokens[position++] !== ")")
        throw new Error("Проверьте скобки в формуле.");
      return value;
    }
    if (token && /^g\d+$/.test(token)) {
      if (!variables.has(token))
        throw new Error(`Этап ${token} не найден. Исправьте формулу.`);
      const value = variables.get(token);
      if (value === null) missing = true;
      return value ?? 0;
    }
    if (token && /^\d+(?:\.\d+)?$/.test(token)) return Number(token);
    throw new Error("Используйте g1, g2, числа, скобки и знаки + − * /.");
  }
  function percentage(): number {
    let value = primary();
    if (tokens[position] === "%") {
      position++;
      value /= 100;
    }
    return value;
  }
  function term(): number {
    let value = percentage();
    while (tokens[position] === "*" || tokens[position] === "/") {
      const operator = tokens[position++];
      const right = percentage();
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }
  function expression(): number {
    let value = term();
    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position++];
      const right = term();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }
  try {
    const value = expression();
    if (position !== tokens.length)
      throw new Error(
        "Проверьте формулу: между значениями нужен знак операции.",
      );
    if (missing) return { value: null };
    if (!Number.isFinite(value))
      throw new Error(
        "Нельзя делить на ноль или получать бесконечный результат.",
      );
    if (value < 1 || value > 10)
      throw new Error("Результат должен быть от 1 до 10. Проверьте формулу.");
    return { value };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : "Проверьте формулу.",
    };
  }
}

export function calculateSemester(subject: GradeSubject): GradeResult {
  const variables = new Map<string, number | null>();
  for (const stage of subject.stages) {
    const text = stage.grade.trim().replaceAll(",", ".");
    if (!text) {
      variables.set(stage.variable, null);
      continue;
    }
    const grade = Number(text);
    if (
      !/^\d+(?:\.\d+)?$/.test(text) ||
      !Number.isFinite(grade) ||
      grade < 1 ||
      grade > 10
    ) {
      return {
        value: null,
        error: `Введите оценку от 1 до 10: ${stage.name}.`,
      };
    }
    variables.set(stage.variable, grade);
  }
  return evaluateFormula(subject.formula.trim() || semesterFormula, variables);
}

export function gradeStatus(value: number | null) {
  return value === null
    ? "Нет оценки"
    : value >= 9
      ? "Отлично"
      : value >= 7
        ? "Хорошо"
        : value >= 5
          ? "Удовлетворительно"
          : "Нужно подтянуть";
}

export function averageGrade(values: (number | null)[]) {
  const grades = values.filter((value): value is number => value !== null);
  return grades.length
    ? grades.reduce((sum, value) => sum + value, 0) / grades.length
    : null;
}

export function calculateOverall(subjects: GradeSubject[]) {
  const averages = subjects.map(subjectGrade);
  return {
    average: averageGrade(averages),
    countedSubjects: averages.filter((value) => value !== null).length,
  };
}

export function subjectGrade(subject: GradeSubject) {
  return calculateSemester(subject).value;
}

export function filterSubjects(
  subjects: GradeSubject[],
  semester: SemesterFilter,
) {
  return semester === "all"
    ? subjects
    : subjects.filter((subject) => subject.semester === semester);
}

export function isLowGrade(input: string) {
  const text = input.trim().replaceAll(",", ".");
  return /^\d+(?:\.\d+)?$/.test(text) && Number(text) >= 1 && Number(text) < 5;
}
