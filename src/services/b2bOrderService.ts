import { prisma } from "@/lib/prismaDB";
import {
  initialB2BOrders,
  initialRelationships,
  initialOrganizations,
  VanigamB2BOrder,
} from "@/lib/b2b2c/mockVanigamData";
import { assertValidTransition } from "@/services/businessStateMachine";
import { incrementOfferStock } from "@/services/productOfferService";
import { createAuditLog, createNotification } from "@/services/auditAndNotificationService";

let inMemoryB2BOrders: VanigamB2BOrder[] = [...initialB2BOrders];

export async function getB2BOrders(orgId?: string, type?: "inbound" | "outbound"): Promise<VanigamB2BOrder[]> {
  try {
    const orders = await prisma.b2BOrder.findMany({
      where: orgId
        ? type === "inbound"
          ? { supplierId: orgId }
          : type === "outbound"
          ? { buyerId: orgId }
          : { OR: [{ supplierId: orgId }, { buyerId: orgId }] }
        : undefined,
      include: {
        supplier: true,
        buyer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (orders && orders.length > 0) {
      return orders.map((o) => ({
        id: o.id,
        poNumber: o.poNumber,
        supplierId: o.supplierId,
        supplierName: o.supplier.name,
        buyerId: o.buyerId,
        buyerName: o.buyer.name,
        items: o.items.map((i) => ({
          productId: i.productId,
          productTitle: i.productTitle,
          sku: "SKU",
          unitPrice: Number(i.unitPrice),
          quantity: i.quantity,
          lineTotal: Number(i.totalPrice),
        })),
        subtotal: Number(o.subtotal),
        taxAmount: Number(o.taxAmount),
        totalAmount: Number(o.totalAmount),
        paymentTerms: o.paymentTerms || "Net 30 Days",
        status: o.status as any,
        createdAt: o.createdAt.toISOString().split("T")[0],
      }));
    }
    return orgId
      ? inMemoryB2BOrders.filter((o) =>
          type === "inbound" ? o.supplierId === orgId : type === "outbound" ? o.buyerId === orgId : o.supplierId === orgId || o.buyerId === orgId
        )
      : inMemoryB2BOrders;
  } catch {
    return orgId
      ? inMemoryB2BOrders.filter((o) =>
          type === "inbound" ? o.supplierId === orgId : type === "outbound" ? o.buyerId === orgId : o.supplierId === orgId || o.buyerId === orgId
        )
      : inMemoryB2BOrders;
  }
}

export async function createPurchaseOrder(data: {
  supplierId: string;
  supplierName: string;
  buyerId: string;
  buyerName: string;
  items: {
    productId: string;
    productTitle: string;
    sku: string;
    unitPrice: number;
    quantity: number;
  }[];
  paymentTerms?: string;
}): Promise<VanigamB2BOrder> {
  // 1. Validate Minimum Order Quantity (MOQ) for wholesale lot
  for (const item of data.items) {
    if (item.quantity < 20) {
      throw new Error(
        `Wholesale procurement requires Minimum Order Quantity (MOQ) of 20 units. Submitted: ${item.quantity}.`
      );
    }
  }

  // 2. Validate Supplier is Active
  const supplier = initialOrganizations.find((o) => o.id === data.supplierId);
  if (supplier && supplier.status === "SUSPENDED") {
    throw new Error(
      `BUSINESS_RULE_VIOLATION: Supplier organization ${data.supplierName} is currently suspended from commercial trading.`
    );
  }

  const subtotal = data.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const taxAmount = Number((subtotal * 0.05).toFixed(2));
  const totalAmount = subtotal + taxAmount;

  // 3. Validate Active Relationship & Credit Limit
  const relationship = initialRelationships.find(
    (r) =>
      (r.sourceOrgId === data.supplierId && r.targetOrgId === data.buyerId) ||
      (r.sourceOrgId === data.buyerId && r.targetOrgId === data.supplierId)
  );

  if (relationship && relationship.status === "TERMINATED") {
    throw new Error(
      `BUSINESS_RULE_VIOLATION: Commercial relationship between ${data.buyerName} and ${data.supplierName} has been terminated.`
    );
  }

  if (relationship && totalAmount > relationship.creditLimit) {
    throw new Error(
      `CREDIT_LIMIT_EXCEEDED: Purchase order total $${totalAmount} exceeds agreed credit line of $${relationship.creditLimit}.`
    );
  }

  const po: VanigamB2BOrder = {
    id: `po-${Date.now()}`,
    poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    supplierId: data.supplierId,
    supplierName: data.supplierName,
    buyerId: data.buyerId,
    buyerName: data.buyerName,
    items: data.items.map((i) => ({
      ...i,
      lineTotal: i.unitPrice * i.quantity,
    })),
    subtotal,
    taxAmount,
    totalAmount,
    paymentTerms: data.paymentTerms || "Net 30 Days",
    status: "SUBMITTED",
    createdAt: new Date().toISOString().split("T")[0],
  };

  inMemoryB2BOrders.unshift(po);

  // Record Audit Log & Notification
  await createAuditLog({
    action: "B2B_PO_CREATED",
    entityType: "B2BOrder",
    entityId: po.id,
    organizationId: po.buyerId,
    details: { poNumber: po.poNumber, supplierId: data.supplierId, totalAmount },
  });

  await createNotification({
    recipientOrgId: data.supplierId,
    title: "New B2B Purchase Order Received",
    message: `${data.buyerName} submitted Purchase Order ${po.poNumber} ($${totalAmount}).`,
    type: "INFO",
    link: "/admin/b2b-orders",
  });

  // Database persistence attempt
  try {
    await prisma.b2BOrder.create({
      data: {
        poNumber: po.poNumber,
        supplierId: data.supplierId,
        buyerId: data.buyerId,
        subtotal,
        taxAmount,
        totalAmount,
        paymentTerms: data.paymentTerms || "Net 30 Days",
        status: "SUBMITTED",
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            productTitle: i.productTitle,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.unitPrice * i.quantity,
          })),
        },
      },
    });
  } catch {
    // Graceful fallback to inMemory store
  }

  return po;
}

export async function updateB2BOrderStatus(
  poId: string,
  status: VanigamB2BOrder["status"]
): Promise<VanigamB2BOrder | null> {
  const idx = inMemoryB2BOrders.findIndex((o) => o.id === poId);
  if (idx !== -1) {
    const po = inMemoryB2BOrders[idx];

    // State machine transition validation
    assertValidTransition("B2B_ORDER", po.status, status);
    const previousStatus = po.status;
    po.status = status;

    // FLOW 7 — INVENTORY RECEIPT: When PO is RECEIVED, increment buyer's inventory!
    if (status === "RECEIVED") {
      for (const item of po.items) {
        await incrementOfferStock(po.buyerId, item.productId, item.quantity, item.productTitle);
      }

      await createAuditLog({
        action: "B2B_PO_GOODS_RECEIVED",
        entityType: "B2BOrder",
        entityId: po.id,
        organizationId: po.buyerId,
        details: {
          poNumber: po.poNumber,
          receivedItems: po.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        },
      });

      await createNotification({
        recipientOrgId: po.supplierId,
        title: "Goods Received by Buyer",
        message: `Buyer ${po.buyerName} has verified and received shipment for Purchase Order ${po.poNumber}.`,
        type: "SUCCESS",
        link: "/admin/b2b-orders",
      });
    } else {
      await createAuditLog({
        action: `B2B_PO_STATUS_${status}`,
        entityType: "B2BOrder",
        entityId: po.id,
        organizationId: po.supplierId,
        details: { poNumber: po.poNumber, fromStatus: previousStatus, toStatus: status },
      });

      await createNotification({
        recipientOrgId: po.buyerId,
        title: `PO ${po.poNumber} Status: ${status}`,
        message: `Your purchase order has been updated to ${status} by ${po.supplierName}.`,
        type: "INFO",
        link: "/admin/b2b-orders",
      });
    }

    try {
      await prisma.b2BOrder.update({
        where: { id: poId },
        data: { status },
      });
    } catch {
      // Graceful fallback
    }

    return po;
  }
  return null;
}
