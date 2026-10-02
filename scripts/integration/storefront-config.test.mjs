import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { Client, adminClient, prisma, uid, RUN } from "./helpers.mjs";

let admin;
let shopper;
before(async () => {
  admin = await adminClient();
  shopper = new Client();
});
after(() => prisma.$disconnect());

test("Workflow H: business settings persist, validate, and reach the storefront footer", async () => {
  const phone = `+91 44 ${Math.floor(1000 + Math.random() * 8999)} ${Math.floor(1000 + Math.random() * 8999)}`;
  const email = `hello-${RUN}@shop.example`;
  const patch = (json) => admin.api("/api/settings", { method: "PATCH", json });

  assert.equal((await patch({ gstin: "BADGSTIN" })).status, 400);
  assert.equal((await patch({ commerceMode: "RETAIL" })).status, 400);
  assert.equal((await patch({ email: "not-an-email" })).status, 400);
  assert.equal((await patch({ name: "   " })).status, 400);
  assert.equal((await patch({ currency: "rupees" })).status, 400);
  assert.equal((await patch({ state: "" })).status, 400);
  assert.equal((await patch({ name: "x".repeat(400) })).status, 400);

  const ok = await patch({
    name: "Vanigam Test Store",
    gstin: "33abcde1234f1z5",
    phone,
    email,
    address: "1 Test Road",
    city: "Chennai",
    postalCode: "600001",
    commerceMode: "B2C",
  });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));

  const row = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert.equal(row.gstin, "33ABCDE1234F1Z5", "GSTIN is normalised to upper case");
  assert.equal(row.commerceMode, "B2C");
  assert.equal(row.phone, phone);

  // The admin settings page reads the stored values back (persistence after reload)
  const page = await admin.html("/admin/settings");
  assert.ok(page.text.includes("33ABCDE1234F1Z5"));
  assert.ok(page.text.includes("Vanigam Test Store"));

  // The public footer uses the configured contact details
  const home = (await shopper.html("/")).text;
  assert.ok(home.includes(email), "footer email comes from settings");
  assert.ok(home.includes(phone), "footer phone comes from settings");
  assert.ok(home.includes("1 Test Road"), "footer address comes from settings");
  assert.ok(!home.includes("685 Market Street"), "placeholder address is gone");
  assert.ok(!home.includes("support@example.com"), "placeholder email is gone");

  // Clearing a field removes it from the footer
  await patch({ phone: "" });
  assert.ok(!(await shopper.html("/")).text.includes(phone));
  assert.ok(await prisma.auditLog.findFirst({ where: { action: "SETTINGS_UPDATED" } }));
});

test("themes: validated, persisted, applied to the storefront, injection impossible", async () => {
  const put = (json) => admin.api("/api/themes", { method: "PUT", json });
  const base = { presetName: "luxe", primaryColor: "#18181b", accentColor: "#c5a059", borderRadius: "0.25rem", fontFamily: "Inter, system-ui, sans-serif", cardStyle: "flat" };

  assert.equal((await put({ ...base, presetName: "neon" })).status, 400);
  assert.equal((await put({ ...base, primaryColor: "red" })).status, 400);
  assert.equal((await put({ ...base, accentColor: "#12345" })).status, 400);
  assert.equal((await put({ ...base, accentColor: "#c5a059;}</style><script>alert(1)</script>" })).status, 400);
  assert.equal((await put({ ...base, borderRadius: "1em; color:red" })).status, 400);
  assert.equal((await put({ ...base, fontFamily: "x;}</style><script>alert(1)</script>" })).status, 400);
  assert.equal((await put({ ...base, cardStyle: "glass" })).status, 400);

  const ok = await put({ ...base, businessSlug: "someone-elses-business" });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));

  const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  const active = await prisma.themeConfig.findMany({ where: { isActive: true, businessId: adminUser.businessId } });
  assert.equal(active.length, 1, "exactly one active theme");
  assert.equal(active[0].accentColor, "#c5a059");
  assert.equal(active[0].businessId, adminUser.businessId, "business comes from the session, not the request body");

  const html = (await shopper.html("/")).text;
  assert.ok(html.includes("--color-blue:#c5a059"), "storefront uses the saved accent colour");
  assert.ok(html.includes("--color-dark:#18181b"));
  assert.ok(html.includes('data-theme="luxe"'));

  // Saving again deactivates the previous theme
  await put({ ...base, presetName: "tech", accentColor: "#0284c7", primaryColor: "#020617" });
  assert.equal(await prisma.themeConfig.count({ where: { isActive: true, businessId: adminUser.businessId } }), 1);
  assert.ok((await shopper.html("/")).text.includes("--color-blue:#0284c7"));

  // The admin theme page loads the saved theme back
  assert.ok((await admin.html("/admin/themes")).text.includes("#0284c7"));
});

test("content: admin edits reorder, retitle, hide and secure the homepage sections", async () => {
  // Visiting the admin page seeds the default sections
  const page = await admin.html("/admin/content");
  assert.equal(page.status, 200);
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  let sections = await prisma.storefrontSection.findMany({ where: { businessId: business.id }, orderBy: { sortOrder: "asc" } });
  assert.ok(sections.length >= 9);

  const put = (list) => admin.api("/api/cms/sections", { method: "PUT", json: { sections: list } });
  const toPayload = (rows) => rows.map((s) => ({ id: s.id, sectionType: s.sectionType, title: s.title, subtitle: s.subtitle, configJson: s.configJson, isActive: s.isActive }));

  // validation
  assert.equal((await put([])).status, 400);
  assert.equal((await put([{ id: "ghost", sectionType: "HERO", configJson: "{}", isActive: true }])).status, 404);
  assert.equal((await put([{ ...toPayload(sections)[0], sectionType: "EVIL" }])).status, 400);
  assert.equal((await put([{ ...toPayload(sections)[0], configJson: "{not json" }])).status, 400);
  assert.equal((await put([{ ...toPayload(sections)[0], configJson: "[1,2]" }])).status, 400);
  assert.equal((await put([{ ...toPayload(sections)[0], isActive: "yes" }])).status, 400);

  // retitle the hero, point the CTA at a javascript: URL, move categories first, hide the promo banner
  const headline = `Handmade ${uid()} for everyone`;
  const payload = toPayload(sections);
  const hero = payload.find((s) => s.sectionType === "HERO");
  hero.title = headline;
  hero.configJson = JSON.stringify({ ...JSON.parse(hero.configJson), ctaText: "Go", ctaUrl: "javascript:alert(1)", secondaryUrl: "//evil.example", imageUrl: "javascript:alert(2)" });
  const promo = payload.find((s) => s.sectionType === "PROMO_BANNER");
  promo.isActive = false;
  const reordered = [payload.find((s) => s.sectionType === "FEATURED_CATEGORIES"), ...payload.filter((s) => s.sectionType !== "FEATURED_CATEGORIES")];

  const saved = await put(reordered);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.data.sections[0].sectionType, "FEATURED_CATEGORIES");
  sections = await prisma.storefrontSection.findMany({ where: { businessId: business.id }, orderBy: { sortOrder: "asc" } });
  assert.equal(sections[0].sectionType, "FEATURED_CATEGORIES", "order persisted");

  const html = (await shopper.html("/")).text;
  assert.ok(html.includes(headline), "storefront shows the new headline");
  assert.ok(!html.includes("Buying for your business?"), "hidden section is not rendered");
  assert.ok(!/href="javascript:/i.test(html), "javascript: CTA links are neutralised");
  assert.ok(!html.includes('href="//evil.example"'), "protocol-relative links are neutralised");
  assert.ok(html.indexOf("Shop by category") < html.indexOf(headline), "section order follows the admin ordering");

  // The admin page loads the saved state back
  assert.ok((await admin.html("/admin/content")).text.includes(headline));

  // The shipped default links all point at real routes
  for (const s of await prisma.storefrontSection.findMany({ where: { businessId: business.id } })) {
    const cfg = JSON.parse(s.configJson);
    for (const key of ["ctaUrl", "secondaryUrl"]) {
      if (typeof cfg[key] === "string" && cfg[key].startsWith("/") && s.sectionType !== "HERO") {
        const res = await shopper.request(cfg[key].split("?")[0]);
        assert.ok(res.status < 400, `${s.sectionType}.${key} -> ${cfg[key]} returned ${res.status}`);
      }
    }
  }
});

test("storefront has no fixture content: no mock products, fake offers or placeholder numbers", async () => {
  const pages = ["/", "/shop-with-sidebar", "/cart", "/contact"];
  for (const p of pages) {
    const html = (await shopper.html(p)).text;
    for (const needle of ["Havit HV-G69", "Velocity Tech Store", "Apple Watch Ultra", "john.anderson", "TechFlow", "Alex Morgan"]) {
      assert.ok(!html.includes(needle), `${p} still contains fixture text "${needle}"`);
    }
  }
});

test("contact form and newsletter persist to the database and are rate limited", async () => {
  const c = new Client();
  const email = `contact-${RUN}-${uid()}@example.com`;

  assert.equal((await c.api("/api/contact", { method: "POST", json: { fullName: "A", email: "bad", message: "hi" } })).status, 400);
  assert.equal((await c.api("/api/contact", { method: "POST", json: { fullName: "", email, message: "hi" } })).status, 400);
  assert.equal((await c.api("/api/contact", { method: "POST", json: { fullName: "A", email, message: "" } })).status, 400);

  const ok = await c.api("/api/contact", { method: "POST", json: { fullName: "Pat Doe", email, subject: "Question", message: "Where is my order?" } });
  assert.equal(ok.status, 201);
  const row = await prisma.contactMessage.findFirst({ where: { email } });
  assert.equal(row.message, "Where is my order?");
  assert.equal(row.isHandled, false);

  const n = `news-${RUN}-${uid()}@example.com`;
  assert.equal((await c.api("/api/newsletter", { method: "POST", json: { email: "nope" } })).status, 400);
  assert.equal((await c.api("/api/newsletter", { method: "POST", json: { email: n } })).status, 201);
  assert.equal((await c.api("/api/newsletter", { method: "POST", json: { email: n.toUpperCase() } })).status, 201, "re-subscribing is fine");
  assert.equal(await prisma.newsletterSubscriber.count({ where: { email: n } }), 1, "no duplicates");

  const spam = new Client();
  const codes = [];
  for (let i = 0; i < 8; i++) codes.push((await spam.api("/api/contact", { method: "POST", json: { fullName: "S", email, message: "spam" } })).status);
  assert.ok(codes.includes(429), `contact form is throttled, got ${codes}`);
});

test("search only exposes public catalogue data", async () => {
  const s = new Client();
  assert.deepEqual((await s.api("/api/search?q=a")).body.data, { products: [] });
  assert.deepEqual((await s.api("/api/search")).body.data, { products: [] });
  const res = await s.api("/api/search?q=Smart%20LED");
  assert.equal(res.status, 200);
  const hit = res.body.data.products.find((p) => /Smart LED/.test(p.title));
  assert.ok(hit);
  assert.deepEqual(Object.keys(hit).sort(), ["category", "id", "image", "price", "slug", "title"], "no internal fields leak");
  const injection = await s.api(`/api/search?q=${encodeURIComponent("' OR 1=1 --")}`);
  assert.equal(injection.status, 200);
  assert.deepEqual(injection.body.data.products, []);
});

test("every internal link on the main storefront pages resolves (no 404s)", async () => {
  const seen = new Set();
  const queue = ["/", "/shop-with-sidebar", "/contact", "/faq", "/privacy-policy", "/terms-conditions", "/cart", "/signin", "/signup", "/popular"];
  const broken = [];
  for (const path of queue) {
    const res = await shopper.request(path, { redirect: "follow" });
    const html = await res.text();
    if (res.status >= 400) broken.push(`${path} -> ${res.status}`);
    for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
      const href = m[1];
      if (href.startsWith("/_next") || href.startsWith("/images") || href.startsWith("/uploads") || href.startsWith("/api") || /\.\w{2,4}$/.test(href)) continue;
      if (seen.has(href)) continue;
      seen.add(href);
      const r = await shopper.request(href, { redirect: "manual" });
      await r.arrayBuffer();
      if (r.status >= 400) broken.push(`${href} (linked from ${path}) -> ${r.status}`);
    }
  }
  assert.deepEqual(broken, [], `broken links:\n${broken.join("\n")}`);
});
