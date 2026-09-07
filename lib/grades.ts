export type GradePart = { id: string; variable: string; name: string; grade: string };
export type GradeStage = { id: string; name: string; parts: GradePart[]; formula: string };
export type GradeSubject = { id: string; name: string; stages: GradeStage[] };
export type GradeResult = { value: number | null; error?: string };

export function createStage(id: string, name: string): GradeStage {
  return {
    id, name, formula: "",
    parts: [
      { id: `${id}-1`, variable: "g1", name: "Лабораторные работы", grade: "" },
      { id: `${id}-2`, variable: "g2", name: "Работа по аттестации", grade: "" },
    ],
  };
}

export function createSubject(id: string, name: string): GradeSubject {
  return {
    id, name,
    stages: [
      createStage(`${id}-a1`, "Аттестация 1"),
      createStage(`${id}-a2`, "Аттестация 2"),
      { id: `${id}-exam`, name: "Экзамен", formula: "", parts: [{ id: `${id}-exam-1`, variable: "g1", name: "Экзаменационная работа", grade: "" }] },
    ],
  };
}

export const initialSubjects = [createSubject("programming", "Программирование"), createSubject("math", "Высшая математика")];

export function defaultFormula(parts: GradePart[]) {
  return parts.length ? `(${parts.map(part => part.variable).join(" + ")}) / ${parts.length}` : "";
}

// Parse arithmetic only: user formulas are never executed as JavaScript.
function evaluateFormula(source: string, variables: Map<string, number | null>): GradeResult {
  if (source.length > 500) return { value: null, error: "Формула слишком длинная (максимум 500 символов)." };
  const tokens = source.toLowerCase().replaceAll(",", ".").match(/g\d+|\d+(?:\.\d+)?|[()+*/-]|[^\s]/g) ?? [];
  let position = 0;
  let missing = false;
  function primary(): number {
    const token = tokens[position++];
    if (token === "+") return primary();
    if (token === "-") return -primary();
    if (token === "(") {
      const value = expression();
      if (tokens[position++] !== ")") throw new Error("Проверьте скобки в формуле.");
      return value;
    }
    if (token && /^g\d+$/.test(token)) {
      if (!variables.has(token)) throw new Error(`Подпункт ${token} не найден. Исправьте формулу.`);
      const value = variables.get(token);
      if (value === null) missing = true;
      return value ?? 0;
    }
    if (token && /^\d+(?:\.\d+)?$/.test(token)) return Number(token);
    throw new Error("Используйте g1, g2, числа, скобки и знаки + − * /.");
  }
  function term(): number {
    let value = primary();
    while (tokens[position] === "*" || tokens[position] === "/") {
      const operator = tokens[position++];
      const right = primary();
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
    if (position !== tokens.length) throw new Error("Проверьте формулу: между значениями нужен знак операции.");
    if (missing) return { value: null };
    if (!Number.isFinite(value)) throw new Error("Нельзя делить на ноль или получать бесконечный результат.");
    if (value < 1 || value > 10) throw new Error("Результат должен быть от 1 до 10. Проверьте формулу.");
    return { value };
  } catch (error) {
    return { value: null, error: error instanceof Error ? error.message : "Проверьте формулу." };
  }
}

export function calculateStage(stage: GradeStage): GradeResult {
  if (!stage.parts.length) return { value: null };
  const variables = new Map<string, number | null>();
  for (const part of stage.parts) {
    const text = part.grade.trim().replaceAll(",", ".");
    if (!text) { variables.set(part.variable, null); continue; }
    const grade = Number(text);
    if (!/^\d+(?:\.\d+)?$/.test(text) || !Number.isFinite(grade) || grade < 1 || grade > 10) {
      return { value: null, error: `Введите оценку от 1 до 10 для ${part.variable}.` };
    }
    variables.set(part.variable, grade);
  }
  return evaluateFormula(stage.formula.trim() || defaultFormula(stage.parts), variables);
}

export function gradeStatus(value: number | null) {
  return value === null ? "Нет оценки" : value >= 9 ? "Отлично" : value >= 7 ? "Хорошо" : value >= 5 ? "Удовлетворительно" : "Нужно подтянуть";
}

export function averageGrade(values: (number | null)[]) {
  const grades = values.filter((value): value is number => value !== null);
  return grades.length ? grades.reduce((sum, value) => sum + value, 0) / grades.length : null;
}

export function calculateOverall(subjects: GradeSubject[]) {
  const averages = subjects.map(subject => averageGrade(subject.stages.map(stage => calculateStage(stage).value)));
  return { average: averageGrade(averages), countedSubjects: averages.filter(value => value !== null).length };
}

export function isLowGrade(input: string) {
  const text = input.trim().replaceAll(",", ".");
  return /^\d+(?:\.\d+)?$/.test(text) && Number(text) >= 1 && Number(text) < 5;
}
