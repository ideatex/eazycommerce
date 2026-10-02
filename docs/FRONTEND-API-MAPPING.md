# Frontend → API → Database mapping

Auth: **A** admin/staff session (admin-only where noted) · **U** signed-in user · **P** public · **O** owner only.
Every row was exercised by `scripts/integration/*.test.mjs` (HTTP + DB assertions); ★ rows were also driven through the real UI in `scripts/e2e/*.test.mjs`.

| Page / component | Action | Endpoint | Auth | Handler | Entities | Status |
|---|---|---|---|---|---|---|
| ProductEditorClient ★ | Create / save | `POST /api/products`, `PUT /api/products/[id]` | A (products) | `api/products/*`, `lib/productInput.ts` | Product, ProductVariant, ProductImage, PriceTier, StockMovement, AuditLog | PASS |
| ProductsAdminClient ★ | Quick edit, archive, bulk | `PUT/DELETE /api/products/[id]` | A | same | Product (ARCHIVED, never deleted) | PASS |
| ProductEditorClient | Image upload | `POST /api/upload` | A | `api/upload` | `public/uploads/products` | PASS (storage limitation) |
| CategoriesAdminClient ★ | Create / edit / delete | `POST/PUT/DELETE /api/categories` | A (categories) | `api/categories` | Category | PASS |
| CouponsAdminClient ★ | Create / edit / toggle / delete | `POST/PUT/DELETE /api/coupons` | A (coupons) | `api/coupons` | Coupon | PASS |
| InventoryAdminClient ★ | Adjust stock | `POST /api/inventory/adjust` | A (inventory) | `api/inventory/adjust` | ProductVariant, StockMovement | PASS |
| OrdersManagerClient ★ | Status transitions | `POST /api/orders/[n]/status` | A (orders) | `lib/orderService.ts` | Order, OrderStatusHistory, ProductVariant, StockMovement, VendorSubOrder, CustomerProfile | PASS |
| Orders / dashboard | Invoice PDF | `GET /api/invoices/[n]` | U (owner or staff) | `api/invoices`, `lib/invoicePdf.ts` | Invoice, Order | PASS |
| CustomersClient ★ | Activate / deactivate, notes | `PATCH /api/customers/[id]` | A (customers) | `api/customers/[id]` | User, CustomerProfile | PASS |
| ReviewsAdminClient ★ | Approve / hide / delete | `PATCH/DELETE /api/admin/reviews` | A (reviews) | `api/admin/reviews` | ProductReview | PASS |
| VendorsAdminClient ★ | Onboard, commission, status | `POST/PATCH /api/vendors` | A admin-only | `api/vendors` | VendorProfile, User | PASS |
| VendorsAdminClient | Payout approve / pay / reject | `PATCH /api/vendors/payouts` | A admin-only | `api/vendors/payouts` | VendorPayout | PASS |
| B2BAdminClient | Approve, credit limit | `PATCH /api/b2b/applications` | A admin-only | `api/b2b/applications` | B2BProfile, User.role | PASS |
| SettingsClient ★ | Save settings | `PATCH /api/settings` | A admin-only | `api/settings` | Business | PASS |
| ThemeBuilderClient ★ | Save theme | `PUT /api/themes` | A admin-only | `api/themes` | ThemeConfig | PASS |
| ContentAdminClient ★ | Save layout | `PUT /api/cms/sections` | A (content) | `api/cms/sections` | StorefrontSection | PASS |
| SystemHealthClient | Refresh | `GET /api/health` | P (details: A) | `api/health` | – | PASS |
| SignUpView ★ | Register | `POST /api/auth/register` | P, rate limited | `api/auth/register` | User, CustomerProfile | PASS |
| SignInView ★ | Sign in | NextAuth credentials | P | `lib/auth/authOptions.ts` | User | PASS |
| CartView ★ | Price cart, coupon | `POST /api/checkout/quote` | P | `lib/checkout.ts` | ProductVariant, PriceTier, Coupon, Business | PASS |
| CheckoutView ★ | Place order | `POST /api/checkout` | U | `lib/placeOrder.ts` | Order, OrderItem, ProductVariant (atomic reserve), Coupon (atomic redeem), VendorSubOrder, Address, StockMovement | PASS |
| CustomerAccountHub ★ | Cancel / return request | `POST /api/orders/[n]/cancel`, `/return-request` | U, O | `api/orders/[n]/*` | Order, OrderStatusHistory | PASS |
| ProductDetailsView | Submit review | `POST /api/reviews` | U | `api/reviews` | ProductReview | PASS |
| SearchModal | Live search | `GET /api/search` | P, rate limited | `api/search` | Product, VendorProfile | PASS |
| BusinessOnboardingWizard | Vendor application | `POST /api/vendors/apply` | U | `api/vendors/apply` | VendorProfile (PENDING) | PASS |
| ContactView / NewsletterForm | Send / subscribe | `POST /api/contact`, `/api/newsletter` | P, rate limited | same | ContactMessage, NewsletterSubscriber | PASS (no admin inbox screen) |
| Stripe | Payment confirmation | `POST /api/webhook/stripe` | Signature | `api/webhook/stripe` | Order | BLOCKED (needs Stripe test keys; unsigned requests proven refused) |

Server-rendered reads (no endpoint): admin pages via `lib/adminScope.ts` (tenant-scoped Prisma); storefront via `lib/storefront.ts` (visibility: `PUBLISHED` and vendor `APPROVED` or none).
