# ShopLinkk Production Layers

This runbook explains the production layers around ShopLinkk and the provider settings needed on Render, Cloudflare, and GitHub.

## 1. Application Security

Code-level protection now includes:

- Security headers in `next.config.ts`.
- Nonce-based Content Security Policy from `src/proxy.ts`.
- Strict HTTPS/HSTS in production.
- Content Security Policy for Google OAuth, Cloudflare Turnstile, Paystack, Kora, Pusher, images, media, and app APIs.
- Private route protection in `src/proxy.ts`.
- `x-request-id` on app responses for tracing.
- `x-robots-tag: noindex, nofollow` on admin and seller workspaces.
- API rate-limit headers for sensitive API routes.
- Monitoring logs scrub secrets before leaving the app.

Production `script-src` does not use `unsafe-inline` or `unsafe-eval`. Page scripts receive a per-request nonce.

Cloudflare settings to enable:

- SSL/TLS mode: Full strict.
- WAF managed rules: On.
- Bot protection: On, if available on your plan.
- Turnstile: enabled on login and account creation.
- Rate limit rules for `/api/auth/*`, `/api/uploads`, `/api/reports`, `/api/billing/*`, and `/api/chat/*`.

Recommended first Cloudflare rate limit:

- Path: `/api/auth/*`
- Threshold: 20 requests per minute per IP
- Action: Managed challenge

## 2. Caching And CDN

ShopLinkk now sends cache headers for:

- `/_next/static/*`: handled by Next.js automatically with immutable cache.
- `/brand/*`, `/pwa/*`, `/marketing/*`: public CDN cache.
- `/uploads/*`: short public cache with stale revalidation.
- `/api/*`: no-store.

Cloudflare cache rules:

- Cache static assets: `/_next/static/*`, `/brand/*`, `/pwa/*`, `/marketing/*`.
- Bypass cache: `/api/*`, `/admin*`, `/seller*`, `/buyer*`, `/account*`, `/chat*`, `/cart*`.

Enable Cloudflare:

- Brotli compression.
- HTTP/3.
- Early Hints.
- Always Use HTTPS.

## 3. Load Balancing And Scaling

Render is the first scaling layer.

Health endpoints:

- `/api/health/live`: app process is running.
- `/api/health/ready`: app and database are ready.
- `/api/health`: readiness endpoint for compatibility.

Render setup:

- Health check path: `/api/health/ready`.
- Start command: `npm run start`.
- Build command: `npm ci --include=dev && npm run db:generate && npm run build`.
- Pre-deploy command: `npm run db:deploy && npm run db:seed`.

Scaling plan:

1. Start with one paid Render instance.
2. Upgrade the Render web service plan when traffic grows.
3. Add autoscaling or multiple instances when order/chat activity increases.
4. Put Cloudflare in front for global CDN, WAF, and traffic protection.

Important:

- Keep database connection limits in mind before adding many app instances.
- Use Cloudinary/S3-style storage for uploads so multiple app instances share the same files.

## 4. Error Tracking And Logging

ShopLinkk now supports:

- Structured server logs.
- Secret redaction before sending logs out.
- Server boot logging.
- Unhandled promise rejection logging.
- Uncaught server exception logging.
- Request IDs on responses.

Admin setup:

- Go to Admin > API connections > Monitoring webhook.
- Add a webhook URL from a monitoring provider.
- Add `ADMIN_ALERT_EMAIL` and `LOG_WEBHOOK_URL` in Render if you want environment-level fallback.

Suggested monitoring providers:

- Better Stack
- Sentry
- Axiom
- Logtail
- Datadog

## 5. Availability And Disaster Recovery

Backups:

- Manual backup command: `npm run backup:db`.
- The backup creates a `.dump` file and a `.sha256` checksum.
- Old backups are cleaned using `BACKUP_RETENTION_DAYS`.

Restore:

- Restore is intentionally protected.
- Use `npm run restore:db -- -BackupFile .\backups\shoplinkk-YYYYMMDD-HHMMSS.dump -ConfirmRestore`.

Production recovery plan:

1. Keep Render PostgreSQL automatic backups enabled.
2. Run manual backups before major releases.
3. Store important backups outside the server, such as Google Drive, S3, or Cloudflare R2.
4. Test restore on a staging database before touching production.
5. Keep `.env` secrets backed up securely in a password manager.

## 6. CI/CD Pipeline

GitHub Actions now includes:

- Install dependencies.
- Generate Prisma client.
- Apply migrations to a CI PostgreSQL database.
- Run production environment shape check.
- Run lint.
- Run full production build.

Optional deploy hook:

- Add `RENDER_DEPLOY_HOOK_URL` to GitHub repository secrets.
- The deploy workflow can trigger Render after CI passes.
- If Render auto-deploy is already enabled, the CI workflow still protects the branch before deployment.

Recommended branch setup:

- Protect `main`.
- Require the ShopLinkk CI workflow to pass before merge.
- Only connect Render to the protected `main` branch.

## 7. Release Checklist

Before every major deploy:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Run `npm run check:prod`.
4. Run `npm run backup:db` for production-impacting changes.
5. Confirm `/api/health/ready` returns `ok: true`.
6. Confirm Cloudflare SSL/TLS is Full strict.
7. Confirm login, signup, product upload, food order, cart, chat, and admin approval.
