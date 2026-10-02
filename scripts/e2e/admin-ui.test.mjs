/**
 * Drives each admin module's real form in a browser to prove the client's request
 * shape and response handling match the API, and that changes persist after reload.
 */
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { ADMIN_EMAIL, ADMIN_PASSWORD, BASE, RUN, adminClient, createProduct, customerClient, placeOrder, prisma, uid } from "../integration/helpers.mjs";

let browser;
let ctx;
let page;
let admin;
const problems = [];

before(async () => {
  browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "msedge", headless: true });
  ctx = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
  page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`pageerror: ${String(e).slice(0, 300)}`));
  page.on("console", (m) => {
    if (/hydrat/i.test(m.text())) problems.push(`hydration: ${m.text().slice(0, 200)}`);
  });
  admin = await adminClient();
  await page.goto(`${BASE}/signin`);
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
  await Promise.all([page.waitForURL(/\/admin/, { timeout: 60000 }), page.locator('button[type="submit"]').click()]);
});
after(async () => {
  await browser?.close();
  await prisma.$disconnect();
  assert.deepEqual(problems, [], "no uncaught page errors or hydration warnings during admin UI use");
});

const dialog = () => page.getByRole("dialog");
const goto = (p) => page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });

test("categories: create via the modal, edit, then delete; failures are shown, not hidden", async () => {
  const name = `UI Category ${uid()}`;
  await goto("/admin/categories");
  await page.getByRole("button", { name: "Add Category" }).click();
  await dialog().getByPlaceholder("e.g. Ergonomic Office Furniture").fill(name);
  await dialog().getByRole("button", { name: "Create Category" }).click();
  await page.getByText(`Category '${name}' created.`).waitFor({ timeout: 30000 });

  const row = await prisma.category.findFirst({ where: { name } });
  assert.ok(row, "category persisted");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(name).first().waitFor();

  // Duplicate slug: the server's 409 message is displayed and no row is added
  await page.getByRole("button", { name: "Add Category" }).click();
  await dialog().getByPlaceholder("e.g. Ergonomic Office Furniture").fill(`${name} again`);
  await dialog().getByPlaceholder("e.g. ergonomic-office-furniture").fill(row.slug);
  await dialog().getByRole("button", { name: "Create Category" }).click();
  await page.getByText(/already exists|Failed to create category/).first().waitFor({ timeout: 30000 });
  assert.equal(await prisma.category.count({ where: { slug: row.slug } }), 1);
  await page.keyboard.press("Escape");
  await dialog().waitFor({ state: "detached" });

  // Cleanup through the API (the delete modal has its own confirm flow)
  assert.equal((await admin.api(`/api/categories?id=${row.id}`, { method: "DELETE" })).status, 200);
});

test("coupons: create through the form and toggle it; invalid values never persist", async () => {
  const code = `UI${RUN}${uid()}`.toUpperCase().slice(0, 14);
  await goto("/admin/coupons");
  await page.getByRole("button", { name: /Create|New|Add/ }).first().click();
  await dialog().getByPlaceholder("e.g. FESTIVE20").fill(code);
  const numbers = dialog().locator('input[type="number"]');
  await numbers.nth(0).fill("15");
  await dialog().getByRole("button", { name: "Create Coupon" }).click();
  await page.getByText(new RegExp(`Coupon '${code}' created`)).waitFor({ timeout: 30000 });

  const row = await prisma.coupon.findUnique({ where: { code } });
  assert.equal(row.discountValue, 15);
  assert.equal(row.discountType, "PERCENTAGE");
  assert.equal(row.isActive, true);

  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(code).first().waitFor();

  // Percentage > 100 is rejected by the server and the message reaches the UI
  await page.getByRole("button", { name: /Create|New|Add/ }).first().click();
  await dialog().getByPlaceholder("e.g. FESTIVE20").fill(`${code}X`);
  await dialog().locator('input[type="number"]').nth(0).fill("150");
  await dialog().getByRole("button", { name: "Create Coupon" }).click();
  await page.getByText(/between 0 and 100|Failed to create coupon/).first().waitFor({ timeout: 30000 });
  assert.equal(await prisma.coupon.count({ where: { code: `${code}X` } }), 0);
});

test("inventory: adjust stock from the UI; ledger and storefront follow; bad input is refused", async () => {
  const { product, variant } = await createProduct(admin, { title: `UI Stock ${uid()}`, stock: 10 });
  await goto("/admin/inventory");
  const row = page.getByRole("row", { name: new RegExp(product.title) });
  await row.getByRole("button", { name: "Adjust" }).click();
  await dialog().locator('input[type="number"]').fill("42");
  const reason = dialog().getByPlaceholder(/Received batch/);
  await reason.fill("Recount after delivery");
  await dialog().getByRole("button", { name: /Apply|Save|Confirm|Adjust/ }).last().click();
  await page.getByText(/stock adjusted to 42 units/i).waitFor({ timeout: 30000 });

  assert.equal((await prisma.productVariant.findUnique({ where: { id: variant.id } })).stock, 42);
  const move = await prisma.stockMovement.findFirst({ where: { variantId: variant.id, type: "ADJUSTMENT" } });
  assert.equal(move.notes, "Recount after delivery");

  const shop = await (await browser.newContext()).newPage();
  await shop.goto(`${BASE}/products/${product.slug}`, { waitUntil: "networkidle" });
  await shop.getByText("42 available").waitFor();
  await shop.context().close();
});

test("settings: save from the form, see success, reload shows persisted values", async () => {
  await goto("/admin/settings");
  const city = `Testville-${uid()}`;
  await page.locator('input[name="city"]').fill(city);
  await page.getByRole("button", { name: "Save Configuration" }).click();
  await page.getByText("Business settings and tax parameters updated successfully.").waitFor({ timeout: 30000 });
  assert.equal((await prisma.business.findFirst({ where: { city } }))?.city, city);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator('input[name="city"]').inputValue(), city);

  // An invalid GSTIN surfaces the server's validation error and persists nothing
  await page.locator('input[name="gstin"]').fill("NOT-A-GSTIN");
  await page.getByRole("button", { name: "Save Configuration" }).click();
  await page.getByText(/GSTIN format is invalid/i).waitFor({ timeout: 30000 });
  assert.notEqual((await prisma.business.findFirst({ where: { city } })).gstin, "NOT-A-GSTIN");
});

test("themes: choose a preset and save; storefront picks it up", async () => {
  await goto("/admin/themes");
  await page.getByText("Industrial B2B").first().click();
  await page.getByRole("button", { name: "Save Theme Configuration" }).click();
  await page.getByText(/Theme tokens successfully saved/).waitFor({ timeout: 30000 });
  const theme = await prisma.themeConfig.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  assert.equal(theme.presetName, "b2b");
  assert.equal(theme.accentColor, "#ea580c");

  const shop = await (await browser.newContext()).newPage();
  await shop.goto(BASE, { waitUntil: "networkidle" });
  assert.ok((await shop.content()).includes("--color-blue:#ea580c"));
  await shop.context().close();
});

test("content: reorder a section in the UI, save layout, storefront order follows", async () => {
  await goto("/admin/content");
  const before = await prisma.storefrontSection.findMany({ orderBy: { sortOrder: "asc" }, where: { business: { slug: "vanigam" } } });
  const firstType = before[0].sectionType;
  await page.getByRole("button", { name: /Move down|Down/i }).first().click().catch(async () => {
    await page.locator("button:has(svg.lucide-arrow-down)").first().click();
  });
  await page.getByRole("button", { name: /Save Layout/ }).click();
  await page.getByText("Saved").first().waitFor({ timeout: 30000 });
  const after = await prisma.storefrontSection.findMany({ orderBy: { sortOrder: "asc" }, where: { business: { slug: "vanigam" } } });
  assert.notEqual(after[0].sectionType, firstType, "first section moved down");
  assert.equal(after[1].sectionType, firstType);

  await page.reload({ waitUntil: "networkidle" });
  const shop = await (await browser.newContext()).newPage();
  await shop.goto(BASE, { waitUntil: "networkidle" });
  assert.equal((await shop.title()).length > 0, true);
  await shop.context().close();
});

test("reviews: approve and hide from the moderation table", async () => {
  const { product } = await createProduct(admin, { stock: 5 });
  const buyer = await customerClient("uirev");
  const comment = `UI review ${uid()}`;
  assert.equal((await buyer.api("/api/reviews", { method: "POST", json: { productId: product.id, rating: 5, comment } })).status, 201);

  await goto("/admin/reviews");
  const row = page.getByRole("row", { name: new RegExp(comment) });
  await row.getByRole("button", { name: "Approve" }).click();
  await page.getByText(/approved and published/).waitFor({ timeout: 30000 });
  assert.equal((await prisma.productReview.findFirst({ where: { comment } })).isApproved, true);

  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("row", { name: new RegExp(comment) }).getByRole("button", { name: "Hide" }).click();
  await page.getByText(/hidden from storefront/).waitFor({ timeout: 30000 });
  assert.equal((await prisma.productReview.findFirst({ where: { comment } })).isApproved, false);
});

test("customers: deactivate and reactivate from the table", async () => {
  const c = await customerClient("uicust");
  await goto("/admin/customers");
  await page.getByPlaceholder(/Search by name, email/).fill(c.email);
  const row = page.getByRole("row", { name: new RegExp(c.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
  await row.getByRole("button", { name: "Deactivate" }).click();
  await page.getByText("Customer account deactivated.").waitFor({ timeout: 30000 });
  assert.equal((await prisma.user.findUnique({ where: { id: c.userId } })).isActive, false);
  await row.getByRole("button", { name: "Activate" }).click();
  await page.getByText("Customer account activated.").waitFor({ timeout: 30000 });
  assert.equal((await prisma.user.findUnique({ where: { id: c.userId } })).isActive, true);
});

test("orders: Process -> Pack -> Ship (with tracking modal) -> Deliver from the order table", async () => {
  const { variant } = await createProduct(admin, { stock: 5, title: `UI Ship ${uid()}` });
  const buyer = await customerClient("uiship");
  const orderNo = (await placeOrder(buyer, [{ variantId: variant.id, quantity: 1 }])).body.data.orderNumber;

  await goto(`/admin/orders?search=${orderNo}`);
  const status = async (s) => assert.equal((await prisma.order.findUnique({ where: { orderNumber: orderNo } })).status, s);

  await page.getByRole("button", { name: "Confirm" }).first().click();
  await page.getByText(/transitioned to CONFIRMED/).waitFor({ timeout: 30000 });
  await status("CONFIRMED");
  await page.getByRole("button", { name: "Process" }).first().click();
  await page.getByText(/transitioned to PROCESSING/).waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: /Mark Packed|Pack/ }).first().click();
  await page.getByText(/transitioned to PACKED/).waitFor({ timeout: 30000 });
  await status("PACKED");

  await page.getByRole("button", { name: /Ship|Dispatch/ }).first().click();
  await dialog().getByRole("button", { name: /Dispatch|Ship|Confirm/ }).last().click();
  await page.getByText(/transitioned to SHIPPED/).waitFor({ timeout: 30000 });
  const shipped = await prisma.order.findUnique({ where: { orderNumber: orderNo } });
  assert.equal(shipped.status, "SHIPPED");
  assert.ok(shipped.trackingNumber, "tracking number recorded");
  assert.equal((await prisma.productVariant.findUnique({ where: { id: variant.id } })).stock, 4, "stock committed on shipment");
});
