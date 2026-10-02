import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { Client, adminClient, createProduct, customerClient, placeOrder, prisma } from "./helpers.mjs";

let admin;
before(async () => {
  admin = await adminClient();
});
after(() => prisma.$disconnect());

test("marketplace surfaces are gone: vendor APIs, store pages, onboarding, admin vendors", async () => {
  const anon = new Client();
  for (const path of ["/stores", "/store/anything", "/onboarding"]) {
    const res = await anon.request(path, { redirect: "manual" });
    await res.arrayBuffer();
    assert.equal(res.status, 404, `${path} should not exist`);
  }
  for (const [method, path] of [["POST", "/api/vendors"], ["PATCH", "/api/vendors"], ["PATCH", "/api/vendors/payouts"], ["POST", "/api/vendors/apply"]]) {
    const res = await admin.request(path, { method, headers: { "content-type": "application/json" }, body: "{}" });
    await res.arrayBuffer();
    assert.equal(res.status, 404, `${method} ${path} should not exist`);
  }
  const page = await admin.request("/admin/vendors", { redirect: "manual" });
  await page.arrayBuffer();
  assert.equal(page.status, 404);
});

test("no vendor concept in the database, admin navigation or storefront", async () => {
  const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%vendor%'`;
  assert.deepEqual(tables, [], "vendor tables dropped");
  const cols = await prisma.$queryRaw`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND column_name ILIKE '%vendor%'`;
  assert.deepEqual(cols, [], "vendor columns dropped");

  const dash = (await admin.html("/admin")).text;
  assert.ok(!/Vendors|vendor|Commission/i.test(dash.replace(/<script[\s\S]*?<\/script>/g, "")), "admin UI has no vendor/commission wording");
  const home = (await new Client().html("/")).text;
  assert.ok(!/Verified Stores|Sold by|Marketplace Seller/i.test(home));
});

test("products ignore a vendorId in the payload and carry no seller", async () => {
  const { product } = await createProduct(admin, { vendorId: "someone", stock: 5 });
  const row = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal("vendorId" in row, false);
  const detail = (await new Client().html(`/products/${product.slug}`)).text;
  assert.ok(!/Sold by/i.test(detail));
});

test("an order is a single order: no sub-orders or commissions, whole total is the store's", async () => {
  const { variant } = await createProduct(admin, { basePrice: 1000, stock: 10 });
  const buyer = await customerClient("sv");
  const placed = await placeOrder(buyer, [{ variantId: variant.id, quantity: 2 }]);
  assert.equal(placed.status, 201);
  const order = await prisma.order.findUnique({ where: { orderNumber: placed.body.data.orderNumber }, include: { items: true } });
  assert.equal(order.items.length, 1);
  assert.ok(!("subOrders" in order));
  assert.equal(order.grandTotal, 2000 + 360 + 0);

  const analytics = (await admin.html("/admin/analytics")).text;
  assert.ok(!/Commission/i.test(analytics));
});

test("search returns products only", async () => {
  const res = await new Client().api("/api/search?q=Smart%20LED");
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body.data), ["products"]);
});

test("settings accept single-store commerce modes and reject the old marketplace modes", async () => {
  for (const mode of ["B2C", "B2B", "HYBRID"]) assert.equal((await admin.api("/api/settings", { method: "PATCH", json: { commerceMode: mode } })).status, 200, mode);
  for (const mode of ["MULTI_VENDOR", "SINGLE_VENDOR"]) assert.equal((await admin.api("/api/settings", { method: "PATCH", json: { commerceMode: mode } })).status, 400, mode);
  await admin.api("/api/settings", { method: "PATCH", json: { commerceMode: "HYBRID" } });
});
