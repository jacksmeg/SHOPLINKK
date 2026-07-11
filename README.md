# ShopLinkk

ShopLinkk is a full-stack local marketplace for Dunkwa-on-Offin, Ghana. Buyers browse approved listings, save products, review sellers, and chat directly with sellers before purchasing. Sellers manage store profiles, verification, product listings, images, drafts, renewals, and buyer messages. Admins moderate users, sellers, products, reports, categories, towns, featured requests, staff accounts, exports, audit logs, platform rules, and encrypted provider connections.

Online payment is intentionally not included yet. The system is shaped so featured listings, subscriptions, Mobile Money, escrow, commissions, invoices, and disputes can be added later.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- PostgreSQL with Prisma 7
- NextAuth credentials auth and Google OAuth support
- bcrypt password hashing
- Zod form and API validation
- Tailwind CSS 4
- Admin-managed Google OAuth, Resend, Cloudinary, TinyPNG/Tinify, Arkesel OTP, Pusher, and monitoring connections
- Cloudinary server-signed uploads, TinyPNG/Tinify compression, and a local development fallback

## Feature Coverage

- Email/password auth, Google sign-in, forgot password, reset password, email verification
- Buyer, Seller, Admin roles with protected routes
- Profile photo upload, Ghana phone formatting, WhatsApp, location, area, bio
- Change password, phone OTP hooks, delete-account request, suspension reason display
- Seller store profile, address, opening hours, WhatsApp, trust score, verification workflow
- Product drafts, approval notes, rejection reasons, renew listing, duplicate listing, mark sold
- Multiple product images, reorder/delete controls, image count/size limits, optional video link
- Search, filters, pagination, featured/latest products, horizontal suggested-product rails, related products, SEO metadata
- Product-linked chat with Pusher private-channel realtime updates, read receipts, typing, attachments, unread counts, reporting, and blocking
- Login security alerts with account phone, IP/network, device, browser, connection type, and time details
- Browser push subscriptions for new chat messages, plus in-app notification popups and email fallback when a recipient is away
- Favorites, favorite folders API, saved searches, price-alert-ready fields, recently viewed
- Seller reviews and ratings
- Admin users, sellers, products, reports, categories, audit logs, staff invites, CSV exports
- Admin integration center with encrypted secret storage, provider tests, marketplace policies, town/area expansion, homepage advert fee approval, and campaign controls
- Report product, seller, and chat message
- Safety guide, scam warnings, no-payment-before-inspection reminders
- 404, error, loading, and maintenance pages
- Homepage sponsored-product rail with seller requests, offline fee records, admin approval, campaign dates, and payment-later design
- Google Maps town markers with device-location nearest-town sorting and a useful fallback when Maps is not configured
- Terms of Use, Privacy Policy, Platform License Agreement, and Community Rules with recorded consent versioning
- Sitemap, robots.txt, Open Graph metadata, product structured data

## Folder Structure

```txt
src/app                  Pages, layouts, route handlers, SEO routes
src/app/api              Auth, products, chat, admin, uploads, reviews, notifications
src/components           UI, auth forms, marketplace, seller, buyer, admin, account components
src/lib                  Auth, database, validation, email, storage, moderation, Ghana helpers
src/generated/prisma     Generated Prisma client
prisma/schema.prisma     Database schema
prisma/seed-production.ts Hosting-safe seed for admin, categories, towns, and areas
prisma/seed.ts           Optional demo seed for local sample buyers, sellers, stores, products, chat, reports
public/uploads           Local development upload fallback
```

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

On Windows PowerShell, copy env with:

```powershell
Copy-Item .env.example .env
```

Open `http://localhost:3004` when using the production-style local server. The development server remains available at its normal Next.js port if you need hot reload.

For production-style local testing on a phone connected to the same Wi-Fi, first build and then run:

```powershell
npm run build
npm run start:lan
```

The script prints the LAN address, for example `http://192.168.1.20:3004`. Keep the terminal open and allow the Windows Firewall prompt on Private networks. Google OAuth callbacks still need to use a registered HTTPS production URL; use the LAN address for marketplace and responsive testing.

If PostgreSQL is installed directly on Windows, make sure the PostgreSQL service is running and create the database once:

```powershell
$env:PGPASSWORD="postgres"
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -h localhost -p 5432 -U postgres shoplinkk
```

If you prefer Docker instead of a local PostgreSQL install, start the included database service before running migrations:

```bash
docker compose up -d
```

## Hosting-Safe Seed Accounts

The default seed is now production-safe. It creates only the platform admin, categories, nearby towns, and Dunkwa-on-Offin areas. It does not create demo buyers, demo sellers, demo products, demo chats, or demo reports.

For production or staging, set these before seeding:

```env
SHOPLINKK_ADMIN_EMAIL="admin@yourdomain.com"
SHOPLINKK_ADMIN_PASSWORD="use-a-long-secure-password"
```

If no admin password is provided, the seed script generates a secure random admin password and prints it once in the terminal.

For local screenshots or demos only, run:

```bash
npm run db:seed:demo
```

## Production Environment

For the full `www.shoplinkk.com` Cloudflare/Render launch checklist, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Generate a strong secret:

```bash
npm run secret
```

Required production variables:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generated-strong-secret"
INTEGRATION_ENCRYPTION_KEY="a-different-generated-strong-secret"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
SHOPLINKK_ADMIN_EMAIL="admin@your-domain.com"
SHOPLINKK_ADMIN_PASSWORD="long-secure-password"
```

Google OAuth:

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

Use callback:

```txt
https://your-domain.com/api/auth/callback/google
```

Email provider:

```env
EMAIL_FROM="ShopLinkk <no-reply@your-domain.com>"
RESEND_API_KEY="..."
```

Cloud image uploads:

```env
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
TINIFY_API_KEY="..."
```

Ghana phone verification with Arkesel OTP:

```env
ARKESEL_API_KEY="..."
ARKESEL_SENDER_ID="ShopLinkk"
```

Pusher Channels realtime chat:

```env
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="eu"
```

Browser push notifications:

```bash
npm run push:keys
```

Copy the three printed values into `.env`, or open **Admin > API connections > Browser notifications** and save them there. The browser push key is only used in a secure context (HTTPS or localhost), and each user must allow device notifications once. A push subscription stays active when the user is signed out or ShopLinkk is not open, until the browser or device revokes it.

Google Maps town browsing:

```env
GOOGLE_MAPS_API_KEY="..."
```

The key is delivered to the browser only when the admin enables Google Maps. Restrict it in Google Cloud by HTTP referrer and enable only Maps JavaScript API, Geocoding API, and the APIs required by the map experience. The admin can also store and test the key at `/admin/integrations`.

## Real Database Deployment

Use a managed PostgreSQL provider such as Neon, Supabase, Railway, Render, or a VPS PostgreSQL instance.

After setting the real `DATABASE_URL`, run:

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

For Vercel, Render, or Railway, add the same environment variables in the provider dashboard before deploying.

To remove old demo accounts, stores, products, chats, reports, and advert requests from an existing database while keeping admin users and platform settings:

```bash
npm run db:cleanup:demo
```

## Admin API Connections

After logging in as an admin, open `/admin/integrations`. Connect Google sign-in, email, media storage, TinyPNG/Tinify optimization, Arkesel OTP, optional Pusher realtime, and monitoring from one screen. Environment variables remain a safe deployment fallback, but enabled admin-managed connections take precedence.

Secret values are encrypted before storage and are never shown again. Keep `INTEGRATION_ENCRYPTION_KEY` server-only and do not change it after provider values have been saved.

## Homepage Advert Workflow

1. A seller opens Seller dashboard, chooses an approved product, and selects **Advertise**.
2. The seller submits a headline, duration, and optional campaign note.
3. Admin opens **Admin > Homepage adverts**, sets the offline fee, records a receipt/reference, and selects **Confirmed offline** or **Fee waived**.
4. Admin selects **Run advert**. The product appears in the animated sponsored rail on the homepage until its campaign end date.

No online advert payment is enabled. The public rail is labelled sponsored and still shows ShopLinkk's inspect-before-paying warning.

## UI Attribution

The shared button sheen, compact loader, and product-card depth treatment include adapted MIT-licensed UIverse patterns. Attribution and the license notice are recorded in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## Google OAuth Setup

1. Create or select a project in Google Cloud Console.
2. Configure the OAuth consent screen with your real ShopLinkk support email and domain.
3. Create a Web application OAuth client under **APIs & Services > Credentials**.
4. Add `https://your-domain.com/api/auth/callback/google` as an authorized redirect URI. Add `http://localhost:3004/api/auth/callback/google` for local production-style testing.
5. In ShopLinkk, open **Admin > API connections > Google sign-in**, add the Client ID and Client secret, enable the connection, save, and complete a normal Google sign-in as the final test.

## Pusher Realtime Setup

1. Create a **Channels** app in Pusher and select the `eu` cluster.
2. Open **App Keys** and copy the App ID, Key, Secret, and Cluster.
3. In ShopLinkk, open **Admin > API connections > Pusher realtime**, save the four values, enable it, and run **Test connection**.
4. Restart ShopLinkk after rebuilding. Open the same product chat as its buyer and seller in two separate browser sessions. A new message, typing state, and read receipt should appear immediately.

ShopLinkk authorizes only the buyer and seller of a conversation to join that conversation's private Pusher channel. The server signs channel access and Pusher credentials are never exposed to marketplace users.

## Verification

This project currently passes:

```bash
npm run lint
npx prisma validate
npm run build
```
