import "dotenv/config";

const required = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "INTEGRATION_ENCRYPTION_KEY",
  "NEXT_PUBLIC_APP_URL",
  "SHOPLINKK_ADMIN_EMAIL",
  "SHOPLINKK_ADMIN_PASSWORD",
];

const recommended = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "TINIFY_API_KEY",
  "ARKESEL_API_KEY",
  "ARKESEL_SENDER_ID",
  "WEB_PUSH_PUBLIC_KEY",
  "WEB_PUSH_PRIVATE_KEY",
  "WEB_PUSH_SUBJECT",
  "ADMIN_ALERT_EMAIL",
  "LOG_WEBHOOK_URL",
];

const missingRequired = required.filter((key) => !process.env[key]);
const missingRecommended = recommended.filter((key) => !process.env[key]);

if (missingRequired.length) {
  console.error(`Missing required production variables: ${missingRequired.join(", ")}`);
  process.exit(1);
}

if ((process.env.NEXTAUTH_SECRET ?? "").length < 32) {
  console.error("NEXTAUTH_SECRET must be at least 32 characters.");
  process.exit(1);
}

if ((process.env.INTEGRATION_ENCRYPTION_KEY ?? "").length < 32) {
  console.error("INTEGRATION_ENCRYPTION_KEY must be at least 32 characters.");
  process.exit(1);
}

if ((process.env.SHOPLINKK_ADMIN_PASSWORD ?? "").length < 16) {
  console.error("SHOPLINKK_ADMIN_PASSWORD must be at least 16 characters.");
  process.exit(1);
}

if (missingRecommended.length) {
  console.warn(`Recommended variables not set yet: ${missingRecommended.join(", ")}`);
}

console.log("ShopLinkk production environment check passed.");
