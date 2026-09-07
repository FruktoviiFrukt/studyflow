export type GradeSubject = {
  id: string;
  name: string;
  grade: number;
};

export const demoSubjects: GradeSubject[] = [
  { id: "programming", name: "Программирование", grade: 10 },
  { id: "math", name: "Высшая математика", grade: 8 },
  { id: "databases", name: "Базы данных", grade: 9 },
  { id: "networks", name: "Компьютерные сети", grade: 8 },
  { id: "english", name: "Английский язык", grade: 10 },
  { id: "physics", name: "Физика", grade: 7 },
];

export function calculateGrades(subjects: GradeSubject[]) {
  const average = subjects.length > 0
    ? subjects.reduce((sum, subject) => sum + subject.grade, 0) / subjects.length
    : null;

  return {
    average,
    subjectCount: subjects.length,
    bestGrade: subjects.length ? Math.max(...subjects.map(subject => subject.grade)) : null,
    excellentCount: subjects.filter(subject => subject.grade >= 9).length,
    status: average === null ? "Нет оценок" : average >= 9 ? "Отлично" : average >= 7 ? "Хорошо" : average >= 5 ? "Удовлетворительно" : "Нужно подтянуть",
  };
}

