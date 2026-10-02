# Frontend ↔ Backend Integration Audit

Scope: the uploaded `src/app/admin` panel integrated into this Next.js 16 / Prisma / PostgreSQL project, and the public storefront it manages.
Status legend: **PASS** verified by a real API/browser request plus database evidence · **PARTIAL** · **FAIL** · **BLOCKED**.

## Architecture
- Single Next.js app (App Router). No separate backend: admin pages are server components reading Prisma; admin forms call `/api/*` route handlers; the storefront reads Prisma through `src/lib/storefront.ts`.
- Auth: NextAuth (JWT, credentials). `AuthEngine` (`src/lib/auth.ts`) re-reads the user from the DB on every request, so deactivation and role changes apply immediately. `src/proxy.ts` is the first gate for `/admin`; every API route and admin page re-checks server-side.
- Tenancy: `businessId` on users and catalogue/order records. Admin pages use `requireAdminScope()`; API routes filter by the caller's `businessId`.

## What the upload was missing (found at the start)
The uploaded admin came from a different backend. It imported modules that did not exist here (`@/lib/db`, `@/lib/auth` `AuthEngine`, `@/lib/rbac`, `lucide-react`, 7 UI components, `AdminSidebar/TopBar/NavContext`), queried ~25 Prisma models that did not exist, and called 17 API route groups that did not exist. All were built; the schema was merged into the existing `prisma/schema.prisma`.

## Route / module inventory
| Area | Admin route | Storefront counterpart | Status |
|---|---|---|---|
| Dashboard / Analytics | `/admin`, `/admin/analytics` (figures checked against DB) | – | PASS |
| Products | `/admin/products`, `/new`, `/[id]/edit` | `/products/[slug]`, `/shop-with-sidebar`, `/popular`, search | PASS |
| Categories | `/admin/categories` | header menu, `/categories/[slug]`, filters | PASS |
| Inventory | `/admin/inventory` | availability, checkout reservation | PASS |
| Orders | `/admin/orders` | `/account`, `/order-confirmation`, invoices | PASS |
| Customers | `/admin/customers`, `/[id]` | sign-in / active state | PASS |
| Vendors, payouts | `/admin/vendors` | `/stores`, `/store/[slug]`, `/onboarding` | PASS |
| B2B | `/admin/b2b` | wholesale tier pricing | PASS |
| Coupons | `/admin/coupons` | cart / checkout | PASS |
| Reviews | `/admin/reviews` | product page | PASS |
| Content / Themes | `/admin/content`, `/admin/themes` | homepage sections, CSS tokens | PASS |
| Settings | `/admin/settings` | footer contact, GST state, invoices | PASS |
| Audit / System health | `/admin/audit`, `/admin/system-health` | – | PASS |
| Online payment (Stripe) | – | `/checkout` ONLINE option, webhook | BLOCKED (needs Stripe test keys) |

Totals: 20 admin page routes, 21 storefront/customer routes, 28 API route files. 20 admin routes + 21 storefront routes + 27 API route files audited; 0 FAIL; 1 BLOCKED (Stripe).

## Mock / fixture findings
| Finding | Class | Resolution |
|---|---|---|
| Shop, product-detail and search read `mockProducts` directly; unknown slugs showed the first mock product | Defect | DB-backed via `lib/storefront.ts`; unknown/draft/archived slug → 404 |
| Data layer swallowed every DB error and returned mock products (`get-api-data/*`) | Defect | Deleted |
| Orders, finance, offers, orgs, audit, notifications held in module-level arrays seeded from fixtures, with `catch {}` fallbacks; checkout reported success with nothing saved | Defect | Layer deleted; orders are transactional in Postgres |
| Customer account showed a fixture customer to anyone | Defect (privacy) | Real orders for the signed-in user only |
| Cart coupon codes hardcoded client-side (`VANIGAM10` = $15) | Defect | Server validates coupons |
| Checkout prefilled with fake PII, USD, no payment step; every failure path showed success | Defect | Rewritten; success only after a 2xx |
| Review form, newsletter, contact, sign-up: catch → success toast, nothing stored | Defect | API routes + tables; honest errors |
| Footer placeholder address/phone/email; "Download App" `#` links | Defect | Footer reads Settings; dead block removed |
| Header "free delivery over $100" | Defect | Uses the real threshold (₹999) |
| Blog pages use `src/data/blogData.ts` | Intentional static content | Kept (no blog admin module exists) |
| Cart / wishlist in browser storage | Intentional client state | Cart is re-priced by the server at quote and checkout |

## Defects
| # | Severity | Defect | Status |
|---|---|---|---|
| 1 | Critical | `authorize()` accepted any password for `admin@vanigam.com` (SUPER_ADMIN) and created a customer session for any unknown email | Fixed |
| 2 | Critical | Every legacy server action enforced permissions only `if (callerContext)`, so anonymous callers could invoke admin actions | Removed |
| 3 | Critical | Hardcoded fallback `NEXTAUTH_SECRET` in `authOptions` and the proxy | Removed (env only) |
| 4 | Critical | Sign-in page prefilled `admin@vanigam.com` / `admin123` | Removed |
| 5 | High | Uploaded admin list pages (products, orders, dashboard, vendors, B2B, settings, themes, content) queried all tenants | Fixed; covered by tenant tests |
| 6 | High | Stripe webhook accepted unsigned JSON in dev mode; idempotency held in an in-memory Set | Signature always required |
| 7 | High | `/api/upload` unauthenticated, trusted client MIME, allowed SVG | Admin-only, magic-byte check, no SVG |
| 8 | High | Registration swallowed DB errors and returned success | Fixed |
| 9 | High | Product editor could not save any new product (default wholesale tier price 0 vs `min=1`) | Fixed |
| 10 | Medium | Settings form had no contact fields; required GSTIN blocked every save on a new store | Fixed |
| 11 | Medium | Bulk product/order actions reported success when requests failed | Fixed |
| 12 | Medium | Category pages shipped the whole catalogue to the browser | Server-filtered |
| 13 | Medium | Links to `/product/<slug>` and `/shop` (404 routes), also in default CMS CTAs | Fixed |
| 14 | Medium | Tailwind theme wipes the default palette, so the admin rendered unstyled | Palettes added |
| 15 | Low | Credentials lookup was case-sensitive after lower-casing input | Fixed |

## Single-vendor conversion
The platform is a single-vendor store. Removed: vendor/payout/sub-order/commission models and columns, `/admin/vendors`, `/api/vendors/*`, `/stores`, `/store/[slug]`, `/onboarding`, "Sold by" labels, store search and filters, marketplace commission cards, the VENDOR role, and the MULTI_VENDOR commerce mode. Settings now offer Retail (B2C), B2B or Hybrid. Orders are single orders; B2B buyer accounts and wholesale tiers remain. Covered by `scripts/integration/single-vendor.test.mjs`.
