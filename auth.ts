import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";

// Compared against when the email is unknown, so a failed login takes the
// same time whether or not the account exists.
const UNKNOWN_USER_HASH = bcrypt.hashSync("unknown-user-placeholder", 10);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizeEmail(email) },
        });

        const passwordMatches = await bcrypt.compare(
          password,
          user?.password ?? UNKNOWN_USER_HASH,
        );

        if (!user || !passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          group: user.group,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.group = user.group;
      }

      if (trigger === "update" && session) {
        if (typeof session.name === "string") {
          token.name = session.name;
        }

        if (typeof session.group === "string") {
          token.group = session.group;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.group = token.group;
      }

      return session;
    },
  },
});
