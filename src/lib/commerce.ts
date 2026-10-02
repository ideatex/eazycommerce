import { ORDER_TRANSITIONS, type OrderStatus, ORDER_STATUSES } from "@/lib/types";
import { round2 } from "@/lib/math";

export function isOrderStatus(v: unknown): v is OrderStatus {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export function canTransition(from: string, to: string): boolean {
  if (!isOrderStatus(from) || !isOrderStatus(to)) return false;
  return ORDER_TRANSITIONS[from].includes(to);
}

/** What a status change does to stock. Reserved stock is held from checkout until shipment. */
export type StockEffect = "NONE" | "RELEASE_RESERVED" | "COMMIT_RESERVED" | "RESTOCK";

export function stockEffectFor(to: OrderStatus): StockEffect {
  switch (to) {
    case "CANCELLED":
      return "RELEASE_RESERVED";
    case "SHIPPED":
      return "COMMIT_RESERVED";
    case "RETURNED":
      return "RESTOCK";
    default:
      return "NONE";
  }
}

export interface CouponRule {
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  timesUsed: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
}

export type CouponResult =
  | { valid: true; discount: number }
  | { valid: false; reason: string };

/** Server-side coupon evaluation against a subtotal (pre-tax, post-line-pricing). */
export function evaluateCoupon(coupon: CouponRule, subtotal: number, now = new Date()): CouponResult {
  if (!coupon.isActive) return { valid: false, reason: "This coupon is not active." };
  if (coupon.startDate && now < coupon.startDate)
    return { valid: false, reason: "This coupon is not valid yet." };
  if (coupon.endDate && now > coupon.endDate) return { valid: false, reason: "This coupon has expired." };
  if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit)
    return { valid: false, reason: "This coupon has reached its usage limit." };
  if (subtotal < coupon.minOrderValue)
    return { valid: false, reason: `Minimum order value for this coupon is ${coupon.minOrderValue}.` };

  let discount =
    coupon.discountType === "PERCENTAGE"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  discount = round2(Math.min(discount, subtotal));
  if (discount <= 0) return { valid: false, reason: "This coupon gives no discount on this order." };
  return { valid: true, discount };
}

export interface PricedLine {
  unitPrice: number;
  quantity: number;
  taxRatePercent: number;
}

export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  shippingFee: number;
  grandTotal: number;
}

export const FREE_SHIPPING_THRESHOLD = 999;
export const FLAT_SHIPPING_FEE = 79;

/**
 * Prices are tax-exclusive. The discount is spread across lines in proportion to
 * line value so GST is charged on the discounted amount. Intra-state sales split
 * tax into CGST+SGST; inter-state sales charge IGST.
 */
export function computeOrderTotals(
  lines: PricedLine[],
  discount: number,
  intraState: boolean
): OrderTotals {
  const subtotal = round2(lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0));
  const discountTotal = round2(Math.min(Math.max(discount, 0), subtotal));

  let taxTotal = 0;
  for (const line of lines) {
    const lineValue = line.unitPrice * line.quantity;
    const share = subtotal > 0 ? (lineValue / subtotal) * discountTotal : 0;
    taxTotal += ((lineValue - share) * line.taxRatePercent) / 100;
  }
  taxTotal = round2(taxTotal);

  const cgstTotal = intraState ? round2(taxTotal / 2) : 0;
  const sgstTotal = intraState ? round2(taxTotal - cgstTotal) : 0;
  const igstTotal = intraState ? 0 : taxTotal;

  const taxableValue = subtotal - discountTotal;
  const shippingFee = taxableValue >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING_FEE;
  const grandTotal = round2(taxableValue + taxTotal + shippingFee);

  return { subtotal, discountTotal, taxTotal, cgstTotal, sgstTotal, igstTotal, shippingFee, grandTotal };
}

/** Best unit price for a quantity given wholesale tiers (falls back to the base price). */
export function resolveUnitPrice(
  basePrice: number,
  tiers: Array<{ minQuantity: number; price: number }>,
  quantity: number
): number {
  let price = basePrice;
  let bestMin = 0;
  for (const tier of tiers) {
    if (quantity >= tier.minQuantity && tier.minQuantity >= bestMin && tier.price > 0) {
      bestMin = tier.minQuantity;
      price = tier.price;
    }
  }
  return round2(price);
}

export function availableStock(stock: number, reservedStock: number): number {
  return Math.max(0, stock - reservedStock);
}
