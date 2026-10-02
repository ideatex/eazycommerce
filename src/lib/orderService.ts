import { prisma } from "@/lib/prismaDB";
import { ApiError } from "@/lib/auth";
import { canTransition, isOrderStatus, stockEffectFor } from "@/lib/commerce";
import { writeAudit } from "@/lib/audit";

export interface TransitionInput {
  orderNumber: string;
  nextStatus: string;
  /** Restrict to a store (admin) and/or a customer (self-service). */
  businessId?: string | null;
  customerId?: string;
  actorId: string;
  note?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
}

/**
 * Moves an order through its lifecycle and applies the matching stock,
 * payment and customer-statistics effects in one transaction.
 */
export async function transitionOrder(input: TransitionInput) {
  const { orderNumber, nextStatus, actorId, note, trackingNumber, trackingCarrier } = input;
  if (!isOrderStatus(nextStatus)) throw new ApiError(400, "VALIDATION", `Unknown order status '${nextStatus}'.`);

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        orderNumber,
        ...(input.businessId !== undefined ? { businessId: input.businessId } : {}),
        ...(input.customerId ? { customerId: input.customerId } : {}),
      },
      include: { items: true },
    });
    if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found.");
    if (!canTransition(order.status, nextStatus)) {
      throw new ApiError(409, "INVALID_TRANSITION", `Cannot move an order from ${order.status} to ${nextStatus}.`);
    }
    if (nextStatus === "SHIPPED" && !(trackingNumber || order.trackingNumber)) {
      throw new ApiError(400, "VALIDATION", "A tracking number is required to ship an order.");
    }

    // Guard against two actors transitioning the same order at once.
    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: {
        status: nextStatus,
        ...(trackingNumber ? { trackingNumber } : {}),
        ...(trackingCarrier ? { trackingCarrier } : {}),
        ...(nextStatus === "DELIVERED" && order.paymentMethod === "COD" && order.paymentStatus === "PENDING"
          ? { paymentStatus: "PAID" }
          : {}),
        ...(nextStatus === "REFUNDED" ? { paymentStatus: "REFUNDED" } : {}),
        ...(nextStatus === "CANCELLED" && order.paymentStatus === "PAID" ? { paymentStatus: "REFUND_PENDING" } : {}),
      },
    });
    if (claimed.count !== 1) {
      throw new ApiError(409, "CONFLICT", "This order was changed by someone else. Reload and try again.");
    }

    const effect = stockEffectFor(nextStatus);
    if (effect !== "NONE") {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant) continue;

        if (effect === "RELEASE_RESERVED") {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { reservedStock: Math.max(0, variant.reservedStock - item.quantity) },
          });
          await tx.stockMovement.create({
            data: { variantId: variant.id, type: "RELEASE", quantity: 0, previousStock: variant.stock, newStock: variant.stock, referenceId: order.orderNumber, notes: "Reservation released: order cancelled", userId: actorId },
          });
        } else if (effect === "COMMIT_RESERVED") {
          const newStock = Math.max(0, variant.stock - item.quantity);
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: newStock, reservedStock: Math.max(0, variant.reservedStock - item.quantity) },
          });
          await tx.stockMovement.create({
            data: { variantId: variant.id, type: "SALE", quantity: -item.quantity, previousStock: variant.stock, newStock, referenceId: order.orderNumber, notes: "Order shipped", userId: actorId },
          });
        } else if (effect === "RESTOCK") {
          const newStock = variant.stock + item.quantity;
          await tx.productVariant.update({ where: { id: variant.id }, data: { stock: newStock } });
          await tx.stockMovement.create({
            data: { variantId: variant.id, type: "RETURN", quantity: item.quantity, previousStock: variant.stock, newStock, referenceId: order.orderNumber, notes: "Customer return received", userId: actorId },
          });
        }
      }
    }

    if (nextStatus === "DELIVERED" && order.customerId) {
      await tx.customerProfile.upsert({
        where: { userId: order.customerId },
        create: { userId: order.customerId, totalSpent: order.grandTotal, orderCount: 1 },
        update: { totalSpent: { increment: order.grandTotal }, orderCount: { increment: 1 } },
      });
    }

    if (nextStatus === "REFUNDED" && order.customerId) {
      // Every refundable order passed through DELIVERED, which counted it.
      const profile = await tx.customerProfile.findUnique({ where: { userId: order.customerId } });
      if (profile) {
        await tx.customerProfile.update({
          where: { userId: order.customerId },
          data: {
            totalSpent: Math.max(0, profile.totalSpent - order.grandTotal),
            orderCount: Math.max(0, profile.orderCount - 1),
          },
        });
      }
    }

    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: nextStatus, note: note || `Order moved to ${nextStatus}`, userId: actorId },
    });

    return tx.order.findUniqueOrThrow({ where: { id: order.id } });
  });

  await writeAudit({
    businessId: updated.businessId,
    userId: actorId,
    action: "ORDER_STATUS_CHANGED",
    entity: "Order",
    entityId: updated.id,
    details: { orderNumber, status: nextStatus, note },
  });
  return updated;
}
