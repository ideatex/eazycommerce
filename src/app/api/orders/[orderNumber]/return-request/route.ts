import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

/**
 * Customers request a return on a delivered order. This records the request on
 * the order timeline and audit log for staff; the RETURNED/REFUNDED transitions
 * themselves stay with admins (Admin → Orders).
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ orderNumber: string }> }) {
  return handle(async () => {
    const user = await AuthEngine.requireUser();
    const { orderNumber } = await ctx.params;
    const body = await readJson(req);
    const reason = reqStr(body.reason, "Reason", 500);

    const order = await prisma.order.findFirst({
      where: { orderNumber, customerId: user.id },
      select: { id: true, status: true, businessId: true, history: { where: { note: { startsWith: "Return requested" } }, take: 1 } },
    });
    if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found.");
    if (order.status !== "DELIVERED") {
      throw new ApiError(409, "NOT_RETURNABLE", "Returns can only be requested for delivered orders.");
    }
    if (order.history.length > 0) {
      throw new ApiError(409, "CONFLICT", "A return has already been requested for this order.");
    }

    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: order.status, note: `Return requested: ${reason}`, userId: user.id },
    });
    await writeAudit({ businessId: order.businessId, userId: user.id, action: "ORDER_RETURN_REQUESTED", entity: "Order", entityId: order.id, details: { orderNumber, reason } });
    return ok({ orderNumber, requested: true }, 201);
  });
}
