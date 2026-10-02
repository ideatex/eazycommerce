import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { Client, adminClient, createProduct, customerClient, placeOrder, prisma } from "./helpers.mjs";

let admin;
before(async () => {
  admin = await adminClient();
});
after(() => prisma.$disconnect());

test("B2B: approval changes the role, credit limits are guarded, wholesale tiers apply to approved accounts only", async () => {
  const buyer = await customerClient("b2b");
  const retail = await customerClient("retail");
  const profile = await prisma.b2BProfile.create({
    data: { userId: buyer.userId, companyName: "Acme Traders", gstin: "33ABCDE1234F1Z5", creditLimit: 0, availableCredit: 0, paymentTermsDays: 30 },
  });
  const { variant } = await createProduct(admin, {
    basePrice: 1000,
    stock: 100,
    priceTiers: [
      { minQuantity: 5, price: 900 },
      { minQuantity: 10, price: 800 },
    ],
  });
  const items = [{ variantId: variant.id, quantity: 10 }];
  const unit = async (client) => (await client.api("/api/checkout/quote", { method: "POST", json: { items } })).body.data.lines[0].unitPrice;

  assert.equal(await unit(buyer), 1000, "pending B2B account pays retail");
  assert.ok((await admin.html("/admin/b2b")).text.includes("Acme Traders"));

  const patch = (json) => admin.api("/api/b2b/applications", { method: "PATCH", json: { b2bProfileId: profile.id, ...json } });
  assert.equal((await patch({ status: "MAYBE" })).status, 400);
  assert.equal((await patch({})).status, 400);
  assert.equal((await patch({ creditLimit: -5 })).status, 400);
  assert.equal((await patch({ status: "APPROVED" })).status, 200);
  assert.equal((await prisma.user.findUnique({ where: { id: buyer.userId } })).role, "B2B");

  assert.equal(await unit(buyer), 800);
  assert.equal(await unit(retail), 1000, "retail customers never get wholesale tiers");
  const five = (await buyer.api("/api/checkout/quote", { method: "POST", json: { items: [{ variantId: variant.id, quantity: 5 }] } })).body.data;
  assert.equal(five.lines[0].unitPrice, 900);

  const placed = await placeOrder(buyer, items);
  assert.equal(placed.status, 201);
  assert.equal((await prisma.order.findUnique({ where: { orderNumber: placed.body.data.orderNumber } })).subtotal, 8000);

  await patch({ creditLimit: 100000 });
  await prisma.b2BProfile.update({ where: { id: profile.id }, data: { availableCredit: 40000 } });
  assert.equal((await patch({ creditLimit: 70000, availableCredit: 999999 })).status, 200);
  assert.equal((await prisma.b2BProfile.findUnique({ where: { id: profile.id } })).availableCredit, 10000, "availableCredit is derived, not trusted");
  assert.equal((await patch({ creditLimit: 50000 })).status, 409, "limit cannot drop below credit in use");

  await patch({ status: "REJECTED" });
  assert.equal((await prisma.user.findUnique({ where: { id: buyer.userId } })).role, "CUSTOMER");
  assert.equal(await unit(buyer), 1000);
});

test("customer admin: list, detail, deactivate, notes, and scoping", async () => {
  const c = await customerClient("cadmin");
  const patch = (json, id = c.userId) => admin.api(`/api/customers/${id}`, { method: "PATCH", json });

  assert.ok((await admin.html("/admin/customers")).text.includes(c.email));
  const detail = await admin.html(`/admin/customers/${c.userId}`);
  assert.equal(detail.status, 200);
  assert.ok(detail.text.includes(c.email));

  assert.equal((await patch({ isActive: "no" })).status, 400);
  assert.equal((await patch({ notes: 123 })).status, 400);
  assert.equal((await patch({ notes: "x".repeat(5000) })).status, 400);
  assert.equal((await patch({ notes: "VIP, prefers email" })).status, 200);
  assert.equal((await prisma.customerProfile.findUnique({ where: { userId: c.userId } })).notes, "VIP, prefers email");

  assert.equal((await patch({ isActive: false })).status, 200);
  assert.equal((await c.api("/api/checkout", { method: "POST", json: {} })).status, 401);
  assert.equal(await new Client().login(c.email, "Test-Pass-123!"), false);
  assert.equal((await patch({ isActive: true })).status, 200);
  assert.equal(await new Client().login(c.email, "Test-Pass-123!"), true);

  const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  assert.equal((await patch({ isActive: false }, adminUser.id)).status, 404);
  assert.equal((await patch({ isActive: false }, "ghost")).status, 404);
});
