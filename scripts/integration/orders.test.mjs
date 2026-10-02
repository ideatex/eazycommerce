import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { Client, adminClient, createProduct, customerClient, placeOrder, prisma, uid, validAddress } from "./helpers.mjs";

let admin;
before(async () => {
  admin = await adminClient();
});
after(() => prisma.$disconnect());

const variantOf = async (id) => prisma.productVariant.findUnique({ where: { id } });
const orderOf = (orderNumber) => prisma.order.findUnique({ where: { orderNumber }, include: { items: true, history: true } });
const setStatus = (orderNumber, status, extra = {}) =>
  admin.api(`/api/orders/${orderNumber}/status`, { method: "POST", json: { status, ...extra } });

test("quote: prices come from the database, the browser's prices are ignored", async () => {
  const { variant } = await createProduct(admin, { basePrice: 18500, stock: 20, taxRatePercent: 18 });
  const buyer = new Client();

  const tampered = await buyer.api("/api/checkout/quote", {
    method: "POST",
    json: { items: [{ variantId: variant.id, quantity: 2, price: 1, unitPrice: 1, totalPrice: 2, taxRatePercent: 0 }], state: "Tamil Nadu", totals: { grandTotal: 1 } },
  });
  assert.equal(tampered.status, 200);
  const q = tampered.body.data;
  assert.equal(q.lines[0].unitPrice, 18500);
  assert.equal(q.totals.subtotal, 37000);
  assert.equal(q.totals.taxTotal, 6660);
  assert.equal(q.totals.cgstTotal, 3330, "intra-state: CGST");
  assert.equal(q.totals.sgstTotal, 3330, "intra-state: SGST");
  assert.equal(q.totals.igstTotal, 0);
  assert.equal(q.totals.shippingFee, 0);
  assert.equal(q.totals.grandTotal, 43660);

  const inter = (await buyer.api("/api/checkout/quote", { method: "POST", json: { items: [{ variantId: variant.id, quantity: 2 }], state: "Karnataka" } })).body.data;
  assert.equal(inter.totals.igstTotal, 6660, "inter-state: IGST");
  assert.equal(inter.totals.cgstTotal + inter.totals.sgstTotal, 0);
  assert.equal(inter.totals.grandTotal, 43660);

  const small = await createProduct(admin, { basePrice: 100, stock: 5, taxRatePercent: 5 });
  const s = (await buyer.api("/api/checkout/quote", { method: "POST", json: { items: [{ variantId: small.variant.id, quantity: 1 }], state: "Tamil Nadu" } })).body.data;
  assert.equal(s.totals.shippingFee, 79, "flat shipping below the free-shipping threshold");
  assert.equal(s.totals.grandTotal, 100 + 5 + 79);
});

test("quote validation: bad carts are rejected, unavailable items are reported", async () => {
  const buyer = new Client();
  const bad = async (items) => (await buyer.api("/api/checkout/quote", { method: "POST", json: { items } })).status;
  assert.equal(await bad([]), 400);
  assert.equal(await bad("nope"), 400);
  assert.equal(await bad([{ variantId: "x", quantity: 0 }]), 400);
  assert.equal(await bad([{ variantId: "x", quantity: -3 }]), 400);
  assert.equal(await bad([{ variantId: "x", quantity: 1.5 }]), 400);
  assert.equal(await bad([{ quantity: 1 }]), 400);

  const ghost = await buyer.api("/api/checkout/quote", { method: "POST", json: { items: [{ variantId: "ghost", quantity: 1 }] } });
  assert.equal(ghost.status, 200);
  assert.match(ghost.body.data.issues[0].message, /no longer available/i);

  const { variant } = await createProduct(admin, { stock: 3, moq: 2 });
  const lowQty = (await buyer.api("/api/checkout/quote", { method: "POST", json: { items: [{ variantId: variant.id, quantity: 1 }] } })).body.data;
  assert.match(lowQty.issues[0].message, /minimum order quantity is 2/i);
  const tooMany = (await buyer.api("/api/checkout/quote", { method: "POST", json: { items: [{ variantId: variant.id, quantity: 9 }] } })).body.data;
  assert.match(tooMany.issues[0].message, /only 3/i);
});

test("draft and archived products cannot be bought even with a known variant id", async () => {
  const { variant } = await createProduct(admin, { status: "DRAFT" });
  const buyer = await customerClient("draftbuy");
  const res = await placeOrder(buyer, [{ variantId: variant.id, quantity: 1 }]);
  assert.equal(res.status, 409);
  assert.equal(await prisma.order.count({ where: { customerId: buyer.userId } }), 0);
});

test("Workflow D: checkout creates a reserved COD order that admins can process end to end", async () => {
  const { product, variant } = await createProduct(admin, { title: `Order Flow ${uid()}`, basePrice: 1000, stock: 10 });
  const buyer = await customerClient("flow");

  // Place order (client also tries to smuggle a price)
  const placed = await placeOrder(buyer, [{ variantId: variant.id, quantity: 3, price: 1 }], { notes: "Leave at the gate" });
  assert.equal(placed.status, 201, JSON.stringify(placed.body));
  const orderNumber = placed.body.data.orderNumber;
  assert.match(orderNumber, /^ORD-\d{8}-\d{6}$/);

  let order = await orderOf(orderNumber);
  assert.equal(order.status, "PENDING");
  assert.equal(order.paymentMethod, "COD");
  assert.equal(order.paymentStatus, "PENDING");
  assert.equal(order.subtotal, 3000, "server-priced, not 3");
  assert.equal(order.taxTotal, 540);
  assert.equal(order.cgstTotal, 270);
  assert.equal(order.sgstTotal, 270);
  assert.equal(order.grandTotal, 3540);
  assert.equal(order.customerId, buyer.userId);
  assert.equal(order.customerEmail, buyer.email);
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].variantId, variant.id);
  assert.equal(order.items[0].totalPrice, 3000);
  assert.ok(order.history.some((h) => /Leave at the gate/.test(h.note)));
  assert.equal(JSON.parse(order.shippingAddressJson).postalCode, "600001");

  let v = await variantOf(variant.id);
  assert.equal(v.stock, 10, "stock is untouched until shipment");
  assert.equal(v.reservedStock, 3, "units are reserved at checkout");
  assert.ok(await prisma.stockMovement.findFirst({ where: { variantId: variant.id, type: "RESERVE", referenceId: orderNumber } }));
  assert.equal(await prisma.address.count({ where: { userId: buyer.userId } }), 1, "first address saved to the address book");

  // Storefront availability uses stock - reserved
  assert.ok((await new Client().html(`/products/${product.slug}`)).text.includes("7 available"));

  // Admin sees the order in the panel
  const adminPage = await admin.html("/admin/orders");
  assert.ok(adminPage.text.includes(orderNumber), "order appears in the admin orders page");
  const dash = await admin.html("/admin");
  assert.equal(dash.status, 200);

  // Invalid transitions are refused
  assert.equal((await setStatus(orderNumber, "SHIPPED")).status, 409, "cannot ship a pending order");
  assert.equal((await setStatus(orderNumber, "DELIVERED")).status, 409);
  assert.equal((await setStatus(orderNumber, "NOT_A_STATUS")).status, 400);

  // Valid lifecycle
  assert.equal((await setStatus(orderNumber, "CONFIRMED")).status, 200);
  assert.equal((await setStatus(orderNumber, "PROCESSING")).status, 200);
  assert.equal((await setStatus(orderNumber, "PACKED")).status, 200);
  assert.equal((await setStatus(orderNumber, "SHIPPED")).status, 400, "tracking number required to ship");
  const shipped = await setStatus(orderNumber, "SHIPPED", { trackingNumber: "AWB123", trackingCarrier: "Delhivery" });
  assert.equal(shipped.status, 200);

  v = await variantOf(variant.id);
  assert.equal(v.stock, 7, "shipping commits the sale to stock");
  assert.equal(v.reservedStock, 0, "reservation consumed");
  assert.ok(await prisma.stockMovement.findFirst({ where: { variantId: variant.id, type: "SALE", referenceId: orderNumber, quantity: -3 } }));

  // Customer sees the authorised status + tracking
  const acct = (await buyer.html("/account?tab=orders")).text;
  assert.ok(acct.includes(orderNumber));
  assert.ok(acct.includes("SHIPPED"));

  assert.equal((await setStatus(orderNumber, "DELIVERED")).status, 200);
  order = await orderOf(orderNumber);
  assert.equal(order.status, "DELIVERED");
  assert.equal(order.paymentStatus, "PAID", "COD is paid on delivery");
  assert.equal(order.trackingNumber, "AWB123");
  const profile = await prisma.customerProfile.findUnique({ where: { userId: buyer.userId } });
  assert.equal(profile.orderCount, 1);
  assert.equal(profile.totalSpent, 3540);

  // Return then refund
  assert.equal((await setStatus(orderNumber, "RETURNED")).status, 200);
  v = await variantOf(variant.id);
  assert.equal(v.stock, 10, "returned units go back on the shelf");
  assert.equal((await setStatus(orderNumber, "REFUNDED")).status, 200);
  order = await orderOf(orderNumber);
  assert.equal(order.paymentStatus, "REFUNDED");
  const after = await prisma.customerProfile.findUnique({ where: { userId: buyer.userId } });
  assert.equal(after.orderCount, 0);
  assert.equal(after.totalSpent, 0);

  // Terminal state
  assert.equal((await setStatus(orderNumber, "SHIPPED")).status, 409);
  assert.equal((await setStatus(orderNumber, "CANCELLED")).status, 409);

  const history = (await orderOf(orderNumber)).history.map((h) => h.status);
  assert.deepEqual(history.sort(), ["CONFIRMED", "DELIVERED", "PACKED", "PENDING", "PROCESSING", "REFUNDED", "RETURNED", "SHIPPED"].sort());
  assert.ok(await prisma.auditLog.findFirst({ where: { action: "ORDER_STATUS_CHANGED", entityId: order.id } }));
});

test("checkout validation: address, phone, PIN, quantities, auth", async () => {
  const { variant } = await createProduct(admin, { stock: 10 });
  const buyer = await customerClient("val");
  const item = [{ variantId: variant.id, quantity: 1 }];

  const bad = async (over, label) => {
    const res = await placeOrder(buyer, item, over);
    assert.equal(res.status, 400, `${label}: ${res.status} ${JSON.stringify(res.body)}`);
  };
  await bad({ address: validAddress({ postalCode: "12345" }) }, "short PIN");
  await bad({ address: validAddress({ postalCode: "0123456" }) }, "long PIN");
  await bad({ address: validAddress({ phone: "abc" }) }, "bad phone");
  await bad({ address: validAddress({ name: "" }) }, "missing name");
  await bad({ address: validAddress({ streetAddress: "" }) }, "missing street");
  await bad({ address: validAddress({ city: "" }) }, "missing city");
  await bad({ paymentMethod: "BITCOIN" }, "unknown payment method");
  await bad({ paymentMethod: "ONLINE" }, "online payments not configured");
  await bad({ address: undefined }, "no address");
  assert.equal((await placeOrder(buyer, [{ variantId: variant.id, quantity: 0 }])).status, 400);
  assert.equal((await placeOrder(buyer, [])).status, 400);
  assert.equal((await placeOrder(new Client(), item)).status, 401, "guests cannot place orders");

  assert.equal(await prisma.order.count({ where: { customerId: buyer.userId } }), 0, "no order created by failed attempts");
  assert.equal((await variantOf(variant.id)).reservedStock, 0, "no stock reserved by failed attempts");
});

test("overselling is impossible: concurrent checkouts for the last unit produce exactly one order", async () => {
  const { variant } = await createProduct(admin, { stock: 1 });
  const buyers = await Promise.all([customerClient("race1"), customerClient("race2"), customerClient("race3"), customerClient("race4")]);

  const results = await Promise.all(buyers.map((b) => placeOrder(b, [{ variantId: variant.id, quantity: 1 }])));
  const statuses = results.map((r) => r.status).sort();
  assert.deepEqual(statuses, [201, 409, 409, 409], `got ${statuses}`);

  const v = await variantOf(variant.id);
  assert.equal(v.reservedStock, 1);
  assert.equal(v.stock - v.reservedStock, 0);
  assert.equal(await prisma.orderItem.count({ where: { variantId: variant.id } }), 1);
});

test("customers can cancel their own pending order; reservations are released", async () => {
  const { variant } = await createProduct(admin, { stock: 10 });
  const buyer = await customerClient("cancel");
  const other = await customerClient("cancel-other");

  const { body } = await placeOrder(buyer, [{ variantId: variant.id, quantity: 4 }]);
  const orderNumber = body.data.orderNumber;
  assert.equal((await variantOf(variant.id)).reservedStock, 4);

  assert.equal((await other.api(`/api/orders/${orderNumber}/cancel`, { method: "POST", json: {} })).status, 404, "another customer cannot cancel it");
  assert.equal((await new Client().api(`/api/orders/${orderNumber}/cancel`, { method: "POST", json: {} })).status, 401);

  const cancelled = await buyer.api(`/api/orders/${orderNumber}/cancel`, { method: "POST", json: {} });
  assert.equal(cancelled.status, 200);
  assert.equal((await orderOf(orderNumber)).status, "CANCELLED");
  assert.equal((await variantOf(variant.id)).reservedStock, 0, "reservation released");
  assert.equal((await variantOf(variant.id)).stock, 10);

  assert.equal((await buyer.api(`/api/orders/${orderNumber}/cancel`, { method: "POST", json: {} })).status, 409, "already cancelled");
});

test("customers cannot cancel orders that are already being processed", async () => {
  const { variant } = await createProduct(admin, { stock: 10 });
  const buyer = await customerClient("late");
  const { body } = await placeOrder(buyer, [{ variantId: variant.id, quantity: 1 }]);
  const orderNumber = body.data.orderNumber;
  await setStatus(orderNumber, "CONFIRMED");
  await setStatus(orderNumber, "PROCESSING");
  const res = await buyer.api(`/api/orders/${orderNumber}/cancel`, { method: "POST", json: {} });
  assert.equal(res.status, 409);
  assert.equal((await orderOf(orderNumber)).status, "PROCESSING");
});

test("admin cancellation of a paid order flags a pending refund and releases stock", async () => {
  const { variant } = await createProduct(admin, { stock: 10 });
  const buyer = await customerClient("refundflag");
  const { body } = await placeOrder(buyer, [{ variantId: variant.id, quantity: 2 }]);
  const orderNumber = body.data.orderNumber;
  await prisma.order.update({ where: { orderNumber }, data: { paymentStatus: "PAID", paymentMethod: "ONLINE" } });

  assert.equal((await setStatus(orderNumber, "CANCELLED")).status, 200);
  const o = await orderOf(orderNumber);
  assert.equal(o.paymentStatus, "REFUND_PENDING");
  assert.equal((await variantOf(variant.id)).reservedStock, 0);
});

test("returns: only delivered orders, once, recorded for staff", async () => {
  const { variant } = await createProduct(admin, { stock: 10 });
  const buyer = await customerClient("ret");
  const { body } = await placeOrder(buyer, [{ variantId: variant.id, quantity: 1 }]);
  const n = body.data.orderNumber;

  const early = await buyer.api(`/api/orders/${n}/return-request`, { method: "POST", json: { reason: "changed my mind" } });
  assert.equal(early.status, 409, "not delivered yet");

  await setStatus(n, "CONFIRMED");
  await setStatus(n, "PACKED");
  await setStatus(n, "SHIPPED", { trackingNumber: "T1" });
  await setStatus(n, "DELIVERED");

  assert.equal((await buyer.api(`/api/orders/${n}/return-request`, { method: "POST", json: {} })).status, 400, "reason required");
  const ok = await buyer.api(`/api/orders/${n}/return-request`, { method: "POST", json: { reason: "Item damaged" } });
  assert.equal(ok.status, 201);
  assert.equal((await buyer.api(`/api/orders/${n}/return-request`, { method: "POST", json: { reason: "again" } })).status, 409, "only once");
  assert.equal((await (await customerClient("ret2")).api(`/api/orders/${n}/return-request`, { method: "POST", json: { reason: "x" } })).status, 404);

  const o = await orderOf(n);
  assert.ok(o.history.some((h) => h.note === "Return requested: Item damaged"));
  assert.ok(await prisma.auditLog.findFirst({ where: { action: "ORDER_RETURN_REQUESTED", entityId: o.id } }));
  assert.equal(o.status, "DELIVERED", "customers cannot move the order themselves");
});

test("invoices: PDF for the owner and staff only", async () => {
  const { variant } = await createProduct(admin, { stock: 10, title: `Invoice Item ${uid()}` });
  const buyer = await customerClient("inv");
  const stranger = await customerClient("inv-stranger");
  const { body } = await placeOrder(buyer, [{ variantId: variant.id, quantity: 2 }]);
  const n = body.data.orderNumber;

  const mine = await buyer.request(`/api/invoices/${n}`);
  assert.equal(mine.status, 200);
  assert.equal(mine.headers.get("content-type"), "application/pdf");
  assert.equal(mine.headers.get("cache-control"), "private, no-store");
  const pdf = Buffer.from(await mine.arrayBuffer());
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.toString("latin1").includes(`INV-${new Date().getFullYear()}-${n}`));

  assert.equal((await stranger.request(`/api/invoices/${n}`)).status, 404, "other customers cannot read it");
  assert.equal((await new Client().request(`/api/invoices/${n}`)).status, 401);
  assert.equal((await admin.request(`/api/invoices/${n}`)).status, 200);
  assert.equal(await prisma.invoice.count({ where: { order: { orderNumber: n } } }), 1, "one invoice per order");

  // concurrent first requests do not create duplicates or fail
  const { body: b2 } = await placeOrder(buyer, [{ variantId: variant.id, quantity: 1 }]);
  const both = await Promise.all([buyer.request(`/api/invoices/${b2.data.orderNumber}`), admin.request(`/api/invoices/${b2.data.orderNumber}`)]);
  assert.deepEqual(both.map((r) => r.status), [200, 200]);
  assert.equal(await prisma.invoice.count({ where: { order: { orderNumber: b2.data.orderNumber } } }), 1);
});

test("order confirmation page is private to the buyer", async () => {
  const { variant } = await createProduct(admin, { stock: 10 });
  const buyer = await customerClient("conf");
  const stranger = await customerClient("conf-other");
  const { body } = await placeOrder(buyer, [{ variantId: variant.id, quantity: 1 }]);
  const n = body.data.orderNumber;

  const mine = await buyer.html(`/order-confirmation?orderNo=${n}`);
  assert.equal(mine.status, 200);
  assert.ok(mine.text.includes(n));
  assert.equal((await stranger.html(`/order-confirmation?orderNo=${n}`)).status, 404);
  assert.ok((await new Client().html(`/order-confirmation?orderNo=${n}`)).url.includes("/signin"));
  assert.equal((await buyer.html(`/order-confirmation`)).status, 404, "no more fabricated default order");
});

test("customer account shows only that customer's orders", async () => {
  const { variant } = await createProduct(admin, { stock: 20 });
  const a = await customerClient("acctA");
  const b = await customerClient("acctB");
  const oa = (await placeOrder(a, [{ variantId: variant.id, quantity: 1 }])).body.data.orderNumber;
  const ob = (await placeOrder(b, [{ variantId: variant.id, quantity: 1 }])).body.data.orderNumber;

  const pageA = (await a.html("/account")).text;
  assert.ok(pageA.includes(oa));
  assert.ok(!pageA.includes(ob), "no cross-customer data");
  const pageB = (await b.html("/account")).text;
  assert.ok(pageB.includes(ob));
  assert.ok(!pageB.includes(oa));

  const anon = await new Client().html("/account");
  assert.ok(anon.url.includes("/signin"));
  assert.ok(!anon.text.includes("john.anderson"), "no fixture customer shown to signed-out visitors");
});

test("admin bulk order update reports partial failure honestly", async () => {
  const { variant } = await createProduct(admin, { stock: 10 });
  const buyer = await customerClient("bulk");
  const o1 = (await placeOrder(buyer, [{ variantId: variant.id, quantity: 1 }])).body.data.orderNumber;
  const o2 = (await placeOrder(buyer, [{ variantId: variant.id, quantity: 1 }])).body.data.orderNumber;
  await setStatus(o1, "CONFIRMED");
  await setStatus(o1, "PACKED");
  // o1 can ship (with tracking); o2 is still PENDING and must be refused
  const ok = await setStatus(o1, "SHIPPED", { trackingNumber: "BULK1" });
  const refused = await setStatus(o2, "SHIPPED", { trackingNumber: "BULK2" });
  assert.equal(ok.status, 200);
  assert.equal(refused.status, 409);
  assert.equal((await orderOf(o2)).status, "PENDING");
});
