# ShopLinkk Production Deployment On Render

This guide uses Render for the Next.js app, Render PostgreSQL for the database, and Cloudflare DNS for `shoplinkk.com`.

## 1. Push Source To GitHub

```powershell
cd "C:\Users\JACKSTUDIOS\Documents\Codex\2026-07-09\create-a-complete-full-stack-marketplace\outputs\shoplinkk"
git push -u origin main
```

## 2. Create The Render Blueprint

1. Open Render.
2. Choose **New > Blueprint**.
3. Connect the GitHub repo `jacksmeg/SHOPLINKK`.
4. Render will read `render.yaml` and create:
   - `shoplinkk-web`
   - `shoplinkk-postgres` on Render's current `basic-256mb` database plan
   - the `www.shoplinkk.com` custom domain entry

The included Render settings are:

```txt
Build command: npm ci --include=dev && npm run db:generate && npm run build
Pre-deploy command: npm run db:deploy
Start command: npm run start
Health check: /api/health
Region: Frankfurt
```

## 3. Required Render Environment Values

Render will create `DATABASE_URL`, `NEXTAUTH_SECRET`, and `INTEGRATION_ENCRYPTION_KEY` from the blueprint. Add these two values before the first deploy:

```env
SHOPLINKK_ADMIN_EMAIL="your-real-admin-email"
SHOPLINKK_ADMIN_PASSWORD="a-long-secure-admin-password"
```

Add these provider values when ready, or save them later from **Admin > API connections**:

```env
EMAIL_FROM="ShopLinkk <hello@mail.shoplinkk.com>"
RESEND_API_KEY="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
ARKESEL_API_KEY="..."
ARKESEL_SENDER_ID="ShopLinkk"
HUBTEL_API_ID="..."
HUBTEL_API_KEY="..."
HUBTEL_MERCHANT_ACCOUNT_NUMBER="..."
HUBTEL_WEBHOOK_TOKEN="..."
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="..."
GOOGLE_MAPS_API_KEY="..."
WEB_PUSH_PUBLIC_KEY="..."
WEB_PUSH_PRIVATE_KEY="..."
WEB_PUSH_SUBJECT="mailto:hello@shoplinkk.com"
CLOUDFLARE_TURNSTILE_SITE_KEY="..."
CLOUDFLARE_TURNSTILE_SECRET_KEY="..."
```

If you are not using the Render blueprint, generate secrets locally:

```powershell
npm run secret
npm run secret
npm run push:keys
```

Use the two secret outputs for `NEXTAUTH_SECRET` and `INTEGRATION_ENCRYPTION_KEY`. Use the three push-key outputs for browser notifications.

## 4. Cloudflare DNS For www.shoplinkk.com

In Render, open `shoplinkk-web > Settings > Custom Domains` and confirm these domains exist:

```txt
www.shoplinkk.com
shoplinkk.com
```

Copy your Render service subdomain, for example:

```txt
shoplinkk-web.onrender.com
```

In Cloudflare DNS, remove old `AAAA` records for this domain and add:

```txt
Type    Name   Target
CNAME   www    your-render-service.onrender.com
CNAME   @      your-render-service.onrender.com
```

Set Proxy status to **DNS only** first while Render verifies the domain and creates SSL certificates. After Render shows the certificates as issued and the site opens correctly, you may turn the orange cloud proxy back on if desired.

In Cloudflare SSL/TLS:

```txt
SSL/TLS mode: Full
Always Use HTTPS: On
Automatic HTTPS Rewrites: On
```

Do not delete existing Resend/MX/TXT email records for `mail.shoplinkk.com`.

## 5. Production Database Setup

Render runs migrations automatically before the app starts. After the first successful deploy, seed the production database once from the Render shell:

```bash
npm run db:seed
```

Do not run demo seed online:

```txt
Do not run: npm run db:seed:demo
```

## 6. Provider Callback URLs

Google OAuth redirect URI:

```txt
https://www.shoplinkk.com/api/auth/callback/google
```

Hubtel payment callback URL:

```txt
https://www.shoplinkk.com/api/payments/hubtel/webhook?token=YOUR_HUBTEL_WEBHOOK_TOKEN
```

Email verification and password reset links use:

```txt
https://www.shoplinkk.com
```

## 7. Final Checks

Open:

```txt
https://www.shoplinkk.com/api/health
https://www.shoplinkk.com
https://www.shoplinkk.com/login
https://www.shoplinkk.com/admin
```

Cloudflare Turnstile domains:

```txt
www.shoplinkk.com
localhost
```

Then create one buyer account and one seller account with real emails, verify both, and test chat.

## 8. Production Layers

The app includes production security headers, CDN cache headers, readiness/liveness checks, structured logging hooks, backup/restore scripts, and GitHub Actions CI/CD workflows.

Read the full runbook:

```txt
docs/production-layers.md
```
