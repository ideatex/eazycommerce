import crypto from "crypto";
import { prisma } from "@/lib/prismaDB";
import { ApiError } from "@/lib/auth";
import { round2 } from "@/lib/math";
import { writeAudit } from "@/lib/audit";
import type { CartQuote } from "@/lib/checkout";
import type { SessionUser } from "@/lib/types";

export interface ShippingAddress {
  name: string;
  phone: string;
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type PaymentMethod = "COD" | "ONLINE";

function newOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `ORD-${ymd}-${crypto.randomInt(100000, 999999)}`;
}

/**
 * Creates the order, reserves stock, redeems the coupon and records the order
 * sub-orders atomically. Any failure rolls the whole thing back.
 */
export async function placeOrder(args: {
  user: SessionUser;
  quote: CartQuote;
  address: ShippingAddress;
  paymentMethod: PaymentMethod;
  customerPhone: string;
  notes?: string;
}) {
  const { user, quote, address, paymentMethod } = args;
  if (quote.issues.length > 0) throw new ApiError(409, "CART_INVALID", quote.issues[0].message);
  if (quote.lines.length === 0) throw new ApiError(400, "VALIDATION", "Your cart is empty.");

  const addressJson = JSON.stringify(address);

  for (let attempt = 0; attempt < 3; attempt++) {
    const orderNumber = newOrderNumber();
    try {
      const order = await prisma.$transaction(async (tx) => {
        // Atomic reservation: only succeeds while (stock - reserved) >= quantity.
        for (const line of quote.lines) {
          const reserved = await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET "reservedStock" = "reservedStock" + ${line.quantity}
            WHERE "id" = ${line.variantId} AND ("stock" - "reservedStock") >= ${line.quantity}`;
          if (reserved !== 1) {
            throw new ApiError(409, "OUT_OF_STOCK", `${line.title} just sold out. Please update your cart.`);
          }
        }

        if (quote.coupon) {
          const redeemed = await tx.$executeRaw`
            UPDATE "Coupon"
            SET "timesUsed" = "timesUsed" + 1
            WHERE "code" = ${quote.coupon.code} AND "isActive" = true
              AND ("usageLimit" IS NULL OR "timesUsed" < "usageLimit")`;
          if (redeemed !== 1) throw new ApiError(409, "COUPON_EXHAUSTED", "That coupon has just reached its usage limit.");
        }

        const created = await tx.order.create({
          data: {
            businessId: quote.business.id,
            orderNumber,
            customerId: user.id,
            customerName: address.name,
            customerEmail: user.email,
            customerPhone: args.customerPhone,
            status: "PENDING",
            paymentStatus: "PENDING",
            paymentMethod,
            subtotal: quote.totals.subtotal,
            discountTotal: quote.totals.discountTotal,
            taxTotal: quote.totals.taxTotal,
            cgstTotal: quote.totals.cgstTotal,
            sgstTotal: quote.totals.sgstTotal,
            igstTotal: quote.totals.igstTotal,
            shippingFee: quote.totals.shippingFee,
            grandTotal: quote.totals.grandTotal,
            couponCode: quote.coupon?.code ?? null,
            shippingAddressJson: addressJson,
            billingAddressJson: addressJson,
            items: {
              create: quote.lines.map((l) => ({
                productId: l.productId,
                variantId: l.variantId,
                title: l.variantTitle && l.variantTitle !== "Standard" ? `${l.title} (${l.variantTitle})` : l.title,
                sku: l.sku,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                totalPrice: l.totalPrice,
                taxRatePercent: l.taxRatePercent,
              })),
            },
            history: {
              create: { status: "PENDING", note: args.notes ? `Order placed. Customer note: ${args.notes}` : "Order placed", userId: user.id },
            },
          },
        });

        for (const line of quote.lines) {
          const v = await tx.productVariant.findUniqueOrThrow({ where: { id: line.variantId } });
          await tx.stockMovement.create({
            data: { variantId: v.id, type: "RESERVE", quantity: 0, previousStock: v.stock, newStock: v.stock, referenceId: orderNumber, notes: `Reserved ${line.quantity} for order`, userId: user.id },
          });
        }

        // Keep the address book useful: save the first address a customer uses.
        const hasAddress = await tx.address.count({ where: { userId: user.id } });
        if (hasAddress === 0) {
          await tx.address.create({
            data: {
              userId: user.id,
              name: address.name,
              phone: address.phone,
              streetAddress: address.streetAddress,
              apartment: address.apartment || null,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
              isDefaultShipping: true,
              isDefaultBilling: true,
            },
          });
        }
        return created;
      });

      await writeAudit({
        businessId: quote.business.id,
        userId: user.id,
        action: "ORDER_PLACED",
        entity: "Order",
        entityId: order.id,
        details: { orderNumber, grandTotal: order.grandTotal, paymentMethod },
      });
      return order;
    } catch (err) {
      // Order-number collision: pick another number and retry.
      if ((err as { code?: string }).code === "P2002" && attempt < 2) continue;
      throw err;
    }
  }
  throw new ApiError(500, "INTERNAL", "Could not create the order. Please try again.");
}
