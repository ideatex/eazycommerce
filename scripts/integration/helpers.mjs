import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

export const BASE = process.env.TEST_BASE_URL || "http://localhost:3100";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 }),
});

/** Minimal cookie-jar HTTP client (NextAuth session cookies included). */
export class Client {
  constructor(label = "anon") {
    this.label = label;
    this.jar = new Map();
    this.userId = null;
  }

  cookieHeader() {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  storeCookies(res) {
    const list = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    for (const c of list) {
      const [pair] = c.split(";");
      const idx = pair.indexOf("=");
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (!value || /expires=Thu, 01 Jan 1970/i.test(c)) this.jar.delete(name);
      else this.jar.set(name, value);
    }
  }

  async request(path, { method = "GET", json, form, headers = {}, redirect = "manual", body } = {}) {
    const h = { ...headers };
    const cookie = this.cookieHeader();
    if (cookie) h.cookie = cookie;
    let payload = body;
    if (json !== undefined) {
      h["content-type"] = "application/json";
      payload = JSON.stringify(json);
    } else if (form) {
      h["content-type"] = "application/x-www-form-urlencoded";
      payload = new URLSearchParams(form).toString();
    }
    const res = await fetch(`${BASE}${path}`, { method, headers: h, body: payload, redirect });
    this.storeCookies(res);
    return res;
  }

  /** JSON helper: returns { status, body }. */
  async api(path, opts = {}) {
    const res = await this.request(path, opts);
    let body = null;
    const type = res.headers.get("content-type") || "";
    if (type.includes("json")) body = await res.json().catch(() => null);
    else await res.arrayBuffer().catch(() => null);
    return { status: res.status, body, res };
  }

  async html(path) {
    const res = await this.request(path, { redirect: "follow" });
    return { status: res.status, text: await res.text(), url: res.url };
  }

  async login(email, password) {
    const csrf = await this.api("/api/auth/csrf");
    const res = await this.request("/api/auth/callback/credentials", {
      method: "POST",
      form: { csrfToken: csrf.body.csrfToken, email, password, json: "true" },
    });
    await res.text();
    const session = await this.api("/api/auth/session");
    this.userId = session.body?.user?.id ?? null;
    return !!this.userId;
  }
}

export async function makeUser({ email, password = "Test-Pass-123!", role = "CUSTOMER", businessId = null, fullName = "Test User", isActive = true }) {
  return prisma.user.create({
    data: {
      email,
      name: fullName,
      fullName,
      role,
      businessId,
      isActive,
      password: await bcrypt.hash(password, 4),
      customerProfile: { create: {} },
    },
  });
}

export const uid = () => Math.random().toString(36).slice(2, 8);
export const RUN = Date.now().toString(36);

export const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

export const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@test.local";
export const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Adm1n-Test-Pass!";

export async function adminClient() {
  const c = new Client("admin");
  const ok = await c.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  if (!ok) throw new Error("Admin login failed. Did you seed the test database?");
  return c;
}

export async function customerClient(label = "cust") {
  const email = `${label}-${RUN}-${uid()}@example.com`;
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  const user = await makeUser({ email, businessId: business.id, fullName: `${label} user` });
  const c = new Client(label);
  const ok = await c.login(email, "Test-Pass-123!");
  if (!ok) throw new Error("Customer login failed");
  c.email = email;
  c.user = user;
  return c;
}

export function productPayload(over = {}) {
  const sku = (over.sku || `SKU-${RUN}-${uid()}`).toUpperCase();
  return {
    title: `Test Product ${uid()}`,
    sku,
    description: "A test product",
    shortDescription: "Short blurb",
    basePrice: 1000,
    compareAtPrice: null,
    costPrice: 600,
    categoryId: null,
    moq: 1,
    hsnCode: "9403.60.00",
    taxRatePercent: 18,
    status: "PUBLISHED",
    tags: "alpha, beta",
    images: ["/images/placeholder.svg"],
    priceTiers: [],
    variants: [{ title: "Standard", sku, price: over.basePrice ?? 1000, stock: over.stock ?? 10, attributesJson: "{}" }],
    ...over,
    sku,
  };
}

export async function createProduct(admin, over = {}) {
  const payload = productPayload(over);
  const res = await admin.api("/api/products", { method: "POST", json: payload });
  if (res.status !== 201) throw new Error(`createProduct failed: ${res.status} ${JSON.stringify(res.body)}`);
  const row = await prisma.product.findUnique({ where: { id: res.body.data.id }, include: { variants: true } });
  return { payload, product: row, variant: row.variants[0], res };
}

export const validAddress = (over = {}) => ({
  name: "Test Buyer",
  phone: "+91 98765 43210",
  streetAddress: "12 Test Street",
  apartment: "Flat 4",
  city: "Chennai",
  state: "Tamil Nadu",
  postalCode: "600001",
  country: "India",
  ...over,
});

export async function placeOrder(client, items, over = {}) {
  return client.api("/api/checkout", {
    method: "POST",
    json: { items, paymentMethod: "COD", address: validAddress(), ...over },
  });
}
