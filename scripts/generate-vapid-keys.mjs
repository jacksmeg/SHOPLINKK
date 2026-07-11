import { createECDH } from "node:crypto";

const ecdh = createECDH("prime256v1");
ecdh.generateKeys();

console.log(`WEB_PUSH_PUBLIC_KEY="${ecdh.getPublicKey(null, "uncompressed").toString("base64url")}"`);
console.log(`WEB_PUSH_PRIVATE_KEY="${ecdh.getPrivateKey().toString("base64url")}"`);
console.log('WEB_PUSH_SUBJECT="mailto:hello@shoplinkk.com"');
