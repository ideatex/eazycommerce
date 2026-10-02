import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Client, PNG_1X1, adminClient, createProduct, customerClient, prisma, productPayload, uid, RUN } from "./helpers.mjs";

let admin;
let shopper;
before(async () => {
  admin = await adminClient();
  shopper = new Client("shopper"); // anonymous storefront visitor
});
after(() => prisma.$disconnect());

test("Workflow A: draft is invisible, publishing makes it appear everywhere, detail page matches the database", async () => {
  const title = `Workflow A Chair ${uid()}`;
  const { product, variant } = await createProduct(admin, { title, status: "DRAFT", basePrice: 2499, compareAtPrice: 2999, stock: 7 });

  // DRAFT: not reachable and not listed or searchable
  assert.equal((await shopper.html(`/products/${product.slug}`)).status, 404);
  const listing = await shopper.html("/shop-with-sidebar");
  assert.ok(!listing.text.includes(title), "draft must not be listed");
  const search = await shopper.api(`/api/search?q=${encodeURIComponent(title)}`);
  assert.equal(search.body.data.products.length, 0, "draft must not be searchable");

  // Publish
  const pub = await admin.api(`/api/products/${product.id}`, { method: "PUT", json: { status: "PUBLISHED" } });
  assert.equal(pub.status, 200);

  const detail = await shopper.html(`/products/${product.slug}`);
  assert.equal(detail.status, 200);
  assert.ok(detail.text.includes(title));
  assert.ok(detail.text.includes("₹2,499"), "selling price shown");
  assert.ok(detail.text.includes("₹2,999"), "list price shown as strike-through");
  assert.ok(detail.text.includes("7 available"), "availability matches stock");

  const listed = await shopper.html("/shop-with-sidebar");
  assert.ok(listed.text.includes(title), "published product is listed");
  const found = await shopper.api(`/api/search?q=${encodeURIComponent(title)}`);
  assert.equal(found.body.data.products.length, 1);
  assert.equal(found.body.data.products[0].price, 2499);

  // The database agrees with what the storefront shows
  const row = await prisma.product.findUnique({ where: { id: product.id }, include: { variants: true } });
  assert.equal(row.status, "PUBLISHED");
  assert.equal(row.basePrice, 2499);
  assert.equal(row.variants[0].stock, 7);
  assert.equal(row.variants[0].id, variant.id);
});

test("Workflow B: edits persist and propagate to the storefront after reload", async () => {
  const { product, variant } = await createProduct(admin, { title: `Workflow B ${uid()}`, basePrice: 1000, stock: 5 });
  const newTitle = `Workflow B Renamed ${uid()}`;

  const upd = await admin.api(`/api/products/${product.id}`, {
    method: "PUT",
    json: { title: newTitle, basePrice: 1250, compareAtPrice: 1500, description: "Updated description", stock: 9, images: ["/images/placeholder.svg", "https://images.unsplash.com/photo-1?w=100"] },
  });
  assert.equal(upd.status, 200, JSON.stringify(upd.body));

  const row = await prisma.product.findUnique({ where: { id: product.id }, include: { variants: true, images: { orderBy: { sortOrder: "asc" } } } });
  assert.equal(row.title, newTitle);
  assert.equal(row.basePrice, 1250);
  assert.equal(row.variants[0].price, 1250, "single-variant price follows the product price");
  assert.equal(row.variants[0].stock, 9);
  assert.equal(row.images.length, 2);

  const movement = await prisma.stockMovement.findFirst({ where: { variantId: variant.id, type: "ADJUSTMENT" } });
  assert.equal(movement.previousStock, 5);
  assert.equal(movement.newStock, 9);

  const page = await shopper.html(`/products/${product.slug}`);
  assert.ok(page.text.includes(newTitle));
  assert.ok(page.text.includes("₹1,250"));
  assert.ok(page.text.includes("Updated description"));
  assert.ok(page.text.includes("9 available"));
});

test("product validation rejects bad input with clear errors", async () => {
  const bad = async (over, expected = 400) => {
    const res = await admin.api("/api/products", { method: "POST", json: productPayload(over) });
    assert.equal(res.status, expected, `${JSON.stringify(over)} -> ${res.status} ${JSON.stringify(res.body)}`);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.message);
  };
  await bad({ basePrice: -5 });
  await bad({ basePrice: 0 });
  await bad({ basePrice: "abc" });
  await bad({ title: "   " });
  await bad({ taxRatePercent: 7 });
  await bad({ status: "LIVE" });
  await bad({ moq: 0 });
  await bad({ hsnCode: "<script>" });
  await bad({ images: ["javascript:alert(1)"] });
  await bad({ images: ["data:text/html;base64,AAAA"] });
  await bad({ compareAtPrice: 10, basePrice: 100 });
  await bad({ priceTiers: [{ minQuantity: 5, price: 10 }, { minQuantity: 5, price: 9 }] });
  await bad({ categoryId: "does-not-exist" });

  const dupSku = `DUP-${RUN}-${uid()}`.toUpperCase();
  assert.equal((await admin.api("/api/products", { method: "POST", json: productPayload({ sku: dupSku }) })).status, 201);
  await bad({ sku: dupSku }, 409);

  const notJson = await admin.request("/api/products", { method: "POST", body: "nope", headers: { "content-type": "application/json" } });
  assert.equal(notJson.status, 400);
});

test("product text is escaped on the storefront (no stored XSS)", async () => {
  const marker = `xss${uid()}`;
  const { product } = await createProduct(admin, {
    title: `<img src=x onerror=alert('${marker}')> ${marker}`,
    description: `<script>window.${marker}=1</script>`,
  });
  const html = (await shopper.html(`/products/${product.slug}`)).text;
  assert.ok(!html.includes(`<img src=x onerror=alert('${marker}')>`), "raw HTML from a title must not be injected");
  assert.ok(!html.includes(`<script>window.${marker}=1</script>`), "raw script from a description must not be injected");
});

test("archiving removes a product from the storefront but keeps the record", async () => {
  const { product } = await createProduct(admin, { title: `To Archive ${uid()}` });
  assert.equal((await shopper.html(`/products/${product.slug}`)).status, 200);

  const del = await admin.api(`/api/products/${product.id}`, { method: "DELETE" });
  assert.equal(del.status, 200);
  assert.equal(del.body.data.status, "ARCHIVED");

  assert.equal((await shopper.html(`/products/${product.slug}`)).status, 404);
  const row = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(row.status, "ARCHIVED", "row is kept for order history");
});

test("categories: CRUD, nesting rules, navigation and storefront visibility", async () => {
  const name = `Cat ${uid()}`;
  const created = await admin.api("/api/categories", { method: "POST", json: { name, description: "d", sortOrder: 3 } });
  assert.equal(created.status, 201);
  const cat = created.body.data;
  assert.equal(cat.slug, name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));

  // public listing + storefront category page + header navigation use backend data
  const list = await shopper.api("/api/categories");
  assert.ok(list.body.data.some((c) => c.id === cat.id));
  assert.equal((await shopper.html(`/categories/${cat.slug}`)).status, 200);
  const nav = await shopper.html("/shop-with-sidebar");
  assert.ok(nav.text.includes(name), "category appears in navigation/filters");

  // child category, but no grandchildren
  const child = await admin.api("/api/categories", { method: "POST", json: { name: `Child ${uid()}`, parentId: cat.id } });
  assert.equal(child.status, 201);
  const grand = await admin.api("/api/categories", { method: "POST", json: { name: `Grand ${uid()}`, parentId: child.body.data.id } });
  assert.equal(grand.status, 400);

  // duplicate slug
  const dup = await admin.api("/api/categories", { method: "POST", json: { name: "Other", slug: cat.slug } });
  assert.equal(dup.status, 409);

  // update + hide: hidden categories 404 and leave the navigation
  const hide = await admin.api("/api/categories", { method: "PUT", json: { id: cat.id, isActive: false, name: `${name} Renamed` } });
  assert.equal(hide.status, 200);
  assert.equal((await shopper.html(`/categories/${cat.slug}`)).status, 404);
  assert.ok(!(await shopper.html("/shop-with-sidebar")).text.includes(`${name} Renamed`));

  // in-use categories cannot be deleted
  await admin.api("/api/categories", { method: "PUT", json: { id: cat.id, isActive: true } });
  const { product } = await createProduct(admin, { categoryId: cat.id });
  const blocked = await admin.api(`/api/categories?id=${cat.id}`, { method: "DELETE" });
  assert.equal(blocked.status, 409);
  const blockedChild = await admin.api(`/api/categories?id=${cat.id}`, { method: "DELETE" });
  assert.match(blockedChild.body.error.message, /product|subcategor/i);

  await admin.api(`/api/products/${product.id}`, { method: "DELETE" });
  await prisma.product.delete({ where: { id: product.id } });
  await admin.api(`/api/categories?id=${child.body.data.id}`, { method: "DELETE" });
  const ok = await admin.api(`/api/categories?id=${cat.id}`, { method: "DELETE" });
  assert.equal(ok.status, 200);
  assert.equal(await prisma.category.count({ where: { id: cat.id } }), 0);
});

test("category page lists only that category's published products", async () => {
  const cat = (await admin.api("/api/categories", { method: "POST", json: { name: `Scoped ${uid()}` } })).body.data;
  const inCat = await createProduct(admin, { title: `In Cat ${uid()}`, categoryId: cat.id });
  const other = await createProduct(admin, { title: `Not In Cat ${uid()}` });
  const draft = await createProduct(admin, { title: `Draft In Cat ${uid()}`, categoryId: cat.id, status: "DRAFT" });

  const html = (await shopper.html(`/categories/${cat.slug}`)).text;
  assert.ok(html.includes(inCat.payload.title));
  assert.ok(!html.includes(draft.payload.title), "draft products never reach the page");
  assert.ok(!html.includes(other.payload.title), "products from other categories are filtered out");
});

test("Workflow C: inventory changes are validated, audited and reflected in availability", async () => {
  const { product, variant } = await createProduct(admin, { title: `Stock ${uid()}`, stock: 10 });

  const adj = await admin.api("/api/inventory/adjust", { method: "POST", json: { variantId: variant.id, newStock: 25, reason: "Cycle count" } });
  assert.equal(adj.status, 200, JSON.stringify(adj.body));
  assert.equal(adj.body.data.variant.stock, 25);
  assert.equal(adj.body.data.availableStock, 25);
  assert.equal(adj.body.data.movement.previousStock, 10);

  const row = await prisma.productVariant.findUnique({ where: { id: variant.id } });
  assert.equal(row.stock, 25);
  const ledger = await prisma.stockMovement.findMany({ where: { variantId: variant.id }, orderBy: { createdAt: "asc" } });
  assert.deepEqual(ledger.map((m) => m.type), ["INITIAL", "ADJUSTMENT"]);
  assert.equal(ledger[1].notes, "Cycle count");

  assert.ok((await shopper.html(`/products/${product.slug}`)).text.includes("25 available"));

  // Invalid operations
  const bad = async (body) => admin.api("/api/inventory/adjust", { method: "POST", json: { variantId: variant.id, reason: "x", ...body } });
  assert.equal((await bad({ newStock: -1 })).status, 400);
  assert.equal((await bad({ newStock: 1.5 })).status, 400);
  assert.equal((await bad({ newStock: "lots" })).status, 400);
  assert.equal((await admin.api("/api/inventory/adjust", { method: "POST", json: { variantId: variant.id, newStock: 3 } })).status, 400, "reason is required");
  assert.equal((await bad({ variantId: "nope", newStock: 3 })).status, 404);

  // Out of stock is reflected immediately
  assert.equal((await bad({ newStock: 0 })).status, 200);
  const oos = (await shopper.html(`/products/${product.slug}`)).text;
  assert.ok(oos.includes("Out of Stock"));
  const quote = await shopper.api("/api/checkout/quote", { method: "POST", json: { items: [{ variantId: variant.id, quantity: 1 }] } });
  assert.match(quote.body.data.issues[0].message, /out of stock/i);
});

test("stock cannot be lowered below units reserved by open orders", async () => {
  const { variant } = await createProduct(admin, { stock: 10 });
  const buyer = await customerClient("reserve");
  const order = await buyer.api("/api/checkout", {
    method: "POST",
    json: { items: [{ variantId: variant.id, quantity: 6 }], paymentMethod: "COD", address: { name: "B", phone: "9876543210", streetAddress: "1 St", city: "Chennai", state: "Tamil Nadu", postalCode: "600001" } },
  });
  assert.equal(order.status, 201, JSON.stringify(order.body));

  const tooLow = await admin.api("/api/inventory/adjust", { method: "POST", json: { variantId: variant.id, newStock: 4, reason: "oops" } });
  assert.equal(tooLow.status, 409);
  assert.match(tooLow.body.error.message, /reserved/i);
  assert.equal((await prisma.productVariant.findUnique({ where: { id: variant.id } })).stock, 10, "failed adjustment leaves stock untouched");

  const fine = await admin.api("/api/inventory/adjust", { method: "POST", json: { variantId: variant.id, newStock: 6, reason: "ok" } });
  assert.equal(fine.status, 200);
});

test("image upload: admin-only, real image types only, SVG and disguised files rejected", async () => {
  const written = [];
  const upload = async (client, name, type, buf) => {
    const form = new FormData();
    form.append("files", new Blob([buf], { type }), name);
    return client.request("/api/upload", { method: "POST", body: form });
  };

  const ok = await upload(admin, "pixel.png", "image/png", PNG_1X1);
  assert.equal(ok.status, 200);
  const body = await ok.json();
  const url = body.data.urls[0];
  assert.match(url, /^\/uploads\/products\/product_\d+_[0-9a-f]{12}\.png$/);
  const disk = path.join(process.cwd(), "public", url);
  assert.ok(fs.existsSync(disk), "file is written to disk");
  written.push(disk);

  const svg = await upload(admin, "evil.svg", "image/svg+xml", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'));
  assert.equal(svg.status, 400, "SVG can carry scripts");
  const fake = await upload(admin, "fake.png", "image/png", Buffer.from("this is not an image at all"));
  assert.equal(fake.status, 400, "declared type is not trusted");
  const renamed = await upload(admin, "shell.php.png", "image/png", Buffer.from("<?php echo 1; ?>"));
  assert.equal(renamed.status, 400);

  const anon = await upload(new Client(), "pixel.png", "image/png", PNG_1X1);
  assert.equal(anon.status, 401);
  const cust = await upload(await customerClient("upl"), "pixel.png", "image/png", PNG_1X1);
  assert.equal(cust.status, 403);

  for (const f of written) fs.rmSync(f, { force: true });
});
