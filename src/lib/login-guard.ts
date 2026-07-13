import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

function guardIdentifier(identifier: string) {
  return `login-guard:${identifier.trim().toLowerCase()}`;
}

export async function createLoginGuard(identifier: string) {
  const key = guardIdentifier(identifier);
  const token = randomUUID();
  await prisma.verificationToken.deleteMany({ where: { identifier: key } });
  await prisma.verificationToken.create({
    data: {
      identifier: key,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 5),
    },
  });
  return token;
}

export async function consumeLoginGuard(identifier: string, token: unknown) {
  const value = typeof token === "string" ? token.trim() : "";
  if (!value) return false;
  const key = guardIdentifier(identifier);
  const guard = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: key,
        token: value,
      },
    },
  });

  if (!guard || guard.expires < new Date()) {
    if (guard) await prisma.verificationToken.delete({ where: { identifier_token: { identifier: key, token: value } } }).catch(() => null);
    return false;
  }

  await prisma.verificationToken.delete({ where: { identifier_token: { identifier: key, token: value } } });
  return true;
}
