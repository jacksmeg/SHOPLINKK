import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { formatGhanaPhone } from "@/lib/ghana";
import { getIntegrationConfig } from "@/lib/integration-settings";
import { getPlatformConfig } from "@/lib/platform-settings";
import { TERMS_VERSION } from "@/lib/legal";

function createAuthOptions(google?: { clientId: string; clientSecret: string }): NextAuthOptions {
  return {
  adapter: PrismaAdapter(prisma as never),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(google?.clientId && google?.clientSecret
      ? [
          GoogleProvider({
            clientId: google.clientId,
            clientSecret: google.clientSecret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        password: { label: "Password", type: "password" },
        termsAccepted: { label: "Legal agreement accepted", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const identifier = parsed.data.identifier.trim();
        const user = identifier.includes("@")
          ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
          : await prisma.user.findUnique({ where: { phone: formatGhanaPhone(identifier) } });

        const platform = await getPlatformConfig();
        if (!user?.passwordHash || user.isBlocked || (platform.requireEmailVerification && !user.emailVerified)) {
          return null;
        }

        const validPassword = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );

        if (!validPassword) {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          phone: user.phone,
          location: user.location,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return true;
      }

      const existing = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { id: true, isBlocked: true },
      });

      if (existing && !existing.isBlocked) {
        await prisma.user.update({ where: { id: existing.id }, data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION } });
      }

      return !existing?.isBlocked;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "BUYER";
        token.phone = user.phone;
        token.location = user.location;
      }

      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: {
            id: true,
            role: true,
            phone: true,
            location: true,
            image: true,
            name: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.phone = dbUser.phone;
          token.location = dbUser.location;
          token.picture = dbUser.image;
          token.name = dbUser.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = token.role ?? "BUYER";
        session.user.phone = token.phone;
        session.user.location = token.location;
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await prisma.user.update({ where: { id: user.id }, data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION } });
    },
  },
  };
}

export const authOptions = createAuthOptions(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }
    : undefined,
);

export async function getAuthOptions() {
  const google = await getIntegrationConfig("GOOGLE_OAUTH");
  return createAuthOptions(
    google.enabled
      ? { clientId: google.values.clientId, clientSecret: google.values.clientSecret }
      : undefined,
  );
}

export async function isGoogleAuthEnabled() {
  const google = await getIntegrationConfig("GOOGLE_OAUTH");
  return google.enabled;
}
