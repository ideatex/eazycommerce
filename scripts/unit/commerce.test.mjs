import test from "node:test";
import assert from "node:assert/strict";
import {
  availableStock,
  canTransition,
  computeOrderTotals,
  evaluateCoupon,
  resolveUnitPrice,
  stockEffectFor,
} from "@/lib/commerce";
import { RBAC } from "@/lib/rbac";
import { safeHref, safeImage } from "@/lib/safeUrl";
import { buildInvoicePdf } from "@/lib/invoicePdf";

const coupon = (over = {}) => ({
  code: "T10",
  discountType: "PERCENTAGE",
  discountValue: 10,
  minOrderValue: 0,
  maxDiscount: null,
  usageLimit: null,
  timesUsed: 0,
  startDate: null,
  endDate: null,
  isActive: true,
  ...over,
});

test("order lifecycle: allowed and forbidden transitions", () => {
  assert.equal(canTransition("PENDING", "CONFIRMED"), true);
  assert.equal(canTransition("PACKED", "SHIPPED"), true);
  assert.equal(canTransition("DELIVERED", "RETURNED"), true);
  assert.equal(canTransition("PENDING", "SHIPPED"), false, "cannot skip to shipped");
  assert.equal(canTransition("DELIVERED", "PENDING"), false, "cannot go backwards");
  assert.equal(canTransition("CANCELLED", "CONFIRMED"), false, "cancelled is terminal");
  assert.equal(canTransition("REFUNDED", "RETURNED"), false, "refunded is terminal");
  assert.equal(canTransition("PENDING", "BOGUS"), false, "unknown target");
  assert.equal(canTransition("BOGUS", "PENDING"), false, "unknown source");
});

test("stock effects per status", () => {
  assert.equal(stockEffectFor("CANCELLED"), "RELEASE_RESERVED");
  assert.equal(stockEffectFor("SHIPPED"), "COMMIT_RESERVED");
  assert.equal(stockEffectFor("RETURNED"), "RESTOCK");
  assert.equal(stockEffectFor("CONFIRMED"), "NONE");
  assert.equal(stockEffectFor("REFUNDED"), "NONE");
});

test("available stock never goes negative", () => {
  assert.equal(availableStock(10, 3), 7);
  assert.equal(availableStock(2, 5), 0);
});

test("coupon: percentage, fixed, caps and minimums", () => {
  assert.deepEqual(evaluateCoupon(coupon(), 1000), { valid: true, discount: 100 });
  assert.deepEqual(evaluateCoupon(coupon({ maxDiscount: 50 }), 1000), { valid: true, discount: 50 });
  assert.deepEqual(evaluateCoupon(coupon({ discountType: "FIXED", discountValue: 200 }), 1000), { valid: true, discount: 200 });
  assert.deepEqual(evaluateCoupon(coupon({ discountType: "FIXED", discountValue: 5000 }), 1000), { valid: true, discount: 1000 }, "discount cannot exceed subtotal");
  assert.equal(evaluateCoupon(coupon({ minOrderValue: 2000 }), 1000).valid, false);
});

test("coupon: inactive, expired, not started, exhausted", () => {
  const now = new Date("2026-06-15T00:00:00Z");
  assert.equal(evaluateCoupon(coupon({ isActive: false }), 1000, now).valid, false);
  assert.equal(evaluateCoupon(coupon({ endDate: new Date("2026-06-01") }), 1000, now).valid, false);
  assert.equal(evaluateCoupon(coupon({ startDate: new Date("2026-07-01") }), 1000, now).valid, false);
  assert.equal(evaluateCoupon(coupon({ usageLimit: 5, timesUsed: 5 }), 1000, now).valid, false);
  assert.equal(evaluateCoupon(coupon({ usageLimit: 5, timesUsed: 4 }), 1000, now).valid, true);
});

test("totals: intra-state GST splits into CGST + SGST", () => {
  const t = computeOrderTotals([{ unitPrice: 1000, quantity: 2, taxRatePercent: 18 }], 0, true);
  assert.equal(t.subtotal, 2000);
  assert.equal(t.taxTotal, 360);
  assert.equal(t.cgstTotal, 180);
  assert.equal(t.sgstTotal, 180);
  assert.equal(t.igstTotal, 0);
  assert.equal(t.shippingFee, 0, "free shipping over the threshold");
  assert.equal(t.grandTotal, 2360);
});

test("totals: inter-state GST is IGST only", () => {
  const t = computeOrderTotals([{ unitPrice: 500, quantity: 1, taxRatePercent: 12 }], 0, false);
  assert.equal(t.igstTotal, 60);
  assert.equal(t.cgstTotal + t.sgstTotal, 0);
  assert.equal(t.shippingFee, 79);
  assert.equal(t.grandTotal, 500 + 60 + 79);
});

test("totals: discount is applied before tax, proportionally across lines", () => {
  const t = computeOrderTotals(
    [
      { unitPrice: 1000, quantity: 1, taxRatePercent: 18 },
      { unitPrice: 1000, quantity: 1, taxRatePercent: 0 },
    ],
    200,
    true
  );
  // Each line carries 100 of the discount: tax = (1000 - 100) * 18% = 162
  assert.equal(t.discountTotal, 200);
  assert.equal(t.taxTotal, 162);
  assert.equal(t.grandTotal, 2000 - 200 + 162);
});

test("totals: discount cannot exceed the subtotal and rounding stays at 2dp", () => {
  const t = computeOrderTotals([{ unitPrice: 33.33, quantity: 3, taxRatePercent: 5 }], 99999, true);
  assert.equal(t.discountTotal, t.subtotal);
  assert.equal(t.taxTotal, 0);
  const r = computeOrderTotals([{ unitPrice: 10.01, quantity: 3, taxRatePercent: 18 }], 0, false);
  assert.equal(r.taxTotal, Math.round(r.taxTotal * 100) / 100);
});

test("wholesale tiers pick the best applicable price", () => {
  const tiers = [
    { minQuantity: 5, price: 90 },
    { minQuantity: 20, price: 80 },
  ];
  assert.equal(resolveUnitPrice(100, tiers, 1), 100);
  assert.equal(resolveUnitPrice(100, tiers, 5), 90);
  assert.equal(resolveUnitPrice(100, tiers, 19), 90);
  assert.equal(resolveUnitPrice(100, tiers, 20), 80);
  assert.equal(resolveUnitPrice(100, [], 50), 100);
});

test("RBAC: staff are limited, admins are not, customers are out", () => {
  assert.equal(RBAC.isAdminOrStaff("ADMIN"), true);
  assert.equal(RBAC.isAdminOrStaff("SUPER_ADMIN"), true);
  assert.equal(RBAC.isAdminOrStaff("STAFF"), true);
  assert.equal(RBAC.isAdminOrStaff("CUSTOMER"), false);
  assert.equal(RBAC.isAdminOrStaff("B2B"), false);
  assert.equal(RBAC.isAdminOrStaff(undefined), false);
  assert.equal(RBAC.can("STAFF", "orders"), true);
  assert.equal(RBAC.can("STAFF", "settings"), false);
  assert.equal(RBAC.can("STAFF", "b2b"), false);
  assert.equal(RBAC.can("ADMIN", "settings"), true);
  assert.equal(RBAC.can("CUSTOMER", "orders"), false);
});

test("safeHref/safeImage reject script and protocol-relative URLs", () => {
  assert.equal(safeHref("/shop"), "/shop");
  assert.equal(safeHref("https://example.com/a"), "https://example.com/a");
  assert.equal(safeHref("javascript:alert(1)", "/x"), "/x");
  assert.equal(safeHref("//evil.example", "/x"), "/x");
  assert.equal(safeHref("data:text/html,hi", "/x"), "/x");
  assert.equal(safeHref(42, "/x"), "/x");
  assert.equal(safeImage("javascript:alert(1)"), null);
  assert.equal(safeImage("/uploads/products/a.png"), "/uploads/products/a.png");
});

test("invoice PDF is a structurally valid PDF with the key figures", () => {
  const pdf = buildInvoicePdf({
    invoiceNumber: "INV-2026-ORD-1",
    issuedAt: new Date("2026-01-02"),
    orderNumber: "ORD-1",
    business: { name: "Shop", gstin: "33ABCDE1234F1Z5", state: "Tamil Nadu" },
    customer: { name: "A (B)", email: "a@example.com" },
    shippingAddress: ["1 Main St", "Chennai, Tamil Nadu, 600001"],
    items: [{ title: "Widget \\ (x)", sku: "W1", quantity: 2, unitPrice: 100, taxRatePercent: 18, totalPrice: 200 }],
    totals: { subtotal: 200, discountTotal: 0, cgstTotal: 18, sgstTotal: 18, igstTotal: 0, shippingFee: 79, grandTotal: 315 },
    paymentMethod: "COD",
    paymentStatus: "PENDING",
    currencySymbol: "₹",
  });
  const text = pdf.toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.ok(text.trimEnd().endsWith("%%EOF"));
  assert.match(text, /INV-2026-ORD-1/);
  assert.match(text, /315\.00/);
  const xrefAt = Number(text.match(/startxref\n(\d+)/)[1]);
  assert.equal(text.slice(xrefAt, xrefAt + 4), "xref", "startxref must point at the xref table");
});
