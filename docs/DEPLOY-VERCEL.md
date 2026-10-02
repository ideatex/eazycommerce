# Deploying to Vercel

## Why the SEO / "Can't reach database server" error appears
The storefront reads site settings (SEO, header, store name) from PostgreSQL on every page.
Vercel cannot reach `localhost` / `127.0.0.1`, so a `DATABASE_URL` that points at your own
machine fails with `P1001: Can't reach database server`. The first query to fail is usually the
SEO one, because the root layout runs it first. The fix is a hosted database plus the
environment variables below. The app no longer crashes or spams logs when the database is
briefly unavailable: site-wide settings are cached for 5 minutes and fall back to defaults,
but pages that list products still need the database.

## 1. Create a hosted PostgreSQL database
Neon, Supabase, Railway, Vercel Postgres or any managed Postgres works. Create a database and
copy the **pooled** connection string (Neon: "Pooled connection"; Supabase: "Transaction pooler").
Append `?sslmode=require` if it is not already there.

## 2. Create the tables and the admin account (from your computer, once)
```bash
# PowerShell
$env:DATABASE_URL = "<your hosted connection string>"
npx prisma db push
$env:SEED_ADMIN_EMAIL = "you@example.com"; $env:SEED_ADMIN_PASSWORD = "a-strong-password"
node prisma/seed.js            # add --demo for the sample electronics catalogue
```
`prisma db push` is not run during the Vercel build on purpose, so a deploy can never alter your data.

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)
| Variable | Value |
|---|---|
| `DATABASE_URL` | hosted, pooled connection string from step 1 |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://<your-domain>` |
| `NEXT_PUBLIC_SITE_URL`, `SITE_URL` | same as `NEXTAUTH_URL` |
| `CLOUDINARY_URL` | from your Cloudinary dashboard (needed for admin image uploads) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | optional; online card payments |

Without `CLOUDINARY_URL` the admin image upload returns a clear message ("set CLOUDINARY_URL or paste
an image URL") because Vercel's filesystem is read-only. Pasting image URLs always works.
Uploads are limited by Vercel's 4.5 MB request size.

## 4. Deploy
Import the repository in Vercel. Framework: Next.js. The default build command (`npm run build`:
`prisma generate && next build`, then `next-sitemap`) and install command work unchanged.
After the first deploy, sign in at `/signin` with the seeded admin and open `/admin`.

If you use Stripe, add a webhook endpoint `https://<your-domain>/api/webhook/stripe` for
`checkout.session.completed`, `checkout.session.expired` and the async payment events, and put its
signing secret in `STRIPE_WEBHOOK_SECRET`.

## Troubleshooting
- `[database] DATABASE_URL is missing or points at localhost` in the Vercel logs: step 3.
- `P1001 Can't reach database server`: wrong host, database paused (Neon/Supabase free tiers sleep), or a firewall/IP allow-list; use the provider's pooled URL.
- `P2021 table does not exist`: run step 2 against the same database.
- `too many connections`: use the pooled URL; the app already limits itself to one connection per function instance.
- Sign-in loops or "invalid callback": `NEXTAUTH_URL` must exactly match the deployed URL.
