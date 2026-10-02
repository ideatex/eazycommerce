import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { Client, adminClient, createProduct, customerClient, makeUser, placeOrder, prisma, uid, RUN } from "./helpers.mjs";

let adminA; // seeded business
let adminB; // a second, separate business
let bizB;
const A = {};

before(async () => {
  adminA = await adminClient();

  bizB = await prisma.business.create({ data: { name: `Tenant B ${uid()}`, slug: `tenant-b-${RUN}-${uid()}` } });
  const email = `adminb-${RUN}-${uid()}@example.com`;
  await makeUser({ email, role: "ADMIN", businessId: bizB.id });
  adminB = new Client("adminB");
  assert.equal(await adminB.login(email, "Test-Pass-123!"), true);

  // Tenant A data created through the real API
  const prod = await createProduct(adminA, { title: `Tenant A Secret ${uid()}`, stock: 10 });
  A.product = prod.product;
  A.variant = prod.variant;
  A.category = (await adminA.api("/api/categories", { method: "POST", json: { name: `A Cat ${uid()}` } })).body.data;
  A.coupon = (await adminA.api("/api/coupons", { method: "POST", json: { code: `ACOUP${RUN}${uid()}`.toUpperCase().slice(0, 20), discountType: "PERCENTAGE", discountValue: 5 } })).body.data;
  A.buyer = await customerClient("tenantA-buyer");
  A.order = (await placeOrder(A.buyer, [{ variantId: A.variant.id, quantity: 1 }])).body.data.orderNumber;
  A.review = await prisma.productReview.create({ data: { productId: A.product.id, customerId: A.buyer.userId, rating: 4, comment: "A review" } });
  A.b2b = await prisma.b2BProfile.create({ data: { userId: A.buyer.userId, companyName: "A Corp", gstin: "33ABCDE1234F1Z5" } });
  A.section = (await prisma.storefrontSection.findFirst({ where: { business: { slug: "vanigam" } } })) || null;
});
after(async () => {
  await prisma.$disconnect();
});

test("tenant B's admin cannot read, change or delete tenant A's records by ID (all 404)", async () => {
  const checks = [
    ["PUT product", () => adminB.api(`/api/products/${A.product.id}`, { method: "PUT", json: { title: "Hijacked" } })],
    ["DELETE product", () => adminB.api(`/api/products/${A.product.id}`, { method: "DELETE" })],
    ["PUT category", () => adminB.api("/api/categories", { method: "PUT", json: { id: A.category.id, name: "Hijacked" } })],
    ["DELETE category", () => adminB.api(`/api/categories?id=${A.category.id}`, { method: "DELETE" })],
    ["PUT coupon", () => adminB.api("/api/coupons", { method: "PUT", json: { id: A.coupon.id, isActive: false } })],
    ["DELETE coupon", () => adminB.api(`/api/coupons?id=${A.coupon.id}`, { method: "DELETE" })],
    ["order status", () => adminB.api(`/api/orders/${A.order}/status`, { method: "POST", json: { status: "CONFIRMED" } })],
    ["inventory adjust", () => adminB.api("/api/inventory/adjust", { method: "POST", json: { variantId: A.variant.id, newStock: 0, reason: "attack" } })],
    ["customer patch", () => adminB.api(`/api/customers/${A.buyer.userId}`, { method: "PATCH", json: { isActive: false } })],
    ["review moderate", () => adminB.api("/api/admin/reviews", { method: "PATCH", json: { id: A.review.id, isApproved: true } })],
    ["review delete", () => adminB.api(`/api/admin/reviews?id=${A.review.id}`, { method: "DELETE" })],
    ["b2b patch", () => adminB.api("/api/b2b/applications", { method: "PATCH", json: { b2bProfileId: A.b2b.id, status: "APPROVED" } })],
    ["invoice", () => adminB.api(`/api/invoices/${A.order}`)],
  ];
  for (const [label, call] of checks) {
    const res = await call();
    assert.equal(res.status, 404, `${label}: expected 404 but got ${res.status} ${JSON.stringify(res.body)}`);
  }

  // Nothing was modified
  const product = await prisma.product.findUnique({ where: { id: A.product.id } });
  assert.notEqual(product.title, "Hijacked");
  assert.equal(product.status, "PUBLISHED");
  assert.equal((await prisma.category.findUnique({ where: { id: A.category.id } })).name.startsWith("A Cat"), true);
  assert.equal((await prisma.coupon.findUnique({ where: { id: A.coupon.id } })).isActive, true);
  assert.equal((await prisma.order.findUnique({ where: { orderNumber: A.order } })).status, "PENDING");
  assert.equal((await prisma.productVariant.findUnique({ where: { id: A.variant.id } })).stock, 10);
  assert.equal((await prisma.user.findUnique({ where: { id: A.buyer.userId } })).isActive, true);
  assert.equal((await prisma.productReview.findUnique({ where: { id: A.review.id } })).isApproved, false);
  assert.equal((await prisma.b2BProfile.findUnique({ where: { id: A.b2b.id } })).status, "PENDING");
});

test("tenant B's admin pages show none of tenant A's data", async () => {
  const pages = [
    ["/admin/products", A.product.title],
    ["/admin/orders", A.order],
    ["/admin/customers", A.buyer.email],
    ["/admin/categories", A.category.name],
    ["/admin/coupons", A.coupon.code],
    ["/admin/reviews", "A review"],
    ["/admin/inventory", A.product.title],
    ["/admin/audit", A.product.title],
  ];
  for (const [path, needle] of pages) {
    const res = await adminB.html(path);
    assert.equal(res.status, 200, path);
    assert.ok(!res.text.includes(needle), `${path} leaked tenant A data: ${needle}`);
  }
  // A customer detail page for another tenant is a 404, not an empty shell
  assert.equal((await adminB.html(`/admin/customers/${A.buyer.userId}`)).status, 404);
  assert.equal((await adminB.html(`/admin/products/${A.product.id}/edit`)).status, 404);
});

test("tenant A's admin still sees and manages its own data", async () => {
  const page = await adminA.html("/admin/products");
  assert.ok(page.text.includes(A.product.title));
  assert.equal((await adminA.api(`/api/invoices/${A.order}`)).status, 200);
  assert.equal((await adminA.api("/api/inventory/adjust", { method: "POST", json: { variantId: A.variant.id, newStock: 12, reason: "own stock" } })).status, 200);
});

test("tenant B manages its own records, scoped to its own business", async () => {
  const cat = await adminB.api("/api/categories", { method: "POST", json: { name: `B Cat ${uid()}` } });
  assert.equal(cat.status, 201);
  assert.equal((await prisma.category.findUnique({ where: { id: cat.body.data.id } })).businessId, bizB.id);

  const prod = await createProduct(adminB, { title: `Tenant B Product ${uid()}`, categoryId: cat.body.data.id, stock: 4 });
  assert.equal(prod.product.businessId, bizB.id);
  assert.ok((await adminB.html("/admin/products")).text.includes(prod.payload.title));
  assert.ok(!(await adminA.html("/admin/products")).text.includes(prod.payload.title), "A does not see B's products");

  // B cannot attach its product to A's category
  const cross = await adminB.api("/api/products", {
    method: "POST",
    json: { title: `Cross ${uid()}`, sku: `X-${RUN}-${uid()}`, basePrice: 10, categoryId: A.category.id },
  });
  assert.equal(cross.status, 400, "category from another tenant is rejected");

  const coupon = await adminB.api("/api/coupons", { method: "POST", json: { code: `BCOUP${RUN}${uid()}`.toUpperCase().slice(0, 20), discountType: "FIXED", discountValue: 10 } });
  assert.equal(coupon.status, 201);
  assert.equal((await prisma.coupon.findUnique({ where: { id: coupon.body.data.id } })).businessId, bizB.id);
});

test("theme and content writes use the caller's business, never an ID from the request", async () => {
  const put = await adminB.api("/api/themes", {
    method: "PUT",
    json: { presetName: "grocery", primaryColor: "#14532d", accentColor: "#15803d", borderRadius: "0.5rem", fontFamily: "Inter", cardStyle: "flat", businessId: A.product.businessId, businessSlug: "vanigam" },
  });
  assert.equal(put.status, 200);
  const themeB = await prisma.themeConfig.findUnique({ where: { id: put.body.data.id } });
  assert.equal(themeB.businessId, bizB.id);

  // B cannot reorder or edit A's homepage sections
  const aSections = await prisma.storefrontSection.findMany({ where: { business: { slug: "vanigam" } } });
  const res = await adminB.api("/api/cms/sections", {
    method: "PUT",
    json: { sections: aSections.slice(0, 1).map((s) => ({ id: s.id, sectionType: s.sectionType, title: "Hijacked", subtitle: "", configJson: "{}", isActive: true })) },
  });
  assert.equal(res.status, 404);
  assert.ok(!(await prisma.storefrontSection.findMany({ where: { business: { slug: "vanigam" } } })).some((s) => s.title === "Hijacked"));

  // B's settings change only B's business
  const before = await prisma.business.findFirst({ where: { slug: "vanigam" } });
  assert.equal((await adminB.api("/api/settings", { method: "PATCH", json: { name: "B Renamed" } })).status, 200);
  assert.equal((await prisma.business.findUnique({ where: { id: bizB.id } })).name, "B Renamed");
  assert.equal((await prisma.business.findFirst({ where: { slug: "vanigam" } })).name, before.name);
});

test("a customer cannot read another customer's order, invoice, or cancel it", async () => {
  const other = await customerClient("snoop");
  assert.equal((await other.api(`/api/invoices/${A.order}`)).status, 404);
  assert.equal((await other.api(`/api/orders/${A.order}/cancel`, { method: "POST", json: {} })).status, 404);
  assert.equal((await other.api(`/api/orders/${A.order}/return-request`, { method: "POST", json: { reason: "x" } })).status, 404);
  assert.equal((await other.html(`/order-confirmation?orderNo=${A.order}`)).status, 404);
  assert.equal((await prisma.order.findUnique({ where: { orderNumber: A.order } })).status, "PENDING");
});
