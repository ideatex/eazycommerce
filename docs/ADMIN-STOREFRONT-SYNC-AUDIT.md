# Admin → Storefront synchronisation audit

## Mechanism
- All storefront pages are dynamic (`export const dynamic = "force-dynamic"` in `(site)/layout.tsx`); no stale data cache. The old `unstable_cache` wrappers were removed.
- Every admin mutation also calls `revalidateStorefront()` (`revalidatePath("/", "layout")`).
- Visibility rule (`publicProductWhere`): `status = PUBLISHED` AND (no vendor OR vendor `APPROVED`). Inactive categories 404 and leave navigation; their products stay purchasable individually (design choice).

## Expected propagation and results
All PASS: verified by an HTTP fetch of the storefront after the admin change, plus a database read.

| Admin change | Storefront effect |
|---|---|
| Create product as DRAFT | 404 on `/products/slug`; absent from list and search |
| Publish | Detail page, list, search; correct price, strike-through, availability |
| Edit title / price / description / stock / images | New values after reload; stock movement recorded |
| Archive | 404; row kept for order history |
| Category create / rename / hide | Header menu and filters follow; hidden category 404 |
| Inventory adjust | "N available", out-of-stock state, checkout refuses |
| Order placed | Stock reserved (not sold) until shipment |
| Order shipped / cancelled / returned | Stock committed / released / restocked |
| Coupon create / disable / usage limit | Quote and checkout honour it server-side |
| Review approve / hide / delete | Appears / disappears; verified-purchase flag set by server |
| Vendor suspend / reinstate | Vendor products and store page 404 / return; not orderable |
| Settings (phone, email, address) | Footer updates; clearing removes the line |
| Theme | `--color-blue` / `--color-dark` and `data-theme` in storefront HTML |
| Content sections (order, title, hide, links) | Homepage follows; `javascript:` and `//host` links neutralised |
| B2B approval | Wholesale tier pricing for that account only |

## Gaps found and fixed
- Shop, product and search read fixtures instead of the DB.
- Homepage Hero/Categories/Countdown/Promo were hardcoded electronics content unrelated to the admin Content module; the homepage now renders `StorefrontSection` rows.
- Header category menu, free-shipping banner, footer contact details and GST state were hardcoded.
- Default CMS CTAs linked to non-existent routes.

## Remaining limitations
- Uploads are written to `public/uploads`. Fine for `next dev` and a long-running self-hosted server, but a production build does not serve files added after start, and serverless hosts are read-only. Move to object storage (Cloudinary is already a dependency) before such a deployment.
- Header logo/text and SEO settings are read from `HeaderSetting` / `SeoSetting`, but the uploaded admin has no screen to edit them.
- Blog content is static (`src/data/blogData.ts`); no blog admin module exists.
- Wishlist is browser-only.

## Demo catalogue and homepage (electronics)
`node --env-file=.env prisma/seed.js --demo` loads 7 categories and 15 products using the photos bundled in `public/images` (no downloads), with variants (phone storage, watch band colour), specs, stock ledger entries, a `WELCOME10` coupon and placeholder store contact details. Homepage sections (all editable in Admin → Content): Hero, Shop by category, New arrivals, Featured collections, Top deals, Limited-time deal countdown, Wholesale notice, Why shop with us, Customer reviews (shown only when approved reviews exist). Covered by `scripts/integration/demo-home.test.mjs`.
