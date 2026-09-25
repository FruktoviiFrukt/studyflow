import { headers } from "next/headers";
import { Resend } from "resend";

import VerificationEmail from "@/emails/verification-email";
import PasswordResetEmail from "@/emails/password-reset-email";

// Resend's sandbox sender — works without a verified domain, but only
// delivers to the email address of the Resend account itself. Switch this
// to a verified domain address once one is set up for this project.
const FROM = "StudyFlow <onboarding@resend.dev>";

function client() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set — see .env.example for how to get one.",
    );
  }
  return new Resend(apiKey);
}

// Mirrors the request's own Host header — the same "trust the request"
// approach that replaces AUTH_TRUST_HOST in auth.ts — so emailed links
// always point back at whatever host the app was actually reached on.
async function baseUrl() {
  const list = await headers();
  const host = list.get("host");
  const proto = list.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${await baseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject: "Подтвердите email в StudyFlow",
    react: VerificationEmail({ verifyUrl }),
  });
  if (error)
    throw new Error(`Failed to send verification email: ${error.message}`);
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${await baseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
  const { error } = await client().emails.send({
    from: FROM,
    to,
    subject: "Сброс пароля StudyFlow",
    react: PasswordResetEmail({ resetUrl }),
  });
  if (error)
    throw new Error(`Failed to send password reset email: ${error.message}`);
}
