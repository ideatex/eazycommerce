# Test report

## Environment
- Your configured PostgreSQL (`localhost:5432`) rejects the credentials in `.env`, so it was **not used** and not modified.
- Tests ran against a disposable real PostgreSQL (embedded-postgres binary, `scripts/test-db-server.mjs`) created from `prisma/schema.prisma`, seeded with `prisma/seed.js --demo`, with the real Next.js dev server on port 3100 (`NEXT_DIST_DIR=.next-test`). Browser tests used Playwright driving system Microsoft Edge (Chromium download was unavailable).
- Not verified: your own database (schema not yet pushed there), Stripe (no keys), production build/deployment.

## Commands
```
npm run test:db                      # disposable Postgres on :54329
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54329/postgres \
SEED_ADMIN_EMAIL=admin@test.local SEED_ADMIN_PASSWORD='Adm1n-Test-Pass!' node prisma/seed.js --demo
NEXT_DIST_DIR=.next-test DATABASE_URL=... NEXTAUTH_URL=http://localhost:3100 npx next dev -p 3100
npm run test:unit
npm run test:integration
npm run test:e2e
npx tsc --noEmit
```

## Results
| Suite | Tests | Pass | Fail | Skipped |
|---|---|---|---|---|
| Unit (`scripts/unit`) | 13 | 13 | 0 | 0 |
| Integration (`scripts/integration`, 8 files) | 69 | 69 | 0 | 0 |
| Browser E2E (`scripts/e2e`: browser 5, admin-ui 10) | 15 | 15* | 0 | 0 |
| TypeScript (`tsc --noEmit`) | – | clean | – | – |

\* One browser test failed once in the full run because the integration suite had intentionally exhausted the registration rate limit for the shared local IP; it passed after giving the browser its own client IP (the limiter working as designed).

No tests are skipped.

## Workflows
| Workflow | Result | Evidence |
|---|---|---|
| A Product publishing | PASS | API + browser: draft 404 → publish → storefront price/stock match DB |
| B Product updates | PASS | edit price/title/stock/images → reload shows it; stock movement row |
| C Inventory | PASS | adjust, below-reserved refusal, out-of-stock, ledger |
| D Order lifecycle | PASS | browser: sign up → cart → checkout → admin Confirm → customer sees CONFIRMED → cancel releases stock; API: full lifecycle to REFUNDED |
| E Customer management | PASS | register/deactivate/notes persist; deactivated session rejected immediately |
| F Promotions | PASS | %/fixed/cap/min/limit/expiry; checkout reproduces quote; race-safe single-use |
| G Refunds and returns | PASS (COD flow) | return request, RETURNED restocks, REFUNDED; online refund = flag only (`REFUND_PENDING`), no gateway call |
| H Settings / theme / content | PASS | persisted, footer/CSS/homepage reflect them |
| Online payment (Stripe) | BLOCKED | needs `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`; unsigned webhook proven refused |

## Authentication, permissions, tenant isolation
- 18 admin/customer endpoints return 401 unauthenticated; customers get 403 on admin APIs and are redirected from `/admin`; vendors blocked; staff limited to day-to-day modules.
- Deactivation and role downgrade take effect without re-login.
- Second business: its admin gets 404 for 15 cross-tenant mutations by ID, sees none of tenant A's data on 8 admin pages, cannot attach A's category, theme/content/settings writes use the session business.
- Customers cannot read, cancel, return, invoice or open another customer's order.

## Defects the tests found (and that were fixed)
Cross-tenant admin list pages; category page shipping the whole catalogue; case-sensitive sign-in; product editor unable to save; settings form missing contact fields and blocked by required GSTIN; header threshold; plus the audit-time findings in the audit document.

## Remaining blockers / required configuration
1. Run `npx prisma db push` (or create a migration) and `npm run db:seed` against your own database after fixing its credentials. Set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` first; there are no default accounts. Existing rows in the old `Product`/`Category`/`AuditLog`/`Review` tables are incompatible with the merged schema (no migrations folder existed); `db push` will require resetting those tables.
2. Set a strong `NEXTAUTH_SECRET` (the hardcoded fallback is gone).
3. Stripe keys for online payments.
4. Object storage for uploads before a production/serverless deployment.
5. Stop any running `next dev` before `prisma generate` (Windows locks the engine file).
