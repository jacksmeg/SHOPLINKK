import { createCipheriv, createECDH, createHmac, createPrivateKey, createSign, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { getIntegrationConfig } from "@/lib/integration-settings";

type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  href?: string;
  tag?: string;
};

function encode(value: Buffer | Uint8Array | string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url");
}

function extract(salt: Buffer, input: Buffer) {
  return createHmac("sha256", salt).update(input).digest();
}

function expand(key: Buffer, info: Buffer, length: number) {
  const chunks: Buffer[] = [];
  let previous = Buffer.alloc(0);
  for (let index = 1; Buffer.concat(chunks).length < length; index += 1) {
    previous = createHmac("sha256", key).update(Buffer.concat([previous, info, Buffer.from([index])])).digest();
    chunks.push(previous);
  }
  return Buffer.concat(chunks).subarray(0, length);
}

function publicKeyFromPrivate(privateKeyValue: string) {
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(decode(privateKeyValue));
  return encode(ecdh.getPublicKey(null, "uncompressed"));
}

function vapidPrivateKey(privateKeyValue: string) {
  const privateBytes = decode(privateKeyValue);
  const publicBytes = decode(publicKeyFromPrivate(privateKeyValue));
  return createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: encode(publicBytes.subarray(1, 33)),
      y: encode(publicBytes.subarray(33, 65)),
      d: encode(privateBytes),
      ext: true,
    },
    format: "jwk",
  });
}

function signVapid(audience: string, subject: string, privateKeyValue: string, publicKeyValue: string) {
  const header = encode(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = encode(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 43_200, sub: subject }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign({ key: vapidPrivateKey(privateKeyValue), dsaEncoding: "ieee-p1363" });
  return { token: `${unsigned}.${encode(signature)}`, publicKey: publicKeyValue || publicKeyFromPrivate(privateKeyValue) };
}

function encryptPayload(subscription: PushSubscriptionRecord, payload: PushPayload) {
  const clientPublicKey = decode(subscription.p256dh);
  const authSecret = decode(subscription.auth);
  if (clientPublicKey.length !== 65 || authSecret.length !== 16) throw new Error("Invalid browser push subscription keys");

  const ephemeral = createECDH("prime256v1");
  ephemeral.generateKeys();
  const serverPublicKey = ephemeral.getPublicKey(null, "uncompressed");
  const sharedSecret = ephemeral.computeSecret(clientPublicKey);
  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), clientPublicKey, serverPublicKey]);
  const prkKey = extract(authSecret, sharedSecret);
  const ikm = expand(prkKey, keyInfo, 32);
  const salt = randomBytes(16);
  const contentKey = extract(salt, ikm);
  const cek = expand(contentKey, Buffer.from("Content-Encoding: aes128gcm\0"), 16);
  const nonce = expand(contentKey, Buffer.from("Content-Encoding: nonce\0"), 12);
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(`${JSON.stringify(payload)}\x02`)), cipher.final(), cipher.getAuthTag()]);
  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096);
  return Buffer.concat([salt, recordSize, Buffer.from([serverPublicKey.length]), serverPublicKey, ciphertext]);
}

export async function getWebPushPublicKey() {
  const config = await getIntegrationConfig("WEB_PUSH");
  if (!config.enabled || !config.values.privateKey) return "";
  return config.values.publicKey || publicKeyFromPrivate(config.values.privateKey);
}

async function sendOne(subscription: PushSubscriptionRecord, payload: PushPayload, config: { publicKey: string; privateKey: string; subject: string }) {
  const endpoint = new URL(subscription.endpoint);
  const vapid = signVapid(`${endpoint.protocol}//${endpoint.host}`, config.subject, config.privateKey, config.publicKey);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${vapid.token}, k=${vapid.publicKey}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
    },
    body: encryptPayload(subscription, payload),
  });

  if (!response.ok) {
    const error = new Error(`Push provider returned ${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
}

export async function deliverPushToUser(userId: string, payload: PushPayload) {
  const config = await getIntegrationConfig("WEB_PUSH");
  if (!config.enabled || !config.values.privateKey || !config.values.subject) return { delivered: 0, expired: 0 };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushNotificationsEnabled: true, pushSubscriptions: true },
  });
  if (!user?.pushNotificationsEnabled || !user.pushSubscriptions.length) return { delivered: 0, expired: 0 };

  let delivered = 0;
  let expired = 0;
  await Promise.all(user.pushSubscriptions.map(async (subscription) => {
    try {
      await sendOne(subscription, payload, {
        publicKey: config.values.publicKey || publicKeyFromPrivate(config.values.privateKey),
        privateKey: config.values.privateKey,
        subject: config.values.subject,
      });
      delivered += 1;
    } catch (error) {
      const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
      if (status === 404 || status === 410) {
        expired += 1;
        await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => null);
      }
    }
  }));

  return { delivered, expired };
}
