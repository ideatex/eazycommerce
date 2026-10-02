import test, { after } from "node:test";
import assert from "node:assert/strict";
import { BASE, Client, adminClient, customerClient, makeUser, prisma, RUN, uid } from "./helpers.mjs";

after(() => prisma.$disconnect());

test("unauthenticated requests to admin APIs are rejected with 401", async () => {
  const anon = new Client();
  const calls = [
    ["POST", "/api/products", {}],
    ["PUT", "/api/products/x", {}],
    ["DELETE", "/api/products/x"],
    ["POST", "/api/categories", {}],
    ["POST", "/api/coupons", {}],
    ["PATCH", "/api/settings", {}],
    ["PUT", "/api/themes", {}],
    ["PUT", "/api/cms/sections", {}],
    ["PATCH", "/api/b2b/applications", {}],
    ["PATCH", "/api/customers/x", {}],
    ["POST", "/api/inventory/adjust", {}],
    ["POST", "/api/orders/ORD-X/status", {}],
    ["PATCH", "/api/admin/reviews", {}],
    ["GET", "/api/invoices/ORD-X"],
    ["POST", "/api/checkout", {}],
    ["POST", "/api/reviews", {}],
  ];
  for (const [method, path, json] of calls) {
    const res = await anon.api(path, { method, json });
    assert.equal(res.status, 401, `${method} ${path} should be 401 but was ${res.status}`);
    assert.equal(res.body?.success, false);
  }
  const upload = await anon.request("/api/upload", { method: "POST", body: new FormData() });
  assert.equal(upload.status, 401, "upload must require an admin");
});

test("/admin redirects visitors to sign in and keeps the destination", async () => {
  const res = await new Client().request("/admin/orders");
  assert.equal(res.status, 307);
  const loc = res.headers.get("location");
  assert.match(loc, /\/signin\?callbackUrl=%2Fadmin%2Forders/);
});

test("customer registration: validation, duplicates, no role injection", async () => {
  const anon = new Client();
  const email = `reg-${RUN}-${uid()}@example.com`;

  const bad = await anon.api("/api/auth/register", { method: "POST", json: { name: "A", email: "not-an-email", password: "longenough1" } });
  assert.equal(bad.status, 400);
  const weak = await anon.api("/api/auth/register", { method: "POST", json: { name: "A", email, password: "short" } });
  assert.equal(weak.status, 400);

  const ok = await anon.api("/api/auth/register", {
    method: "POST",
    json: { name: "Reg User", email, password: "Reg-Pass-12345", role: "SUPER_ADMIN", isActive: true, businessId: "x" },
  });
  assert.equal(ok.status, 201, JSON.stringify(ok.body));

  const row = await prisma.user.findUnique({ where: { email } });
  assert.equal(row.role, "CUSTOMER", "a caller cannot choose their own role");
  assert.ok(row.password && row.password !== "Reg-Pass-12345", "password must be stored hashed");

  const dup = await anon.api("/api/auth/register", { method: "POST", json: { name: "Reg User", email: email.toUpperCase(), password: "Reg-Pass-12345" } });
  assert.equal(dup.status, 409);
});

test("sign-in: wrong password and unknown users fail; correct password works", async () => {
  const cust = await customerClient("login");
  const fresh = new Client();
  assert.equal(await fresh.login(cust.email, "wrong-password"), false);
  assert.equal(await fresh.login(`nobody-${uid()}@example.com`, "whatever"), false);
  assert.equal(await fresh.login(cust.email, "Test-Pass-123!"), true);
});

test("the former demo-account backdoors no longer sign anyone in", async () => {
  for (const email of ["admin@vanigam.com", "admin@example.com", "supplier@techflow.com", `anyone-${uid()}@example.com`]) {
    const c = new Client();
    assert.equal(await c.login(email, "admin123"), false, `${email} must not authenticate with an arbitrary password`);
  }
});

test("customers are blocked from every admin API (403) and from /admin pages", async () => {
  const cust = await customerClient("blocked");
  const calls = [
    ["POST", "/api/products", {}],
    ["POST", "/api/categories", { name: "x" }],
    ["POST", "/api/coupons", {}],
    ["PATCH", "/api/settings", { name: "Hacked" }],
    ["PUT", "/api/themes", {}],
    ["POST", "/api/inventory/adjust", {}],
    ["POST", "/api/orders/ORD-X/status", { status: "SHIPPED" }],
    ["PATCH", "/api/customers/x", { isActive: false }],
  ];
  for (const [method, path, json] of calls) {
    const res = await cust.api(path, { method, json });
    assert.equal(res.status, 403, `${method} ${path} should be 403 for a customer, got ${res.status}`);
  }
  const page = await cust.request("/admin");
  assert.equal(page.status, 307);
  assert.match(page.headers.get("location"), /AccessDenied/);

  const upload = await cust.request("/api/upload", { method: "POST", body: new FormData() });
  assert.equal(upload.status, 403);
});

test("non-staff roles (B2B buyer) cannot use the admin panel", async () => {
  const business = await prisma.business.findFirst();
  const email = `b2b-${RUN}-${uid()}@example.com`;
  await makeUser({ email, role: "B2B", businessId: business.id });
  const v = new Client();
  assert.equal(await v.login(email, "Test-Pass-123!"), true);
  assert.equal((await v.api("/api/products", { method: "POST", json: {} })).status, 403);
  assert.equal((await v.request("/admin")).status, 307);
});

test("staff can run day-to-day operations but not admin-only areas", async () => {
  const business = await prisma.business.findFirst();
  const email = `staff-${RUN}-${uid()}@example.com`;
  await makeUser({ email, role: "STAFF", businessId: business.id });
  const staff = new Client();
  assert.equal(await staff.login(email, "Test-Pass-123!"), true);

  const cat = await staff.api("/api/categories", { method: "POST", json: { name: `Staff Cat ${uid()}` } });
  assert.equal(cat.status, 201, "staff manage categories");

  for (const [method, path, json] of [
    ["PATCH", "/api/settings", { name: "Nope" }],
    ["PUT", "/api/themes", {}],
    ["PATCH", "/api/b2b/applications", {}],
  ]) {
    const res = await staff.api(path, { method, json });
    assert.equal(res.status, 403, `${method} ${path} must be admin-only`);
  }
  const page = await staff.request("/admin/orders");
  assert.equal(page.status, 200, "staff may open the admin panel");
});

test("a deactivated account loses access immediately, even with a valid session cookie", async () => {
  const cust = await customerClient("deact");
  const before = await cust.api("/api/checkout", { method: "POST", json: {} });
  assert.notEqual(before.status, 401, "signed-in request reaches validation");

  await prisma.user.update({ where: { id: cust.userId }, data: { isActive: false } });
  const after = await cust.api("/api/checkout", { method: "POST", json: {} });
  assert.equal(after.status, 401, "deactivated users are treated as signed out");
});

test("a role downgrade takes effect without waiting for the JWT to expire", async () => {
  const business = await prisma.business.findFirst();
  const email = `demote-${RUN}-${uid()}@example.com`;
  const user = await makeUser({ email, role: "ADMIN", businessId: business.id });
  const c = new Client();
  assert.equal(await c.login(email, "Test-Pass-123!"), true);
  assert.equal((await c.api("/api/categories", { method: "POST", json: { name: `Demote ${uid()}` } })).status, 201);

  await prisma.user.update({ where: { id: user.id }, data: { role: "CUSTOMER" } });
  assert.equal((await c.api("/api/categories", { method: "POST", json: { name: `Demote ${uid()}` } })).status, 403);
});

test("health endpoint exposes runtime details only to admins", async () => {
  const anon = await new Client().api("/api/health");
  assert.equal(anon.status, 200);
  assert.equal(anon.body.status, "healthy");
  assert.equal(anon.body.checks, undefined, "no internals for the public");

  const admin = await adminClient();
  const detailed = await admin.api("/api/health");
  assert.equal(detailed.body.checks.database.status, "healthy");
  assert.ok(typeof detailed.body.checks.memory.heapUsedMB === "number");
});

test("Stripe webhook refuses unsigned events and cannot mark orders paid", async () => {
  const res = await new Client().api("/api/webhook/stripe", {
    method: "POST",
    json: { id: "evt_fake", type: "checkout.session.completed", data: { object: { metadata: { orderNumber: "ORD-X" }, payment_status: "paid" } } },
  });
  assert.ok([400, 503].includes(res.status), `unsigned webhook must be refused, got ${res.status}`);
});

test("registration is rate limited", async () => {
  const anon = new Client();
  let limited = false;
  for (let i = 0; i < 8; i++) {
    const res = await anon.api("/api/auth/register", { method: "POST", json: { name: "x", email: "bad", password: "x" } });
    if (res.status === 429) {
      limited = true;
      break;
    }
  }
  assert.ok(limited, "repeated registration attempts from one client are throttled");
});
