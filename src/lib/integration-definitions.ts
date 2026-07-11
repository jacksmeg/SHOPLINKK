export const integrationProviders = [
  "GOOGLE_OAUTH",
  "RESEND",
  "CLOUDINARY",
  "TINIFY",
  "ARKESEL",
  "PUSHER",
  "GOOGLE_MAPS",
  "WEB_PUSH",
  "MONITORING",
] as const;

export type IntegrationProviderKey = (typeof integrationProviders)[number];

export type IntegrationField = {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  help?: string;
};

export type IntegrationDefinition = {
  provider: IntegrationProviderKey;
  name: string;
  category: string;
  description: string;
  docsUrl: string;
  fields: IntegrationField[];
};

export const integrationDefinitions: IntegrationDefinition[] = [
  {
    provider: "GOOGLE_OAUTH",
    name: "Google sign-in",
    category: "Authentication",
    description: "Allow people to create and access ShopLinkk accounts with a real Google account.",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "...apps.googleusercontent.com" },
      { key: "clientSecret", label: "Client secret", placeholder: "Google client secret", secret: true },
    ],
  },
  {
    provider: "RESEND",
    name: "Resend email",
    category: "Communication",
    description: "Send verification, welcome, password reset, report, and message emails.",
    docsUrl: "https://resend.com/api-keys",
    fields: [
      { key: "from", label: "Sender", placeholder: "ShopLinkk <no-reply@yourdomain.com>" },
      { key: "apiKey", label: "API key", placeholder: "re_...", secret: true },
    ],
  },
  {
    provider: "CLOUDINARY",
    name: "Cloudinary media",
    category: "Media",
    description: "Securely store product photos, seller documents, profile images, chat attachments, and listing videos in the cloud.",
    docsUrl: "https://console.cloudinary.com/settings/api-keys",
    fields: [
      { key: "cloudName", label: "Cloud name", placeholder: "Your Cloudinary cloud name" },
      { key: "apiKey", label: "API key", placeholder: "Cloudinary API key", secret: true },
      { key: "apiSecret", label: "API secret", placeholder: "Cloudinary API secret", secret: true },
    ],
  },
  {
    provider: "TINIFY",
    name: "TinyPNG / Tinify",
    category: "Media",
    description: "Compress JPEG, PNG, WebP, and AVIF uploads before cloud storage.",
    docsUrl: "https://tinify.com/developers",
    fields: [
      { key: "apiKey", label: "API key", placeholder: "Tinify API key", secret: true },
    ],
  },
  {
    provider: "ARKESEL",
    name: "Arkesel OTP",
    category: "Authentication",
    description: "Verify Ghana phone numbers with secure one-time codes sent by SMS.",
    docsUrl: "https://developers.arkesel.com/",
    fields: [
      { key: "senderId", label: "Sender ID", placeholder: "ShopLinkk", help: "Use an approved sender name with 11 characters or fewer." },
      { key: "apiKey", label: "Main OTP API key", placeholder: "Arkesel main SMS API key", secret: true },
    ],
  },
  {
    provider: "PUSHER",
    name: "Pusher realtime",
    category: "Messaging",
    description: "Optional realtime delivery for messages, typing indicators, and unread counts beyond the built-in live stream.",
    docsUrl: "https://dashboard.pusher.com/",
    fields: [
      { key: "appId", label: "App ID", placeholder: "Pusher app ID" },
      { key: "key", label: "Public key", placeholder: "Pusher public key" },
      { key: "cluster", label: "Cluster", placeholder: "mt1" },
      { key: "secret", label: "Secret", placeholder: "Pusher secret", secret: true },
    ],
  },
  {
    provider: "GOOGLE_MAPS",
    name: "Google Maps",
    category: "Location",
    description: "Show active ShopLinkk towns, estimate distance, and help buyers browse the nearest local market.",
    docsUrl: "https://console.cloud.google.com/google/maps-apis/credentials",
    fields: [
      {
        key: "apiKey",
        label: "Browser API key",
        placeholder: "AIza...",
        secret: true,
        help: "Restrict this key to Maps JavaScript API, Geocoding API, and your approved website domains.",
      },
    ],
  },
  {
    provider: "WEB_PUSH",
    name: "Browser notifications",
    category: "Communication",
    description: "Deliver new chat alerts to a subscribed device even when ShopLinkk is not open in a tab.",
    docsUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Push_API",
    fields: [
      { key: "publicKey", label: "VAPID public key", placeholder: "Generated browser push public key" },
      { key: "privateKey", label: "VAPID private key", placeholder: "Generated browser push private key", secret: true },
      { key: "subject", label: "VAPID subject", placeholder: "mailto:hello@yourdomain.com", help: "Use a monitored email address or HTTPS contact URL." },
    ],
  },
  {
    provider: "MONITORING",
    name: "Monitoring webhook",
    category: "Operations",
    description: "Forward production errors and important platform events to your monitoring service.",
    docsUrl: "https://sentry.io/",
    fields: [
      { key: "adminEmail", label: "Admin alert email", placeholder: "admin@yourdomain.com" },
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://...", secret: true },
    ],
  },
];

export function integrationDefinition(provider: string) {
  return integrationDefinitions.find((item) => item.provider === provider);
}
