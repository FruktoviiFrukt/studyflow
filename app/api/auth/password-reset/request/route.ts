import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/server/email";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
// Identical regardless of whether the email is registered — a different
// response would let an attacker enumerate which emails have accounts.
const GENERIC_MESSAGE =
  "Если такой email зарегистрирован, мы отправили ссылку для сброса пароля.";

export async function POST(request: Request) {
  const body = await request.json();
  const { email } = body as { email?: unknown };

  if (typeof email !== "string" || !email) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });
    await sendPasswordResetEmail(user.email, token);
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
