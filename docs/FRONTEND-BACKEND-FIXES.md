# Fixes: root cause, change, regression test

Test files: `U` = `scripts/unit/commerce.test.mjs`, `S` = `scripts/integration/security.test.mjs`, `C` = `catalogue`, `O` = `orders`, `P` = `promotions-reviews`, `M` = `marketplace`, `X` = `storefront-config`, `T` = `tenant-isolation`, `A` = `admin-pages`, `B` = `scripts/e2e/browser.test.mjs`, `UI` = `scripts/e2e/admin-ui.test.mjs`.

| Defect | Root cause | Files changed | Fix | Regression test |
|---|---|---|---|---|
| Demo-account / any-password login | `authorize()` fell back to hardcoded users and auto-created customers | `lib/auth/authOptions.ts` | DB-only verification with bcrypt; same failure for unknown/disabled/wrong; case-insensitive lookup | S backdoors, S sign-in, O account |
| Unauthenticated admin server actions | Permissions checked only `if (callerContext)` | removed `actions/`, `services/`, `lib/auth/serverAuth.ts`, `rbacMatrix.ts`, `WorkspaceContext`, old `components/Admin/*View` | Layer deleted; replaced by authenticated API routes | S unauthenticated 401, S customers 403 |
| Hardcoded secret and credentials | Fallback strings in code and prefilled form | `authOptions.ts`, `proxy.ts`, `SignInView.tsx` | Env only; no defaults | B sign-in |
| `/admin` only blocked customers | Proxy allowed anonymous and vendor roles | `src/proxy.ts`, `app/admin/layout.tsx` | Anonymous → sign-in with callback; non-staff → denied; layout + APIs re-check | S redirect, S vendor, B bounce |
| Stale role / deactivated session | JWT trusted for authorization | `lib/auth.ts` | DB re-read each request | S deactivated, S role downgrade |
| Cross-tenant admin reads | Uploaded list pages had no business filter | `app/admin/{page,orders,products,products/new,products/[id]/edit,vendors,b2b,settings,content,themes,audit,system-health}`, new `lib/adminScope.ts` | `requireAdminScope()` and `businessId` filters | T pages, T by-ID |
| Storefront on fixtures | Components imported `mockProducts` | `lib/storefront.ts`, shop/product/category/store/home pages and components, `get-api-data/*` | DB queries with the visibility rule | C Workflow A/B, X no-fixture |
| Fake checkout / no persistence | In-memory orders, client-trusted prices, silent catch-success | `lib/checkout.ts`, `lib/placeOrder.ts`, `api/checkout*`, `CheckoutView`, `CartView`, order pages | Server pricing, GST, coupon; atomic stock reserve and coupon redeem in one transaction | O quote, O Workflow D, O race, P race, U totals |
| Order lifecycle | None enforced | `lib/orderService.ts`, `api/orders/*` | State machine; stock commit/release/restock; COD paid on delivery; refund flag | O lifecycle, U transitions |
| Webhook forgery | Unsigned events accepted | `api/webhook/stripe` | Signature mandatory; idempotent update | S webhook |
| Upload abuse | No auth; MIME trusted; SVG | `api/upload` | Admin only; magic bytes; SVG rejected | C upload |
| Fake success on failure | `catch → toast.success` | Newsletter, Contact, SignUp, Review, Checkout; `lib/clientApi.ts` | Success only on 2xx | X contact, B journeys |
| Registration discarded errors, role risk | Action swallowed errors | `api/auth/register` | Hash, validate, fixed role, rate limit | S registration, S rate limit |
| Editor could not save | Default tier `price 0`, `min 1` | `ProductEditorClient.tsx` | No default tier | B admin journey |
| Settings blocked / incomplete | GSTIN required; no contact inputs | `SettingsClient.tsx` | Optional GSTIN; contact fields | UI settings, X settings |
| Bulk actions false success | Responses ignored | `ProductsAdminClient`, `OrdersManagerClient`, `CouponsAdminClient` | Per-request check; partial failure reported | O bulk, UI orders |
| Category page sent full catalogue | Client-side filtering | `ShopWithSidebarContent`, `categories/[slug]/page` | Server filter; links for categories | C category page |
| 404 links | Wrong routes in admin and CMS defaults | admin clients, `lib/storefrontSections.ts` | Corrected | X link audit |
| Unstyled admin | Theme resets all colours | `app/css/style.css` | Palettes and utilities added | B admin journeys (visual) |
| Header/footer placeholders | Hardcoded | `Footer/index.tsx`, `MainHeader.tsx`, `TrustFeaturesBar.tsx`, `menuData.ts` | Settings / constants / categories | X settings, X no-fixture |

New backend: 28 API route files, `lib/{api,audit,auth,business,checkout,commerce,db,math,orderService,placeOrder,productInput,rbac,rateLimit,revalidate,safeUrl,storefront,storefrontSections,invoicePdf,clientApi,adminScope,types}.ts`, UI kit (`Badge, Modal, Input/Textarea/Select, PageHeader, DataTable`), admin shell, `prisma/seed.js`, merged `prisma/schema.prisma`.

Remaining limitations
- Stripe card flow is implemented but not run against Stripe (no keys); the failure path (cancel + release on session error) is code-reviewed only.
- Rate limiting is in-memory (per instance).
- Legacy B2B2C Prisma models (Organization, ProductOffer, MasterOrder, …) remain in the schema, unused by code; the old `Review` model was replaced by `ProductReview`, and `OrderItem` was renamed `BusinessOrderItem` to free the name.
- `db push` against your own Postgres is still required (see test report).
