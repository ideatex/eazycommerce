import { prisma } from "@/lib/prismaDB";
import {
  initialBusinessOrders,
  initialOrganizations,
  VanigamBusinessOrder,
} from "@/lib/b2b2c/mockVanigamData";
import { calculateAuthoritativePrice } from "@/services/pricingEngine";
import { assertValidTransition } from "@/services/businessStateMachine";
import { decrementOfferStock, incrementOfferStock } from "@/services/productOfferService";
import { createAuditLog, createNotification } from "@/services/auditAndNotificationService";

let inMemoryBusinessOrders: VanigamBusinessOrder[] = [...initialBusinessOrders];

export interface CheckoutPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: any;
  billingAddress: any;
  paymentMethod: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
    organizationId?: string;
    organizationName?: string;
  }[];
}

export async function processUnifiedCheckout(payload: CheckoutPayload): Promise<{
  masterOrderNo: string;
  businessOrders: VanigamBusinessOrder[];
}> {
  const masterOrderNo = `MO-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  // Group items by Seller / Organization
  const groupedByOrg: { [orgId: string]: typeof payload.items } = {};

  payload.items.forEach((item) => {
    const orgId = item.organizationId || "org-seller-velocity";
    if (!groupedByOrg[orgId]) {
      groupedByOrg[orgId] = [];
    }
    groupedByOrg[orgId].push(item);
  });

  const createdBusinessOrders: VanigamBusinessOrder[] = [];
  const orgKeys = Object.keys(groupedByOrg);

  for (let i = 0; i < orgKeys.length; i++) {
    const orgId = orgKeys[i];
    const sellerItems = groupedByOrg[orgId];
    const seller = initialOrganizations.find((o) => o.id === orgId);
    const sellerName = seller?.name || sellerItems[0]?.organizationName || "Authorized Seller";

    // 1. Verify Seller Organization is Active
    if (seller && seller.status === "SUSPENDED") {
      throw new Error(
        `BUSINESS_RULE_VIOLATION: Seller organization ${sellerName} is currently suspended from accepting orders.`
      );
    }

    // 2. Authoritative Server-Side Pricing, MOQ Verification & Inventory Deduction
    const validatedItems = await Promise.all(
      sellerItems.map(async (item) => {
        const pricing = await calculateAuthoritativePrice({
          productId: item.id,
          organizationId: orgId,
          quantity: item.quantity,
          clientSubmittedPrice: item.price,
        });

        if (!pricing.moqSatisfied) {
          throw new Error(
            `Minimum Order Quantity (MOQ) not met for ${pricing.productTitle}. Required: ${pricing.moq}, provided: ${item.quantity}.`
          );
        }

        // FLOW 14 — INVENTORY DEDUCTION & OVERSELLING PREVENTION:
        // Strictly deduct available stock. If stock is insufficient, this throws INSUFFICIENT_STOCK.
        await decrementOfferStock(orgId, item.id, item.quantity);

        return {
          productId: item.id,
          productTitle: pricing.productTitle || item.name,
          sku: `SKU-${item.id}`,
          unitPrice: pricing.unitPrice,
          quantity: item.quantity,
          totalPrice: pricing.totalPrice,
        };
      })
    );

    const subtotal = Number(
      validatedItems.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2)
    );
    const shippingCost = subtotal >= 150 ? 0 : 9.99;
    const totalAmount = Number((subtotal + shippingCost).toFixed(2));
    const commissionRate = 8.0; // 8% marketplace commission
    const commissionAmount = Number(((subtotal * commissionRate) / 100).toFixed(2));
    const payoutAmount = Number((totalAmount - commissionAmount).toFixed(2));

    const bo: VanigamBusinessOrder = {
      id: `bo-${Date.now()}-${i}`,
      businessOrderNo: `ORD-2026-${Math.floor(100 + Math.random() * 900)}-${String.fromCharCode(65 + i)}`,
      masterOrderId: masterOrderNo,
      sellerOrgId: orgId,
      sellerOrgName: sellerName,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      items: validatedItems,
      subtotal,
      shippingCost,
      commissionRate,
      commissionAmount,
      payoutAmount,
      totalAmount,
      status: "CREATED",
      createdAt: new Date().toISOString().split("T")[0],
    };

    createdBusinessOrders.push(bo);
    inMemoryBusinessOrders.unshift(bo);

    // Audit Logging & Notifications
    await createAuditLog({
      action: "BUSINESS_ORDER_CREATED",
      entityType: "BusinessOrder",
      entityId: bo.id,
      organizationId: orgId,
      details: {
        businessOrderNo: bo.businessOrderNo,
        masterOrderNo,
        totalAmount,
        commissionAmount,
        payoutAmount,
      },
    });

    await createNotification({
      recipientOrgId: orgId,
      title: "New Marketplace Business Order",
      message: `Order ${bo.businessOrderNo} received from ${payload.customerName} ($${totalAmount}).`,
      type: "INFO",
      link: "/admin/orders",
    });

    // Database Persistence Attempt
    try {
      await prisma.$transaction(async (tx) => {
        const existingMaster = await tx.masterOrder.findUnique({
          where: { orderNumber: masterOrderNo },
        });

        const master =
          existingMaster ||
          (await tx.masterOrder.create({
            data: {
              orderNumber: masterOrderNo,
              customerEmail: payload.customerEmail,
              customerName: payload.customerName,
              subtotal,
              totalAmount,
              shippingAddress: payload.shippingAddress || {},
              billingAddress: payload.billingAddress || {},
              paymentStatus: "PENDING",
              status: "PAYMENT_PENDING",
            },
          }));

        await tx.businessOrder.create({
          data: {
            masterOrderId: master.id,
            organizationId: orgId,
            businessOrderNo: bo.businessOrderNo,
            subtotal,
            shippingCost,
            totalAmount,
            commissionAmount,
            payoutAmount,
            status: "CREATED",
            orderItems: {
              create: validatedItems.map((vi) => ({
                productId: vi.productId,
                productTitle: vi.productTitle,
                sku: vi.sku,
                quantity: vi.quantity,
                unitPrice: vi.unitPrice,
                totalPrice: vi.totalPrice,
              })),
            },
          },
        });
      });
    } catch {
      // Prisma offline: inMemory fallback maintains system availability
    }
  }

  return {
    masterOrderNo,
    businessOrders: createdBusinessOrders,
  };
}

export async function getBusinessOrders(orgId?: string): Promise<VanigamBusinessOrder[]> {
  try {
    const orders = await prisma.businessOrder.findMany({
      where: orgId ? { organizationId: orgId } : undefined,
      include: {
        organization: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (orders && orders.length > 0) {
      return orders.map((o) => ({
        id: o.id,
        businessOrderNo: o.businessOrderNo,
        masterOrderId: o.masterOrderId,
        sellerOrgId: o.organizationId,
        sellerOrgName: o.organization.name,
        customerName: "Valued Customer",
        customerEmail: "customer@example.com",
        items: o.orderItems.map((i) => ({
          productId: i.productId,
          productTitle: i.product?.title || "Marketplace Product",
          sku: i.product?.sku || "SKU-DEF",
          unitPrice: Number(i.unitPrice),
          quantity: i.quantity,
          totalPrice: Number(i.totalPrice),
        })),
        subtotal: Number(o.subtotal),
        shippingCost: Number(o.shippingCost),
        commissionRate: 8.0,
        commissionAmount: Number(o.commissionAmount),
        payoutAmount: Number(o.payoutAmount),
        totalAmount: Number(o.totalAmount),
        status: o.status as any,
        createdAt: o.createdAt.toISOString().split("T")[0],
      }));
    }
    return orgId ? inMemoryBusinessOrders.filter((o) => o.sellerOrgId === orgId) : inMemoryBusinessOrders;
  } catch {
    return orgId ? inMemoryBusinessOrders.filter((o) => o.sellerOrgId === orgId) : inMemoryBusinessOrders;
  }
}

export async function updateBusinessOrderStatus(
  orderId: string,
  status: VanigamBusinessOrder["status"],
  trackingData?: { carrier?: string; trackingNumber?: string }
): Promise<VanigamBusinessOrder | null> {
  const idx = inMemoryBusinessOrders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    const order = inMemoryBusinessOrders[idx];

    // State machine transition validation
    assertValidTransition("BUSINESS_ORDER", order.status, status);
    const previousStatus = order.status;
    order.status = status;

    // FLOW 17 & 20 — CANCELLATION: Restore deducted stock to seller's inventory!
    if (status === "CANCELLED") {
      for (const item of order.items) {
        const prodId = (item as any).productId || "prod-1";
        await incrementOfferStock(order.sellerOrgId, prodId, item.quantity, item.productTitle);
      }

      await createAuditLog({
        action: "BUSINESS_ORDER_CANCELLED_STOCK_RESTORED",
        entityType: "BusinessOrder",
        entityId: order.id,
        organizationId: order.sellerOrgId,
        details: {
          businessOrderNo: order.businessOrderNo,
          restoredItems: order.items.map((i) => ({ productId: (i as any).productId || i.sku, quantity: i.quantity })),
        },
      });

      await createNotification({
        recipientOrgId: order.sellerOrgId,
        title: `Order ${order.businessOrderNo} Cancelled`,
        message: `Order was cancelled. All reserved items have been restored to available stock.`,
        type: "WARNING",
        link: "/admin/orders",
      });
    } else if (status === "SHIPPED") {
      await createAuditLog({
        action: "BUSINESS_ORDER_SHIPPED",
        entityType: "BusinessOrder",
        entityId: order.id,
        organizationId: order.sellerOrgId,
        details: {
          businessOrderNo: order.businessOrderNo,
          carrier: trackingData?.carrier || "Standard Logistics Carrier",
          trackingNumber: trackingData?.trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
        },
      });

      await createNotification({
        recipientOrgId: order.sellerOrgId,
        title: `Order ${order.businessOrderNo} Dispatched`,
        message: `Shipment in transit via ${trackingData?.carrier || "FedEx Express"}.`,
        type: "INFO",
        link: "/admin/orders",
      });
    } else if (status === "DELIVERED") {
      await createAuditLog({
        action: "BUSINESS_ORDER_DELIVERED",
        entityType: "BusinessOrder",
        entityId: order.id,
        organizationId: order.sellerOrgId,
        details: { businessOrderNo: order.businessOrderNo },
      });

      await createNotification({
        recipientOrgId: order.sellerOrgId,
        title: `Order ${order.businessOrderNo} Delivered`,
        message: `Customer delivery confirmed. 14-day return window started for settlement release.`,
        type: "SUCCESS",
        link: "/admin/orders",
      });
    } else {
      await createAuditLog({
        action: `BUSINESS_ORDER_STATUS_${status}`,
        entityType: "BusinessOrder",
        entityId: order.id,
        organizationId: order.sellerOrgId,
        details: { businessOrderNo: order.businessOrderNo, fromStatus: previousStatus, toStatus: status },
      });
    }

    try {
      await prisma.businessOrder.update({
        where: { id: orderId },
        data: { status },
      });
    } catch {
      // Prisma offline fallback
    }

    return order;
  }
  return null;
}
