import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertProductionEnv, getSecureCookiesEnabled } from "@/lib/env";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "OWNER" | "STAFF";
    } & DefaultSession["user"];
  }

  interface User {
    role: "OWNER" | "STAFF";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: "OWNER" | "STAFF";
  }
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

const secureCookies = getSecureCookiesEnabled();

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours
  },
  pages: {
    signIn: "/admin/login",
  },
  useSecureCookies: secureCookies,
  cookies: secureCookies
    ? {
        sessionToken: {
          name: "__Secure-auth.session-token",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true,
          },
        },
      }
    : undefined,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        // Production env check fires on first sign-in, not at module load
        // (so `next build` doesn't try to validate placeholder secrets).
        assertProductionEnv();

        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const admin = await prisma.adminUser.findUnique({
          where: { email: parsed.data.email },
        });

        if (!admin) {
          return null;
        }

        const ok = await bcrypt.compare(parsed.data.password, admin.passwordHash);
        if (!ok) {
          return null;
        }

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      assertProductionEnv();
      if (token && session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "STAFF";
      }
      return session;
    },
  },
});
