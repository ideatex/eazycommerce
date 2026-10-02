import { prisma } from "@/lib/prismaDB";
import { ApiError } from "@/lib/auth";
import { getDefaultBusiness } from "@/lib/business";
import {
  availableStock,
  computeOrderTotals,
  evaluateCoupon,
  resolveUnitPrice,
  type OrderTotals,
} from "@/lib/commerce";
import { publicProductWhere } from "@/lib/storefront";
import { round2 } from "@/lib/math";

export interface CartInputLine {
  variantId: string;
  quantity: number;
}

export interface QuotedLine {
  variantId: string;
  productId: string;
  title: string;
  variantTitle: string;
  sku: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRatePercent: number;
  available: number;
  moq: number;
}

export interface CartQuote {
  lines: QuotedLine[];
  totals: OrderTotals;
  coupon: { code: string; discount: number } | null;
  /** Problems that must be fixed before an order can be placed. */
  issues: Array<{ variantId?: string; message: string }>;
  intraState: boolean;
  business: { id: string; state: string; currencySymbol: string };
}

export function parseCartItems(raw: unknown): CartInputLine[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new ApiError(400, "VALIDATION", "Your cart is empty.");
  if (raw.length > 50) throw new ApiError(400, "VALIDATION", "A single order can contain at most 50 line items.");

  const merged = new Map<string, number>();
  for (const entry of raw) {
    const row = (entry ?? {}) as Record<string, unknown>;
    const variantId = typeof row.variantId === "string" ? row.variantId.trim() : "";
    const quantity = Number(row.quantity);
    if (!variantId) throw new ApiError(400, "VALIDATION", "Every cart line needs a variantId.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000)
      throw new ApiError(400, "VALIDATION", "Quantities must be whole numbers between 1 and 10000.");
    merged.set(variantId, (merged.get(variantId) ?? 0) + quantity);
  }
  return [...merged.entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
}

/**
 * Prices a cart entirely from database state. Nothing the browser sends about
 * prices, tax or discounts is used: only variant ids, quantities and a coupon code.
 */
export async function quoteCart(args: {
  items: CartInputLine[];
  couponCode?: string | null;
  shippingState?: string | null;
  isApprovedB2B?: boolean;
}): Promise<CartQuote> {
  const business = await getDefaultBusiness();
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: args.items.map((i) => i.variantId) }, product: publicProductWhere },
    include: {
      product: {
        include: { priceTiers: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const issues: CartQuote["issues"] = [];
  const lines: QuotedLine[] = [];

  for (const item of args.items) {
    const v = byId.get(item.variantId);
    if (!v) {
      issues.push({ variantId: item.variantId, message: "An item in your cart is no longer available." });
      continue;
    }
    const available = availableStock(v.stock, v.reservedStock);
    if (item.quantity < v.product.moq) {
      issues.push({ variantId: v.id, message: `${v.product.title}: minimum order quantity is ${v.product.moq}.` });
    }
    if (available < item.quantity) {
      issues.push({
        variantId: v.id,
        message: available === 0 ? `${v.product.title} is out of stock.` : `Only ${available} of ${v.product.title} left.`,
      });
    }
    // Wholesale tiers apply to approved B2B accounts only.
    const unitPrice = args.isApprovedB2B
      ? resolveUnitPrice(v.price, v.product.priceTiers, item.quantity)
      : round2(v.price);
    lines.push({
      variantId: v.id,
      productId: v.productId,
      title: v.product.title,
      variantTitle: v.title,
      sku: v.sku,
      image: v.product.images[0]?.url ?? null,
      quantity: item.quantity,
      unitPrice,
      totalPrice: round2(unitPrice * item.quantity),
      taxRatePercent: v.product.taxRatePercent,
      available,
      moq: v.product.moq,
    });
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.totalPrice, 0));

  let coupon: CartQuote["coupon"] = null;
  const code = args.couponCode?.trim().toUpperCase();
  if (code) {
    const row = await prisma.coupon.findUnique({ where: { code } });
    if (!row) {
      issues.push({ message: "That coupon code is not valid." });
    } else {
      const result = evaluateCoupon(row, subtotal);
      if (result.valid) coupon = { code: row.code, discount: result.discount };
      else issues.push({ message: result.reason });
    }
  }

  const intraState =
    !!args.shippingState && args.shippingState.trim().toLowerCase() === business.state.trim().toLowerCase();
  const totals = computeOrderTotals(lines, coupon?.discount ?? 0, intraState);

  return {
    lines,
    totals,
    coupon,
    issues,
    intraState,
    business: { id: business.id, state: business.state, currencySymbol: business.currencySymbol },
  };
}
