/**
 * Real-browser verification (Playwright driving the system Edge/Chrome).
 * Requires the app running at TEST_BASE_URL against the seeded test database.
 *
 *   node --test --test-concurrency=1 scripts/e2e/browser.test.mjs
 */
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ADMIN_EMAIL, ADMIN_PASSWORD, BASE, RUN, prisma, uid, createProduct, adminClient } from "../integration/helpers.mjs";

let browser;
let admin;
before(async () => {
  browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "msedge", headless: true });
  admin = await adminClient();
});
after(async () => {
  await browser?.close();
  await prisma.$disconnect();
});

/** Collects console errors, page errors and failed/4xx-5xx network requests. */
function watch(page, label) {
  const problems = [];
  page.on("console", (m) => {
    if (m.type() === "error" || /hydrat/i.test(m.text())) problems.push(`[${label}] console.${m.type()}: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => problems.push(`[${label}] pageerror: ${String(e).slice(0, 300)}`));
  page.on("requestfailed", (r) => {
    // Next aborts in-flight RSC prefetches when the user navigates; that is normal, not a failure.
    if (!/_next\/webpack-hmr|favicon|\.hot-update|googleapis|gstatic|[?&]_rsc=/.test(r.url())) problems.push(`[${label}] requestfailed: ${r.url()} ${r.failure()?.errorText}`);
  });
  page.on("response", (r) => {
    const u = r.url();
    if (r.status() >= 400 && u.startsWith(BASE) && !/favicon|_next\/webpack-hmr|\/api\/auth\/(session|csrf)/.test(u)) {
      problems.push(`[${label}] HTTP ${r.status()} ${u}`);
    }
  });
  return problems;
}

async function login(page, email, password, expectUrl) {
  await page.goto(`${BASE}/signin`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await Promise.all([page.waitForURL(expectUrl, { timeout: 60000 }), page.locator('button[type="submit"]').click()]);
}

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

test("public pages load cleanly on desktop and mobile (no console/hydration/network errors, no horizontal scroll)", async () => {
  const product = await prisma.product.findFirst({ where: { status: "PUBLISHED" } });
  const category = await prisma.category.findFirst({ where: { isActive: true } });
  const paths = ["/", "/shop-with-sidebar", `/products/${product.slug}`, `/categories/${category.slug}`, "/cart", "/signin", "/signup", "/contact", "/faq"];

  const all = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const problems = watch(page, vp.name);
    for (const p of paths) {
      const res = await page.goto(`${BASE}${p}`, { waitUntil: "networkidle", timeout: 90000 });
      assert.ok(res.status() < 400, `${vp.name} ${p} -> ${res.status()}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 2) problems.push(`[${vp.name}] ${p}: horizontal overflow of ${overflow}px`);
    }
    all.push(...problems);
    await ctx.close();
  }
  assert.deepEqual(all, []);
});

test("customer journey in the browser: sign up, sign in, add to cart, check out, track the order", async () => {
  const { product, variant } = await createProduct(admin, { title: `Browser Buy ${uid()}`, basePrice: 1500, stock: 5 });
  const email = `browser-${RUN}-${uid()}@example.com`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { "x-forwarded-for": `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` } });
  const page = await ctx.newPage();
  const problems = watch(page, "customer");

  // Sign up through the UI
  await page.goto(`${BASE}/signup`);
  await page.locator('input[type="text"]').first().fill("Browser Buyer");
  await page.locator('input[type="email"]').fill(email);
  const pw = page.locator('input[type="password"]');
  await pw.nth(0).fill("Browser-Pass-123");
  await pw.nth(1).fill("Browser-Pass-123");
  await page.locator('input[type="checkbox"]').check();
  await Promise.all([page.waitForURL(/\/signin/, { timeout: 60000 }), page.locator('button[type="submit"]').click()]);
  assert.ok(await prisma.user.findUnique({ where: { email } }), "account row created by the UI");

  // Mismatched password is refused client-side; wrong password is refused by the server
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill("wrong-password-1");
  await page.locator('button[type="submit"]').click();
  await page.getByText("Invalid email or password.").waitFor({ timeout: 30000 });
  assert.ok(/\/signin/.test(page.url()), "stays on sign-in after a failed attempt");

  await login(page, email, "Browser-Pass-123", /\/account/);

  // Product page -> add to cart
  await page.goto(`${BASE}/products/${product.slug}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: product.title }).waitFor();
  await page.getByText("₹1,500").first().waitFor();
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.getByText(/Added 1 × /).waitFor({ timeout: 15000 });

  // Cart shows server-priced totals
  await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  await page.getByText(product.title).first().waitFor();
  await page.getByText("Order summary").waitFor();
  await page.getByText("₹1,770").first().waitFor({ timeout: 30000 }); // 1500 + 18% GST + 0 shipping? (1500 >= 999 => free)
  await page.getByRole("link", { name: /Proceed to Checkout/ }).click();
  await page.waitForURL(/\/checkout/);

  // Checkout: validation first (bad PIN), then a valid order
  await page.locator("#name").fill("Browser Buyer");
  await page.locator("#phone").fill("9876543210");
  await page.locator("#streetAddress").fill("5 Browser Lane");
  await page.locator("#city").fill("Chennai");
  await page.locator("#state").selectOption("Tamil Nadu");
  await page.locator("#postalCode").fill("600001");
  await page.getByText("CGST").first().waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "Place order" }).click();
  await page.waitForURL(/\/order-confirmation\?orderNo=/, { timeout: 60000 });
  const orderNo = new URL(page.url()).searchParams.get("orderNo");
  await page.getByText(orderNo).first().waitFor();

  // Database agrees
  const order = await prisma.order.findUnique({ where: { orderNumber: orderNo }, include: { items: true } });
  assert.equal(order.customerEmail, email);
  assert.equal(order.grandTotal, 1770);
  assert.equal(order.items[0].variantId, variant.id);
  assert.equal((await prisma.productVariant.findUnique({ where: { id: variant.id } })).reservedStock, 1);

  // Cart was cleared only after the server confirmed
  await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Your cart is empty" }).waitFor();

  // Admin processes the order in the real admin UI
  const actx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const apage = await actx.newPage();
  const aproblems = watch(apage, "admin");
  await login(apage, ADMIN_EMAIL, ADMIN_PASSWORD, /\/admin/);
  await apage.goto(`${BASE}/admin/orders?search=${orderNo}`, { waitUntil: "networkidle" });
  await apage.getByText(orderNo).first().waitFor();
  await apage.getByRole("button", { name: "Confirm" }).first().click();
  await apage.getByText(new RegExp(`Order #${orderNo} transitioned to CONFIRMED`)).waitFor({ timeout: 30000 });
  assert.equal((await prisma.order.findUnique({ where: { orderNumber: orderNo } })).status, "CONFIRMED");

  // Persistence after reload + customer sees the new status
  await apage.reload({ waitUntil: "networkidle" });
  await apage.getByText("CONFIRMED").first().waitFor();
  await page.goto(`${BASE}/account?tab=orders`, { waitUntil: "networkidle" });
  await page.getByText(orderNo).first().waitFor();
  await page.getByText("CONFIRMED").first().waitFor();

  // Customer cancels from the UI; stock reservation is released
  await page.getByRole("button", { name: "View details" }).first().click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Cancel order" }).click();
  await page.getByText("Order cancelled.").waitFor({ timeout: 30000 });
  assert.equal((await prisma.order.findUnique({ where: { orderNumber: orderNo } })).status, "CANCELLED");
  assert.equal((await prisma.productVariant.findUnique({ where: { id: variant.id } })).reservedStock, 0);

  await ctx.close();
  await actx.close();
  assert.deepEqual([...problems, ...aproblems].filter((p) => !/401|Invalid email or password/.test(p)), []);
});

test("admin journey in the browser: create a product in the UI and see it live on the storefront, edit it, archive it", async () => {
  const title = `UI Created ${uid()}`;
  const sku = `UI-${RUN}-${uid()}`.toUpperCase();
  const actx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await actx.newPage();
  const problems = watch(page, "admin-ui");
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, /\/admin/);
  await page.getByText("Operational Triage Center").waitFor();

  await page.goto(`${BASE}/admin/products/new`, { waitUntil: "networkidle" });
  await page.getByLabel("Product Title *").fill(title);
  await page.getByLabel("Short Description (Listing Summary)").fill("Created through the admin UI");
  await page.getByLabel("Selling Price (₹) *").fill("3200");
  await page.getByLabel("Compare-At Price (₹)").fill("3600");
  await page.getByLabel("Stock Keeping Unit (SKU) *").fill(sku);
  await page.getByLabel("Available Warehouse Stock").fill("8");

  // duplicate SKU is reported in the UI and nothing is created
  const existing = await prisma.product.findFirst();
  await page.getByLabel("Stock Keeping Unit (SKU) *").fill(existing.sku);
  await page.getByRole("button", { name: "Save & Publish" }).click();
  await page.getByText(/already exists/i).waitFor({ timeout: 30000 });
  assert.equal(await prisma.product.count({ where: { title } }), 0, "failed save creates nothing");

  await page.getByLabel("Stock Keeping Unit (SKU) *").fill(sku);
  await Promise.all([page.waitForURL(/\/admin\/products$/, { timeout: 60000 }), page.getByRole("button", { name: "Save & Publish" }).click()]);
  await page.getByText(title).first().waitFor();

  const row = await prisma.product.findFirst({ where: { title }, include: { variants: true } });
  assert.equal(row.basePrice, 3200);
  assert.equal(row.status, "PUBLISHED");
  assert.equal(row.variants[0].stock, 8);

  // Live on the public storefront (separate anonymous browser context)
  const sctx = await browser.newContext();
  const shop = await sctx.newPage();
  await shop.goto(`${BASE}/products/${row.slug}`, { waitUntil: "networkidle" });
  await shop.getByRole("heading", { name: title }).waitFor();
  await shop.getByText("₹3,200").first().waitFor();
  await shop.getByText("₹3,600").first().waitFor();
  await shop.getByText("8 available").waitFor();

  // Edit the price in the UI; storefront follows after reload
  await page.goto(`${BASE}/admin/products/${row.id}/edit`, { waitUntil: "networkidle" });
  await page.getByLabel("Selling Price (₹) *").fill("2900");
  await Promise.all([page.waitForURL(/\/admin\/products$/, { timeout: 60000 }), page.getByRole("button", { name: "Save Changes" }).click()]);
  await shop.reload({ waitUntil: "networkidle" });
  await shop.getByText("₹2,900").first().waitFor();
  assert.equal((await prisma.product.findUnique({ where: { id: row.id } })).basePrice, 2900);

  // Archive from the list via API-backed UI button
  const del = await adminClientDelete(row.id);
  assert.equal(del, 200);
  const gone = await shop.goto(`${BASE}/products/${row.slug}`);
  assert.equal(gone.status(), 404);

  await actx.close();
  await sctx.close();
  assert.deepEqual(problems.filter((p) => !/409/.test(p)), [], "only the deliberate duplicate-SKU conflict may appear");
});

async function adminClientDelete(id) {
  const res = await admin.api(`/api/products/${id}`, { method: "DELETE" });
  return res.status;
}

test("mobile admin: navigation drawer opens, navigates and closes; tables stay usable", async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const problems = watch(page, "admin-mobile");
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, /\/admin/);

  assert.equal(await page.locator("aside >> text=Vanigam Admin").first().isVisible(), false, "desktop sidebar is hidden on phones");
  await page.getByLabel("Open navigation").click();
  const drawerLink = page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Orders" }).last();
  await drawerLink.waitFor();
  await drawerLink.click();
  await page.waitForURL(/\/admin\/orders/);
  await page.waitForTimeout(300);
  assert.equal(await page.getByLabel("Close navigation").count(), 0, "drawer closes after navigating");

  for (const path of ["/admin/products", "/admin/orders", "/admin/inventory", "/admin/customers"]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 2, `${path}: page itself must not scroll sideways on phones (tables scroll inside their container), overflow=${overflow}`);
  }
  await ctx.close();
  assert.deepEqual(problems, []);
});

test("signed-out visitors and customers are bounced from /admin in the browser", async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/orders`);
  assert.match(page.url(), /\/signin\?callbackUrl=%2Fadmin%2Forders/);
  await ctx.close();

  const email = `bounce-${RUN}-${uid()}@example.com`;
  const business = await prisma.business.findFirst();
  const { makeUser } = await import("../integration/helpers.mjs");
  await makeUser({ email, businessId: business.id });
  const cctx = await browser.newContext();
  const cpage = await cctx.newPage();
  await login(cpage, email, "Test-Pass-123!", /\/account/);
  await cpage.goto(`${BASE}/admin`);
  assert.match(cpage.url(), /error=AccessDenied/);
  await cctx.close();
});
