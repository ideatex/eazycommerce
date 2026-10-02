import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { adminClient, createProduct, customerClient, placeOrder, prisma } from "./helpers.mjs";

let admin;
let businessId;
before(async () => {
  admin = await adminClient();
  businessId = (await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } })).businessId;
});
after(() => prisma.$disconnect());

test("every admin route renders for an admin without errors", async () => {
  const product = await prisma.product.findFirst({ where: { businessId } });
  const customer = await prisma.user.findFirst({ where: { role: "CUSTOMER", businessId } });
  const routes = [
    "/admin",
    "/admin/analytics",
    "/admin/analytics?period=today",
    "/admin/analytics?period=7d",
    "/admin/analytics?period=30d",
    "/admin/audit",
    "/admin/b2b",
    "/admin/categories",
    "/admin/content",
    "/admin/coupons",
    "/admin/customers",
    customer ? `/admin/customers/${customer.id}` : null,
    "/admin/inventory",
    "/admin/orders",
    "/admin/orders?status=PENDING",
    "/admin/products",
    "/admin/products/new",
    product ? `/admin/products/${product.id}/edit` : null,
    "/admin/reviews",
    "/admin/settings",
    "/admin/system-health",
    "/admin/themes",
  ].filter(Boolean);

  const failures = [];
  for (const route of routes) {
    const res = await admin.html(route);
    const bad = res.status !== 200 || /Application error|Internal Server Error|Unhandled Runtime Error|Error: /.test(res.text.slice(0, 200000)) && /digest/.test(res.text);
    if (bad) failures.push(`${route} -> ${res.status}`);
  }
  assert.deepEqual(failures, []);
});

test("removed legacy admin routes are gone", async () => {
  for (const r of ["/admin/dashboard", "/admin/cms", "/admin/finance", "/admin/catalog", "/admin/businesses", "/admin/b2b-orders"]) {
    const res = await admin.request(r, { redirect: "manual" });
    await res.arrayBuffer();
    assert.equal(res.status, 404, `${r} should no longer exist`);
  }
});

test("analytics figures match the database", async () => {
  const buyer = await customerClient("analytics");
  const { variant } = await createProduct(admin, { basePrice: 777, stock: 10 });
  assert.equal((await placeOrder(buyer, [{ variantId: variant.id, quantity: 2 }])).status, 201);

  const orders = await prisma.order.findMany({ where: { businessId } });
  const gross = orders.reduce((a, o) => a + o.grandTotal, 0);
  const tax = orders.reduce((a, o) => a + o.taxTotal, 0);
  const html = (await admin.html("/admin/analytics")).text.replace(/<!-- -->/g, "");
  assert.ok(html.includes(`₹${Math.round(gross).toLocaleString("en-IN")}`), "gross sales matches sum of order totals");
  assert.ok(html.includes(`GST: ₹${Math.round(tax).toLocaleString("en-IN")}`), "GST total matches");

  const dash = (await admin.html("/admin")).text.replace(/<!-- -->/g, "");
  assert.ok(dash.includes(`₹${Math.round(gross).toLocaleString("en-IN")}`), "dashboard revenue matches");
});

test("low-stock alert on the dashboard reflects inventory changes", async () => {
  const { product, variant } = await createProduct(admin, { title: `LowStock ${Date.now()}`, stock: 50 });
  await admin.api("/api/inventory/adjust", { method: "POST", json: { variantId: variant.id, newStock: 3, reason: "test" } });
  const inv = (await admin.html("/admin/inventory")).text;
  assert.ok(inv.includes(product.title));
  assert.ok(/Low Stock/i.test(inv));
});

test("audit log records admin actions with the actor", async () => {
  const res = await admin.api("/api/categories", { method: "POST", json: { name: `Audited ${Date.now()}` } });
  assert.equal(res.status, 201);
  const entry = await prisma.auditLog.findFirst({ where: { action: "CATEGORY_CREATED", entityId: res.body.data.id } });
  assert.ok(entry, "audit entry exists");
  assert.equal(entry.businessId, businessId);
  assert.ok(entry.userId, "actor recorded");
  const page = (await admin.html("/admin/audit")).text;
  assert.ok(page.includes("CATEGORY_CREATED"));
});

test("dashboard widgets show real, tenant-scoped numbers", async () => {
  const buyer = await customerClient("dashw");
  const { product, variant } = await createProduct(admin, { title: `DashW ${Date.now()}`, basePrice: 500, stock: 4 });
  const placed = await placeOrder(buyer, [{ variantId: variant.id, quantity: 2 }]);
  assert.equal(placed.status, 201);

  const html = (await admin.html("/admin")).text.replace(/<!-- -->/g, "");
  for (const label of ["Revenue, last 7 days", "Orders by status", "Top products", "Low stock", "Reviews awaiting approval", "Customers", "Catalogue"]) {
    assert.ok(html.includes(label), `widget "${label}" is present`);
  }

  // revenue widget = non-cancelled orders in the last 7 days
  const since = new Date(Date.now() - 8 * 86400000);
  const live = await prisma.order.findMany({ where: { businessId, createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } } });
  const total = live.reduce((a, o) => a + o.grandTotal, 0);
  assert.ok(html.includes(`₹${Math.round(total).toLocaleString("en-IN")}`), "7-day revenue matches the database");

  // status widget links to the filtered order list
  assert.ok(html.includes("/admin/orders?status=PENDING"));
  // low stock widget shows the lowest-stock variants with their available (stock - reserved) units
  const lowest = await prisma.productVariant.findMany({ where: { stock: { lte: 15 }, product: { businessId } }, include: { product: true }, orderBy: { stock: "asc" }, take: 5 });
  assert.ok(lowest.length > 0);
  for (const v of lowest) assert.ok(html.includes(v.product.title), `low-stock item "${v.product.title}" listed`);
  const first = lowest[0];
  const avail = first.stock - first.reservedStock;
  assert.ok(html.includes(avail <= 0 ? "Out of stock" : `${avail} left`));
  assert.ok(product.id);

  // customers KPI = customers in this business
  const customers = await prisma.user.count({ where: { businessId, role: { in: ["CUSTOMER", "B2B"] } } });
  assert.ok(html.includes(customers.toLocaleString("en-IN")));

  // a cancelled order drops out of revenue
  await admin.api(`/api/orders/${placed.body.data.orderNumber}/status`, { method: "POST", json: { status: "CANCELLED" } });
  const after = (await prisma.order.findMany({ where: { businessId, createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } } })).reduce((a, o) => a + o.grandTotal, 0);
  assert.ok(after < total);
  assert.ok((await admin.html("/admin")).text.replace(/<!-- -->/g, "").includes(`₹${Math.round(after).toLocaleString("en-IN")}`));
});

test("pending reviews widget lists unapproved reviews and counts them", async () => {
  const buyer = await customerClient("dashrev");
  const { product } = await createProduct(admin, { stock: 3 });
  const comment = `Dash review ${Date.now()}`;
  assert.equal((await buyer.api("/api/reviews", { method: "POST", json: { productId: product.id, rating: 4, comment } })).status, 201);
  const html = (await admin.html("/admin")).text.replace(/<!-- -->/g, "");
  assert.ok(html.includes(comment));
  const pending = await prisma.productReview.count({ where: { isApproved: false, product: { businessId } } });
  assert.ok(html.includes(`${pending} pending`));
});
