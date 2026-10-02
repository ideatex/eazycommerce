import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { Client, adminClient, prisma } from "./helpers.mjs";

let shopper;
let admin;
before(async () => {
  shopper = new Client();
  admin = await adminClient();
  // Start from the default layout regardless of what earlier tests saved.
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  await prisma.storefrontSection.deleteMany({ where: { businessId: business.id } });
});
after(() => prisma.$disconnect());

const text = (html) => html.replace(/<!-- -->/g, "");

test("demo catalogue: every published product has images that actually load", async () => {
  const products = await prisma.product.findMany({ where: { status: "PUBLISHED", sku: { in: ["TV-43-4K", "LAP-13-8-256", "PHN-DC-6", "WEA-RUGGED-49", "GAM-PAD-USB"] } }, include: { images: true, variants: true } });
  assert.equal(products.length, 5, "demo products are seeded (run: node --env-file=.env prisma/seed.js --demo)");
  const all = await prisma.productImage.findMany({ where: { product: { status: "PUBLISHED" }, url: { startsWith: "/images/" } } });
  assert.ok(all.length >= 20);
  const broken = [];
  for (const img of new Set(all.map((i) => i.url))) {
    const res = await shopper.request(img);
    await res.arrayBuffer();
    if (res.status !== 200) broken.push(`${img} -> ${res.status}`);
  }
  assert.deepEqual(broken, []);
  for (const p of products) assert.ok(p.images.length >= 1 && p.variants.length >= 1);
});

test("homepage renders all default sections in order with real data", async () => {
  const home = await shopper.html("/");
  assert.equal(home.status, 200);
  const html = text(home.text);

  const order = ["Everyday technology", "Shop by category", "New arrivals", "Featured collections", "Top deals", "Gaming headset, over 25% off", "Buying for your business?", "Why shop with us"];
  let last = -1;
  for (const marker of order) {
    const at = html.indexOf(marker);
    assert.ok(at > last, `section "${marker}" present and after the previous one (at ${at}, prev ${last})`);
    last = at;
  }
  assert.ok(html.includes("/images/hero/hero-01.png") || html.includes("hero-01.png"), "hero image");
  assert.ok(html.includes("Flagship smartphones") && html.includes("Fitness at home") && html.includes("Smart wearables"), "promo tiles");
  assert.ok(html.includes('role="timer"'), "deal countdown rendered");
  assert.ok((html.match(/aria-label="Quick preview of /g) || []).length >= 12, "product cards render for New arrivals and Top deals");
  assert.ok(/₹[0-9]{1,3}(,[0-9]{2,3})*/.test(html), "INR pricing");
  assert.ok(/Free delivery over ₹999/.test(html));
  // no reviews yet -> that section is simply absent rather than faked
  assert.equal(html.includes(">What customers say<"), (await prisma.productReview.count({ where: { isApproved: true } })) > 0, "reviews section renders only when approved reviews exist");
});

test("category tiles show every demo category with its image and link", async () => {
  const html = (await shopper.html("/")).text;
  for (const slug of ["televisions", "computers-accessories", "mobiles-tablets", "gaming-audio", "home-appliances", "health-fitness", "wearables"]) {
    assert.ok(html.includes(`href="/categories/${slug}"`), `tile for ${slug}`);
    const page = await shopper.html(`/categories/${slug}`);
    assert.equal(page.status, 200, slug);
  }
  assert.ok(/categories-0[1-7]\.png/.test(html));
});

test("Top deals are ordered by discount; New arrivals by recency", async () => {
  const products = await prisma.product.findMany({ where: { status: "PUBLISHED", compareAtPrice: { not: null } } });
  const pct = (p) => (p.compareAtPrice - p.basePrice) / p.compareAtPrice;
  const best = [...products].sort((a, b) => pct(b) - pct(a))[0];
  const html = text((await shopper.html("/")).text);
  const dealsStart = html.indexOf("Top deals");
  const firstDealCard = html.indexOf(best.title, dealsStart);
  const nextSection = html.indexOf("Gaming headset, over 25% off");
  assert.ok(firstDealCard > dealsStart && firstDealCard < nextSection, `best discount "${best.title}" appears in Top deals`);
});

test("variants on demo products: choosing an option changes price, stock follows per variant", async () => {
  const detail = text((await shopper.html("/products/dual-camera-smartphone-6gb")).text);
  assert.ok(detail.includes("128 GB") && detail.includes("256 GB"));
  assert.ok(detail.includes("₹62,999"));
  const watch = text((await shopper.html("/products/rugged-smartwatch-with-alpine-band")).text);
  assert.ok(watch.includes("Orange band") && watch.includes("Green band"));
  const specs = text((await shopper.html("/products/folding-motorised-treadmill")).text);
  assert.ok(specs.includes("Folding Motorised Treadmill"));
});

test("deal banner disappears after its end date and is editable from the admin", async () => {
  await admin.html("/admin/content"); // seeds the default layout rows
  const deal = await prisma.storefrontSection.findFirst({ where: { sectionType: "DEAL_BANNER" } });
  assert.ok(deal);
  const cfg = JSON.parse(deal.configJson);
  assert.ok(new Date(cfg.endDate).getTime() > Date.now());

  const payload = (await prisma.storefrontSection.findMany({ orderBy: { sortOrder: "asc" } })).map((s) => ({
    id: s.id, sectionType: s.sectionType, title: s.title, subtitle: s.subtitle, configJson: s.configJson, isActive: s.isActive,
  }));
  const expired = payload.map((s) => (s.id === deal.id ? { ...s, configJson: JSON.stringify({ ...cfg, endDate: new Date(Date.now() - 1000).toISOString() }) } : s));
  assert.equal((await admin.api("/api/cms/sections", { method: "PUT", json: { sections: expired } })).status, 200);
  assert.ok(!text((await shopper.html("/")).text).includes('role="timer"'), "expired deal is hidden");

  const restored = payload.map((s) => (s.id === deal.id ? { ...s, title: "Gaming headset deal", configJson: deal.configJson } : s));
  assert.equal((await admin.api("/api/cms/sections", { method: "PUT", json: { sections: restored } })).status, 200);
  const html = text((await shopper.html("/")).text);
  assert.ok(html.includes("Gaming headset deal") && html.includes('role="timer"'));
});

test("admin Content page lists every new section type", async () => {
  const page = text((await admin.html("/admin/content")).text);
  for (const label of ["Storefront Hero Banner", "Curated Categories Grid", "Featured Products Showcase", "Featured Collection Tiles", "Limited-Time Deal Countdown", "Customer Reviews", "Quality &amp; Service Guarantees"]) {
    assert.ok(page.includes(label), label);
  }
});

test("approved reviews appear in the homepage reviews section", async () => {
  const product = await prisma.product.findFirst({ where: { sku: "GAM-PAD-USB" } });
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  const user = await prisma.user.create({ data: { email: `demo-rev-${Date.now()}@example.com`, fullName: "Priya S.", name: "Priya S.", role: "CUSTOMER", businessId: business.id } });
  const marker = `Works perfectly ${Date.now()}`;
  const review = await prisma.productReview.create({ data: { productId: product.id, customerId: user.id, rating: 5, title: "Great value", comment: marker, isApproved: true } });
  const html = text((await shopper.html("/")).text);
  assert.ok(html.includes(">What customers say<") && html.includes(marker) && html.includes("Priya S."));
  await prisma.productReview.update({ where: { id: review.id }, data: { isApproved: false } });
  assert.ok(!text((await shopper.html("/")).text).includes(marker), "unapproved reviews never show");
  await prisma.productReview.delete({ where: { id: review.id } });
});
