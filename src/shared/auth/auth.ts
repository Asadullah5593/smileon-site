import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { prisma } from "@/shared/db/prisma";
import { verifyPassword } from "@/shared/auth/password";
import { clientKey, rateLimit } from "@/shared/api/rate-limit";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      permissionsVersion: number;
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Credentials sign-in requires JWT sessions; the adapter is still used for
  // the user records themselves.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        // Throttle password guessing per client. Returning null rather than
        // letting the error escape keeps the response identical to a wrong
        // password, so a blocked attacker learns nothing from the difference.
        try {
          rateLimit(clientKey(request, "login"), 10, 5 * 60_000);
        } catch {
          console.warn("[auth] login rate limit hit");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        // Deactivated accounts and OAuth-only accounts have no usable password.
        if (!user?.passwordHash || !user.isActive) return null;

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          permissionsVersion: user.permissionsVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        token.permissionsVersion =
          (user as { permissionsVersion?: number }).permissionsVersion ?? 0;
      }
      if (trigger === "update" && token.sub) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { permissionsVersion: true, isActive: true, name: true },
        });
        if (!fresh?.isActive) return null;
        token.permissionsVersion = fresh.permissionsVersion;
        token.name = fresh.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.permissionsVersion = Number(token.permissionsVersion ?? 0);
      return session;
    },
  },
});
