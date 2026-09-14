import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

const ADMIN_EMAIL = "admin@utm.md";
const ADMIN_NAME = "Admin";
const DEV_DEFAULT_PASSWORD = "admin123";

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
    },
  });

  console.log(`Seeded admin user: ${ADMIN_EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
