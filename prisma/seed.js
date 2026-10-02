/**
 * Idempotent seed.
 *
 *   node --env-file=.env prisma/seed.js              # business + admin account
 *   node --env-file=.env prisma/seed.js --demo       # ... plus a small demo catalogue
 *
 * The admin account needs SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (min 8 chars).
 * There are deliberately no default credentials.
 */
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX || 5),
  }),
});

const DEMO = process.argv.includes("--demo");

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  if (!email || password.length < 8) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (at least 8 characters) before seeding.");
  }

  const business =
    (await prisma.business.findFirst({ orderBy: { createdAt: "asc" } })) ||
    (await prisma.business.create({ data: { name: "Vanigam Commerce", slug: "vanigam" } }));

  await prisma.user.upsert({
    where: { email },
    update: { role: "SUPER_ADMIN", isActive: true, businessId: business.id },
    create: {
      email,
      name: "Platform Administrator",
      fullName: "Platform Administrator",
      password: await bcrypt.hash(password, 12),
      role: "SUPER_ADMIN",
      businessId: business.id,
    },
  });
  console.log(`Admin account ready: ${email}`);

  if (!DEMO) return;

  const { categories, products } = require("./demo-data");
  const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Replace the earlier furniture demo set, if present, so the two never mix.
  const legacySkus = ["DESK-TEAK-01", "SET-STONE-16", "KIT-FAST-500"];
  await prisma.product.deleteMany({ where: { sku: { in: legacySkus } } });
  await prisma.category.deleteMany({ where: { slug: { in: ["furniture", "tableware", "industrial-hardware"] }, products: { none: {} } } });

  const cat = {};
  for (const [i, c] of categories.entries()) {
    cat[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, imageUrl: c.img, sortOrder: i, isActive: true },
      create: { businessId: business.id, name: c.name, slug: c.slug, imageUrl: c.img, sortOrder: i },
    });
  }

  let created = 0;
  for (const p of products) {
    const slug = slugify(p.title);
    if (await prisma.product.findUnique({ where: { slug } })) continue;
    const variants = p.variants
      ? p.variants.map((v, i) => ({ title: v.title, sku: v.sku, price: v.price, stock: v.stock, attributesJson: JSON.stringify(v.attrs || {}), isDefault: i === 0 }))
      : [{ title: "Standard", sku: p.sku, price: p.price, stock: p.stock, attributesJson: "{}", isDefault: true }];
    const row = await prisma.product.create({
      data: {
        businessId: business.id,
        title: p.title,
        slug,
        sku: p.sku,
        description: p.description,
        shortDescription: p.short,
        basePrice: p.price,
        compareAtPrice: p.compare ?? null,
        taxRatePercent: p.tax,
        hsnCode: p.hsn ?? null,
        tags: p.tags,
        status: "PUBLISHED",
        categoryId: cat[p.category].id,
        images: { create: p.images.map((url, i) => ({ url, altText: p.title, sortOrder: i })) },
        variants: { create: variants },
        additionalInformation: { create: (p.specs || []).map(([name, description]) => ({ name, description })) },
      },
      include: { variants: true },
    });
    for (const v of row.variants) {
      if (v.stock > 0) {
        await prisma.stockMovement.create({
          data: { variantId: v.id, type: "INITIAL", quantity: v.stock, previousStock: 0, newStock: v.stock, notes: "Demo seed" },
        });
      }
    }
    created++;
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { businessId: business.id, code: "WELCOME10", description: "10% off your first order", discountType: "PERCENTAGE", discountValue: 10, minOrderValue: 1000, maxDiscount: 2000 },
  });

  // Placeholder store details for the footer/invoices, only where the admin has not set any.
  if (!business.email && !business.phone && !business.address) {
    await prisma.business.update({
      where: { id: business.id },
      data: { email: "care@vanigam.example", phone: "+91 44 4000 0000", address: "12 Demo Street", city: "Chennai", postalCode: "600001" },
    });
  }

  // Homepage: clear saved sections so the default layout applies (the admin can then edit it).
  await prisma.storefrontSection.deleteMany({ where: { businessId: business.id } });

  console.log(`Demo catalogue ready: ${categories.length} categories, ${created} new products (${products.length} in the set).`);
}

main()
  .catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
