import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { Client, adminClient, createProduct, customerClient, placeOrder, prisma, uid, RUN } from "./helpers.mjs";

let admin;
before(async () => {
  admin = await adminClient();
});
after(() => prisma.$disconnect());

const code = (p = "T") => `${p}${RUN}${uid()}`.toUpperCase().slice(0, 20);
const quote = (client, items, couponCode, state = "Tamil Nadu") =>
  client.api("/api/checkout/quote", { method: "POST", json: { items, couponCode, state } });

test("coupon admin API: validation, uniqueness, update, delete", async () => {
  const c = code("VAL");
  const bad = async (over, status = 400) => {
    const res = await admin.api("/api/coupons", { method: "POST", json: { code: code("B"), discountType: "PERCENTAGE", discountValue: 10, ...over } });
    assert.equal(res.status, status, `${JSON.stringify(over)} -> ${res.status} ${JSON.stringify(res.body)}`);
  };
  await bad({ discountValue: 150 });
  await bad({ discountValue: 0 });
  await bad({ discountValue: -5 });
  await bad({ discountType: "BOGO" });
  await bad({ code: "ab" });
  await bad({ code: "has space" });
  await bad({ startDate: "not-a-date" });
  await bad({ startDate: "2026-06-10", endDate: "2026-06-01" });
  await bad({ usageLimit: 0 });
  await bad({ minOrderValue: -1 });

  const ok = await admin.api("/api/coupons", { method: "POST", json: { code: c.toLowerCase(), discountType: "FIXED", discountValue: 200, minOrderValue: 500, usageLimit: 3, description: "Test" } });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.data.code, c, "codes are normalised to upper case");
  await bad({ code: c }, 409);

  const upd = await admin.api("/api/coupons", { method: "PUT", json: { id: ok.body.data.id, discountValue: 250, isActive: false, maxDiscount: null } });
  assert.equal(upd.status, 200);
  const row = await prisma.coupon.findUnique({ where: { id: ok.body.data.id } });
  assert.equal(row.discountValue, 250);
  assert.equal(row.isActive, false);
  assert.equal((await admin.api("/api/coupons", { method: "PUT", json: { id: ok.body.data.id, discountValue: -3 } })).status, 400);
  assert.equal((await admin.api("/api/coupons", { method: "PUT", json: { id: "missing", isActive: true } })).status, 404);

  assert.equal((await admin.api(`/api/coupons?id=${row.id}`, { method: "DELETE" })).status, 200);
  assert.equal(await prisma.coupon.count({ where: { id: row.id } }), 0);
  assert.equal((await admin.api(`/api/coupons?id=${row.id}`, { method: "DELETE" })).status, 404);
});

test("Workflow F: coupon is validated and applied by the server, totals stay consistent through checkout", async () => {
  const { variant } = await createProduct(admin, { basePrice: 1000, stock: 20, taxRatePercent: 18 });
  const c = code("PCT");
  await admin.api("/api/coupons", { method: "POST", json: { code: c, discountType: "PERCENTAGE", discountValue: 10, minOrderValue: 1500, maxDiscount: 250, usageLimit: 1 } });
  const buyer = await customerClient("promo");
  const items = [{ variantId: variant.id, quantity: 3 }];

  // Below the minimum -> issue, no discount
  const small = (await quote(buyer, [{ variantId: variant.id, quantity: 1 }], c)).body.data;
  assert.equal(small.coupon, null);
  assert.match(small.issues[0].message, /minimum order/i);

  // Unknown code
  assert.match((await quote(buyer, items, "NOPE-NOT-REAL")).body.data.issues[0].message, /not valid/i);

  // Valid: 10% of 3000 = 300, capped at 250; tax is charged on the discounted amount
  const q = (await quote(buyer, items, c)).body.data;
  assert.deepEqual(q.coupon, { code: c, discount: 250 });
  assert.equal(q.totals.discountTotal, 250);
  assert.equal(q.totals.taxTotal, 495, "(3000-250)*18%");
  assert.equal(q.totals.grandTotal, 3000 - 250 + 495);

  // Checkout reproduces the quote exactly and redeems the coupon
  const placed = await placeOrder(buyer, items, { couponCode: c });
  assert.equal(placed.status, 201, JSON.stringify(placed.body));
  assert.equal(placed.body.data.grandTotal, q.totals.grandTotal);
  const order = await prisma.order.findUnique({ where: { orderNumber: placed.body.data.orderNumber } });
  assert.equal(order.discountTotal, 250);
  assert.equal(order.couponCode, c);
  assert.equal((await prisma.coupon.findUnique({ where: { code: c } })).timesUsed, 1);

  // Usage limit reached
  const second = await placeOrder(await customerClient("promo2"), items, { couponCode: c });
  assert.equal(second.status, 409);
  assert.match(second.body.error.message, /usage limit/i);
  assert.equal((await prisma.coupon.findUnique({ where: { code: c } })).timesUsed, 1, "failed attempts do not consume redemptions");
});

test("coupon redemption is race-safe: a single-use coupon yields one discounted order", async () => {
  const { variant } = await createProduct(admin, { basePrice: 2000, stock: 50 });
  const c = code("RACE");
  await admin.api("/api/coupons", { method: "POST", json: { code: c, discountType: "FIXED", discountValue: 100, usageLimit: 1 } });
  const buyers = await Promise.all([customerClient("cr1"), customerClient("cr2"), customerClient("cr3")]);
  const results = await Promise.all(buyers.map((b) => placeOrder(b, [{ variantId: variant.id, quantity: 1 }], { couponCode: c })));
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409]);
  assert.equal((await prisma.coupon.findUnique({ where: { code: c } })).timesUsed, 1);
  assert.equal(await prisma.order.count({ where: { couponCode: c } }), 1);
  // The losers' stock reservations were rolled back with their transactions
  assert.equal((await prisma.productVariant.findUnique({ where: { id: variant.id } })).reservedStock, 1);
});

test("deactivated and expired coupons are rejected at quote and checkout", async () => {
  const { variant } = await createProduct(admin, { basePrice: 1000, stock: 20 });
  const items = [{ variantId: variant.id, quantity: 1 }];
  const buyer = await customerClient("exp");

  const off = code("OFF");
  const created = await admin.api("/api/coupons", { method: "POST", json: { code: off, discountType: "PERCENTAGE", discountValue: 10 } });
  assert.equal((await quote(buyer, items, off)).body.data.coupon.code, off);
  await admin.api("/api/coupons", { method: "PUT", json: { id: created.body.data.id, isActive: false } });
  assert.match((await quote(buyer, items, off)).body.data.issues[0].message, /not active/i);
  assert.equal((await placeOrder(buyer, items, { couponCode: off })).status, 409);

  const old = code("OLD");
  await prisma.coupon.create({ data: { code: old, discountType: "PERCENTAGE", discountValue: 10, endDate: new Date(Date.now() - 86400000) } });
  assert.match((await quote(buyer, items, old)).body.data.issues[0].message, /expired/i);
  const future = code("FUT");
  await prisma.coupon.create({ data: { code: future, discountType: "PERCENTAGE", discountValue: 10, startDate: new Date(Date.now() + 86400000) } });
  assert.match((await quote(buyer, items, future)).body.data.issues[0].message, /not valid yet/i);
});

test("reviews: customer submits, admin moderates, storefront follows", async () => {
  const { product, variant } = await createProduct(admin, { title: `Reviewed ${uid()}`, stock: 10 });
  const buyer = await customerClient("rev");
  const shopper = new Client();
  const marker = `great-${uid()}`;

  // validation + auth
  assert.equal((await shopper.api("/api/reviews", { method: "POST", json: { productId: product.id, rating: 5, comment: "x" } })).status, 401);
  const post = (over) => buyer.api("/api/reviews", { method: "POST", json: { productId: product.id, rating: 5, comment: marker, ...over } });
  assert.equal((await post({ rating: 9 })).status, 400);
  assert.equal((await post({ rating: 0 })).status, 400);
  assert.equal((await post({ rating: 3.5 })).status, 400);
  assert.equal((await post({ comment: "  " })).status, 400);
  assert.equal((await post({ productId: "ghost" })).status, 404);

  // not a purchaser yet
  const created = await post({ title: "Lovely" });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.pendingModeration, true);
  const row = await prisma.productReview.findUnique({ where: { id: created.body.data.id } });
  assert.equal(row.isApproved, false);
  assert.equal(row.isVerifiedPurchase, false);
  assert.equal((await post({ comment: "again" })).status, 409, "one review per customer per product");

  // pending reviews are not public
  assert.ok(!(await shopper.html(`/products/${product.slug}`)).text.includes(marker));

  // admin sees it in the moderation queue and approves
  const queue = await admin.html("/admin/reviews");
  assert.ok(queue.text.includes(marker));
  assert.equal((await admin.api("/api/admin/reviews", { method: "PATCH", json: { id: row.id, isApproved: "yes" } })).status, 400);
  assert.equal((await admin.api("/api/admin/reviews", { method: "PATCH", json: { id: row.id, isApproved: true } })).status, 200);
  const live = await shopper.html(`/products/${product.slug}`);
  assert.ok(live.text.includes(marker), "approved review is public");
  assert.ok(live.text.replace(/<!-- -->/g, "").includes("(1 review)"));

  // hiding removes it again
  await admin.api("/api/admin/reviews", { method: "PATCH", json: { id: row.id, isApproved: false } });
  assert.ok(!(await shopper.html(`/products/${product.slug}`)).text.includes(marker));

  // delete
  assert.equal((await admin.api(`/api/admin/reviews?id=${row.id}`, { method: "DELETE" })).status, 200);
  assert.equal(await prisma.productReview.count({ where: { id: row.id } }), 0);
  assert.equal((await admin.api(`/api/admin/reviews?id=${row.id}`, { method: "DELETE" })).status, 404);

  // verified purchase is decided by the server from order history
  const order = (await placeOrder(buyer, [{ variantId: variant.id, quantity: 1 }])).body.data.orderNumber;
  for (const [s, extra] of [["CONFIRMED"], ["PACKED"], ["SHIPPED", { trackingNumber: "R1" }], ["DELIVERED"]]) {
    await admin.api(`/api/orders/${order}/status`, { method: "POST", json: { status: s, ...(extra || {}) } });
  }
  const verified = await post({ comment: `verified ${uid()}` });
  assert.equal(verified.status, 201);
  assert.equal((await prisma.productReview.findUnique({ where: { id: verified.body.data.id } })).isVerifiedPurchase, true);
});

test("reviews cannot be submitted for unpublished products", async () => {
  const { product } = await createProduct(admin, { status: "DRAFT" });
  const buyer = await customerClient("revdraft");
  assert.equal((await buyer.api("/api/reviews", { method: "POST", json: { productId: product.id, rating: 5, comment: "hi" } })).status, 404);
});

test("storefront review text is escaped", async () => {
  const { product } = await createProduct(admin, { stock: 5 });
  const buyer = await customerClient("revxss");
  const marker = `rx${uid()}`;
  const res = await buyer.api("/api/reviews", { method: "POST", json: { productId: product.id, rating: 4, comment: `<script>window.${marker}=1</script>` } });
  await admin.api("/api/admin/reviews", { method: "PATCH", json: { id: (await prisma.productReview.findFirst({ where: { productId: product.id } })).id, isApproved: true } });
  assert.equal(res.status, 201);
  const html = (await new Client().html(`/products/${product.slug}`)).text;
  assert.ok(!html.includes(`<script>window.${marker}=1</script>`));
});
