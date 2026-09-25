import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

const ADMIN_EMAIL = "admin@utm.md";
const ADMIN_NAME = "Admin";
const DEV_DEFAULT_PASSWORD = "admin123";

const FACULTY_SUBJECTS = [
  { name: "Математический анализ", code: "MATH101", faculty: "FCIM" },
  { name: "Линейная алгебра и геометрия", code: "MATH102", faculty: "FCIM" },
  { name: "Дискретная математика", code: "MATH201", faculty: "FCIM" },
  {
    name: "Теория вероятностей и математическая статистика",
    code: "MATH301",
    faculty: "FCIM",
  },
  {
    name: "Объектно-ориентированное программирование",
    code: "OOP201",
    faculty: "FCIM",
  },
  { name: "Алгоритмы и структуры данных", code: "CS202", faculty: "FCIM" },
  { name: "Базы данных", code: "DB301", faculty: "FCIM" },
  { name: "Компьютерные сети", code: "NET301", faculty: "FCIM" },
  { name: "Операционные системы", code: "OS301", faculty: "FCIM" },
  { name: "Web-программирование", code: "WEB301", faculty: "FCIM" },
  { name: "Архитектура компьютеров", code: "ARCH201", faculty: "FCIM" },
  {
    name: "Теория автоматов и формальных языков",
    code: "TAFL301",
    faculty: "FCIM",
  },
  { name: "Программная инженерия", code: "SE401", faculty: "FCIM" },
  { name: "Информационная безопасность", code: "SEC401", faculty: "FCIM" },
  { name: "Искусственный интеллект", code: "AI401", faculty: "FCIM" },
  { name: "Английский язык", code: "ENG101", faculty: "FCIM" },
  { name: "Физика", code: "PHYS101", faculty: "FCIM" },
];

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? DEV_DEFAULT_PASSWORD;
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      password: hashedPassword,
      role: "ADMIN",
      // Seeded, not registered through the app — skip email verification.
      emailVerified: new Date(),
    },
  });
  console.log(`Seeded admin user: ${ADMIN_EMAIL}`);

  for (const subject of FACULTY_SUBJECTS) {
    await prisma.facultySubject.upsert({
      where: { code: subject.code },
      update: { name: subject.name, faculty: subject.faculty },
      create: subject,
    });
  }
  console.log(`Seeded ${FACULTY_SUBJECTS.length} faculty subjects`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
