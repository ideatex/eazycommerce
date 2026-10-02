/**
 * Product card, quick view and wishlist behaviour in a real browser.
 * Needs the app running against a database seeded with `prisma/seed.js --demo`.
 */
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { BASE, adminClient, createProduct, prisma, uid } from "../integration/helpers.mjs";

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

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(`pageerror: ${String(e).slice(0, 200)}`));
  page.on("console", (m) => {
    if (m.type() === "error" || /hydrat/i.test(m.text())) problems.push(`console: ${m.text().slice(0, 200)}`);
  });
  return { ctx, page, problems };
}

const card = (page, title) => page.locator("div.group", { has: page.getByRole("link", { name: title, exact: true }) }).first();

test("product card: wishlist heart is accessible, toggles, and survives a reload", async () => {
  const { product } = await createProduct(admin, { title: `UX Card ${uid()}`, stock: 20 });
  const { ctx, page, problems } = await newPage();
  await page.goto(`${BASE}/shop-with-sidebar?q=${encodeURIComponent(product.title)}`, { waitUntil: "networkidle" });

  const heart = page.getByRole("button", { name: `Add ${product.title} to wishlist` });
  await heart.waitFor();
  assert.equal(await heart.getAttribute("aria-pressed"), "false");
  await heart.click();
  await page.getByText("Saved to wishlist").waitFor();
  const pressed = page.getByRole("button", { name: `Remove ${product.title} from wishlist` });
  assert.equal(await pressed.getAttribute("aria-pressed"), "true");
  assert.equal(await page.getByText("Product added to wishlist!").count(), 0, "no duplicate toast from the reducer");

  // persisted: a fresh page load restores it (previously it was lost on reload)
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: `Remove ${product.title} from wishlist` }).waitFor({ timeout: 15000 });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("wishlistItems") || "[]").map((i) => i.id));
  assert.deepEqual(saved, [product.id]);

  // removing also persists (previously the toggle-off path never saved)
  await page.getByRole("button", { name: `Remove ${product.title} from wishlist` }).click();
  await page.getByText("Removed from wishlist").waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: `Add ${product.title} to wishlist` }).waitFor();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("wishlistItems") || "[]")), []);
  await ctx.close();
  assert.deepEqual(problems, []);
});

test("product card: quick preview is reachable by keyboard and on touch screens", async () => {
  const { product } = await createProduct(admin, { title: `UX Keys ${uid()}`, stock: 20 });
  const url = `${BASE}/shop-with-sidebar?q=${encodeURIComponent(product.title)}`;

  // keyboard: tabbing onto the hidden-until-hover button reveals it
  const kb = await newPage();
  await kb.page.goto(url, { waitUntil: "networkidle" });
  const btn = kb.page.getByRole("button", { name: `Quick preview of ${product.title}` });
  await btn.focus();
  await kb.page.waitForTimeout(500); // let the 200ms reveal transition finish
  const opacity = await btn.evaluate((el) => getComputedStyle(el).opacity);
  assert.equal(opacity, "1", "focused quick preview button is visible");
  await kb.ctx.close();

  // touch device: no hover, so it must be visible without it
  const touch = await newPage({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  await touch.page.goto(url, { waitUntil: "networkidle" });
  const tbtn = touch.page.getByRole("button", { name: `Quick preview of ${product.title}` });
  await touch.page.waitForTimeout(500);
  assert.equal(await tbtn.evaluate((el) => getComputedStyle(el).opacity), "1", "visible on touch screens");
  await touch.ctx.close();
});

test("quick view: dialog semantics, focus handling, real photos, options, add to cart with a priceable variant", async () => {
  const phone = await prisma.product.findFirst({ where: { sku: "PHN-DC-6" }, include: { images: true, variants: true } });
  assert.ok(phone, "demo catalogue seeded");
  const { ctx, page, problems } = await newPage();
  await page.goto(`${BASE}/shop-with-sidebar?q=${encodeURIComponent("Dual-Camera")}`, { waitUntil: "networkidle" });

  const open = page.getByRole("button", { name: `Quick preview of ${phone.title}` });
  await open.focus();
  await open.click();
  const dialog = page.getByRole("dialog", { name: `Quick view: ${phone.title}` });
  await dialog.waitFor();
  assert.equal(await dialog.getAttribute("aria-modal"), "true");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Close quick view", "focus moves into the dialog");

  // thumbnails are the product's photos, not one per variant
  assert.equal(await dialog.getByRole("button", { name: /^Show image/ }).count(), phone.images.length);

  // options: 128 GB -> 256 GB changes the price
  await dialog.getByText("₹62,999").first().waitFor();
  await dialog.getByRole("button", { name: "256 GB" }).click();
  await dialog.getByText("₹72,999").first().waitFor();

  // Tab stays inside the dialog
  for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), true, "focus is trapped in the dialog");

  // Escape closes and returns focus to the card control
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), `Quick preview of ${phone.title}`);

  // Add the 256 GB variant to the cart from quick view: the cart item carries the variant id
  await open.click();
  await dialog.getByRole("button", { name: "256 GB" }).click();
  await dialog.getByRole("button", { name: "Add to Cart" }).click();
  await page.getByText(/Added 1 × /).waitFor();
  await dialog.waitFor({ state: "detached" });
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("vanigam-cart") || "[]"));
  const v256 = phone.variants.find((v) => v.sku === "PHN-DC-6-256");
  assert.equal(cart.length, 1);
  assert.equal(cart[0].variantId, v256.id);
  assert.equal(cart[0].productId, phone.id);

  // and the server can price it
  await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  await page.getByText("Order summary").waitFor();
  await page.getByText("₹72,999").first().waitFor({ timeout: 30000 });
  await ctx.close();
  assert.deepEqual(problems, []);
});

test("quick view: quantity respects stock and minimum order; wishlist toggles in place", async () => {
  const { product } = await createProduct(admin, { title: `UX Qty ${uid()}`, stock: 3, moq: 2 });
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/shop-with-sidebar?q=${encodeURIComponent(product.title)}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: `Quick preview of ${product.title}` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await dialog.getByText("Only 3 left").waitFor();
  await dialog.getByText("Minimum order: 2").waitFor();

  const qty = dialog.locator('[aria-live="polite"]');
  assert.equal((await qty.textContent()).trim(), "2", "starts at the minimum order quantity");
  assert.equal(await dialog.getByRole("button", { name: "Decrease quantity" }).isDisabled(), true);
  await dialog.getByRole("button", { name: "Increase quantity" }).click();
  assert.equal((await qty.textContent()).trim(), "3");
  assert.equal(await dialog.getByRole("button", { name: "Increase quantity" }).isDisabled(), true, "cannot exceed stock");

  const wl = dialog.getByRole("button", { name: /Wishlist/ });
  await wl.click();
  await dialog.getByRole("button", { name: "Remove from Wishlist" }).waitFor();
  await dialog.getByRole("button", { name: "Remove from Wishlist" }).click();
  await dialog.getByRole("button", { name: "Add to Wishlist" }).waitFor();

  await dialog.getByRole("link", { name: /View full details/ }).click();
  await page.waitForURL(new RegExp(`/products/${product.slug}`));
  await ctx.close();
});

test("fullscreen preview shows the product's real photos", async () => {
  const tv = await prisma.product.findFirst({ where: { sku: "TV-43-4K" }, include: { images: true } });
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/shop-with-sidebar?q=${encodeURIComponent("Smart LED TV")}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: `Quick preview of ${tv.title}` }).click();
  await page.getByRole("button", { name: "View images fullscreen" }).click();
  await page.waitForSelector(".preview-slider img");
  const srcs = await page.$$eval(".preview-slider img", (imgs) => imgs.map((i) => decodeURIComponent(i.getAttribute("src") || "")));
  for (const img of tv.images) assert.ok(srcs.some((s) => s.includes(img.url)), `${img.url} appears in the preview`);
  await ctx.close();
});

test("wishlist page: live price and stock, move to cart with a priceable variant, unavailable items handled", async () => {
  const a = await createProduct(admin, { title: `UX WL A ${uid()}`, basePrice: 1200, stock: 9 });
  const b = await createProduct(admin, { title: `UX WL B ${uid()}`, basePrice: 800, stock: 4 });
  const c = await createProduct(admin, { title: `UX WL C ${uid()}`, basePrice: 500, stock: 5 });
  const { ctx, page, problems } = await newPage();

  // Save three products as a visitor would (stored copy deliberately has stale price and stock)
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate((items) => localStorage.setItem("wishlistItems", JSON.stringify(items)), [a, b, c].map((x) => ({
    id: x.product.id, title: x.product.title, slug: x.product.slug, image: "/images/placeholder.svg", price: 1, quantity: 999,
  })));

  // Meanwhile: B sells out, C is archived, A's price changes
  await admin.api("/api/inventory/adjust", { method: "POST", json: { variantId: b.variant.id, newStock: 0, reason: "test" } });
  await admin.api(`/api/products/${c.product.id}`, { method: "DELETE" });
  await admin.api(`/api/products/${a.product.id}`, { method: "PUT", json: { basePrice: 1350 } });

  await page.goto(`${BASE}/wishlist`, { waitUntil: "networkidle" });
  const row = (p) => page.locator("tbody tr", { hasText: p.product.title });
  await row(a).getByText("₹1,350").waitFor({ timeout: 20000 });
  await row(a).getByText("In Stock").waitFor();
  await row(b).getByText("Out of Stock").first().waitFor();
  assert.equal(await row(b).getByRole("button", { name: "Out of Stock" }).isDisabled(), true);
  await row(c).getByText("No longer available").waitFor();
  assert.equal(await row(c).getByRole("button", { name: "Unavailable" }).isDisabled(), true);
  assert.equal(await page.getByText("₹1", { exact: true }).count(), 0, "stale stored price is never shown");

  // Move A to the cart: the cart receives the real variant, and the server prices it
  await row(a).getByRole("button", { name: "Add to Cart" }).click();
  await page.getByText(/Moved .* to cart/).waitFor();
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("vanigam-cart") || "[]"));
  assert.equal(cart.length, 1);
  assert.equal(cart[0].variantId, a.variant.id);
  assert.equal(cart[0].currency, "inr");
  assert.equal(await page.locator("tbody tr", { hasText: a.product.title }).count(), 0, "moved item leaves the wishlist");
  const left = await page.evaluate(() => JSON.parse(localStorage.getItem("wishlistItems") || "[]").length);
  assert.equal(left, 2, "removal persisted");

  await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  await page.getByText(a.product.title).first().waitFor();
  await page.getByText("₹1,350").first().waitFor({ timeout: 30000 });

  // Remove the unavailable item, then clear the rest
  await page.goto(`${BASE}/wishlist`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: `Remove ${c.product.title}` }).first().click();
  await page.getByText("Removed from wishlist").waitFor();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Clear Wishlist" }).click();
  await page.getByRole("heading", { name: "Your Wishlist is Empty" }).waitFor();
  await ctx.close();
  assert.deepEqual(problems, []);
});

test("wishlist API only exposes public catalogue data and ignores junk ids", async () => {
  const { product } = await createProduct(admin, { title: `UX API ${uid()}`, stock: 5 });
  const draft = await createProduct(admin, { title: `UX API Draft ${uid()}`, status: "DRAFT" });
  const res = await fetch(`${BASE}/api/wishlist/products?ids=${product.id},${draft.product.id},not-an-id,'; DROP TABLE x`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.data.products.map((p) => p.id), [product.id]);
  assert.deepEqual(Object.keys(body.data.products[0]).sort(), ["available", "color", "image", "id", "listPrice", "moq", "price", "size", "slug", "title", "variantAvailable", "variantId"].sort());
  const empty = await (await fetch(`${BASE}/api/wishlist/products`)).json();
  assert.deepEqual(empty.data.products, []);
});
