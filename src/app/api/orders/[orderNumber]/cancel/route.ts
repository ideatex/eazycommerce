import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { transitionOrder } from "@/lib/orderService";
import { revalidateStorefront } from "@/lib/revalidate";

/** A customer may cancel their own order until it has been processed. */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ orderNumber: string }> }) {
  return handle(async () => {
    const user = await AuthEngine.requireUser();
    const { orderNumber } = await ctx.params;

    const order = await prisma.order.findFirst({
      where: { orderNumber, customerId: user.id },
      select: { status: true },
    });
    if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found.");
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      throw new ApiError(409, "NOT_CANCELLABLE", "This order is already being processed and can no longer be cancelled online. Please contact support.");
    }

    const updated = await transitionOrder({
      orderNumber,
      nextStatus: "CANCELLED",
      customerId: user.id,
      actorId: user.id,
      note: "Cancelled by customer",
    });
    revalidateStorefront();
    return ok({ orderNumber, status: updated.status });
  });
}
