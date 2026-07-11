import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { IntegrationStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { integrationDefinition, type IntegrationProviderKey } from "@/lib/integration-definitions";

type ProviderValues = Record<string, string>;

const secretMask = "********";

const envValues: Record<IntegrationProviderKey, ProviderValues> = {
  GOOGLE_OAUTH: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },
  RESEND: {
    from: process.env.EMAIL_FROM ?? "",
    apiKey: process.env.RESEND_API_KEY ?? "",
  },
  CLOUDINARY: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
  TINIFY: { apiKey: process.env.TINIFY_API_KEY ?? "" },
  ARKESEL: {
    senderId: process.env.ARKESEL_SENDER_ID ?? "ShopLinkk",
    apiKey: process.env.ARKESEL_API_KEY ?? "",
  },
  PUSHER: {
    appId: process.env.PUSHER_APP_ID ?? "",
    key: process.env.PUSHER_KEY ?? process.env.NEXT_PUBLIC_PUSHER_KEY ?? "",
    secret: process.env.PUSHER_SECRET ?? "",
    cluster: process.env.PUSHER_CLUSTER ?? process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "",
  },
  GOOGLE_MAPS: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  },
  WEB_PUSH: {
    publicKey: process.env.WEB_PUSH_PUBLIC_KEY ?? "",
    privateKey: process.env.WEB_PUSH_PRIVATE_KEY ?? "",
    subject: process.env.WEB_PUSH_SUBJECT ?? "mailto:hello@shoplinkk.com",
  },
  MONITORING: {
    adminEmail: process.env.ADMIN_ALERT_EMAIL ?? "",
    webhookUrl: process.env.LOG_WEBHOOK_URL ?? "",
  },
};

function encryptionKey() {
  const source = process.env.INTEGRATION_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!source) throw new Error("INTEGRATION_ENCRYPTION_KEY is not configured");
  return createHash("sha256").update(source).digest();
}

function encrypt(values: ProviderValues) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(values), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

function decrypt(value?: string | null): ProviderValues {
  if (!value) return {};
  try {
    const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")) as ProviderValues;
  } catch {
    return {};
  }
}

function jsonValues(value: Prisma.JsonValue | null | undefined): ProviderValues {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

export async function getIntegrationConfig(provider: IntegrationProviderKey) {
  const definition = integrationDefinition(provider);
  const saved = await prisma.integrationSetting.findUnique({ where: { provider } }).catch(() => null);
  const publicConfig = jsonValues(saved?.publicConfig);
  const secrets = decrypt(saved?.encryptedSecrets);
  const values = { ...envValues[provider], ...publicConfig, ...secrets };
  const configured = Boolean(definition?.fields.every((field) => values[field.key]?.trim()));
  const hasSavedSetting = Boolean(saved);

  return {
    provider,
    values,
    configured,
    enabled: hasSavedSetting ? Boolean(saved?.enabled && configured) : configured,
    status: saved?.status ?? (configured ? "CONFIGURED" : "NOT_CONFIGURED"),
    lastTestedAt: saved?.lastTestedAt ?? null,
    lastTestMessage: saved?.lastTestMessage ?? null,
    source: hasSavedSetting ? "admin" : configured ? "environment" : "none",
  };
}

export async function getIntegrationSummaries() {
  return Promise.all(
    (Object.keys(envValues) as IntegrationProviderKey[]).map(async (provider) => {
      const definition = integrationDefinition(provider)!;
      const config = await getIntegrationConfig(provider);
      const secretKeys = new Set(definition.fields.filter((field) => field.secret).map((field) => field.key));
      return {
        ...config,
        values: Object.fromEntries(
          definition.fields.map((field) => [field.key, secretKeys.has(field.key) && config.values[field.key] ? secretMask : config.values[field.key] ?? ""]),
        ),
      };
    }),
  );
}

export async function saveIntegrationSetting({
  provider,
  values,
  enabled,
  updatedById,
}: {
  provider: IntegrationProviderKey;
  values: ProviderValues;
  enabled: boolean;
  updatedById: string;
}) {
  const definition = integrationDefinition(provider);
  if (!definition) throw new Error("Unknown integration provider");
  const current = await prisma.integrationSetting.findUnique({ where: { provider } });
  const previousSecrets = decrypt(current?.encryptedSecrets);
  const publicConfig: ProviderValues = {};
  const secrets: ProviderValues = { ...previousSecrets };

  for (const field of definition.fields) {
    const value = String(values[field.key] ?? "").trim();
    if (field.secret) {
      if (value && value !== secretMask) secrets[field.key] = value;
    } else {
      publicConfig[field.key] = value;
    }
  }

  const completeValues = { ...envValues[provider], ...publicConfig, ...secrets };
  const configured = definition.fields.every((field) => Boolean(completeValues[field.key]?.trim()));

  return prisma.integrationSetting.upsert({
    where: { provider },
    update: {
      enabled: enabled && configured,
      publicConfig,
      encryptedSecrets: Object.keys(secrets).length ? encrypt(secrets) : null,
      status: configured ? "CONFIGURED" : "NOT_CONFIGURED",
      updatedById,
    },
    create: {
      provider,
      enabled: enabled && configured,
      publicConfig,
      encryptedSecrets: Object.keys(secrets).length ? encrypt(secrets) : null,
      status: configured ? "CONFIGURED" : "NOT_CONFIGURED",
      updatedById,
    },
  });
}

export async function updateIntegrationTest(provider: IntegrationProviderKey, status: IntegrationStatus, message: string) {
  return prisma.integrationSetting.upsert({
    where: { provider },
    update: { status, lastTestedAt: new Date(), lastTestMessage: message },
    create: { provider, status, lastTestedAt: new Date(), lastTestMessage: message },
  });
}
