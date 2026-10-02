import { NextRequest } from "next/server";
import { AuthEngine } from "@/lib/auth";
import { handle, ok, readJson, reqStr, str } from "@/lib/api";
import { transitionOrder } from "@/lib/orderService";
import { revalidateStorefront } from "@/lib/revalidate";

export async function POST(req: NextRequest, ctx: { params: Promise<{ orderNumber: string }> }) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("orders");
    const { orderNumber } = await ctx.params;
    const body = await readJson(req);

    const updated = await transitionOrder({
      orderNumber,
      nextStatus: reqStr(body.status, "Status", 30),
      businessId: user.businessId,
      actorId: user.id,
      note: str(body.note)?.slice(0, 500) || null,
      trackingNumber: str(body.trackingNumber)?.slice(0, 100) || null,
      trackingCarrier: str(body.trackingCarrier)?.slice(0, 100) || null,
    });

    revalidateStorefront();
    return ok({ orderNumber: updated.orderNumber, status: updated.status, paymentStatus: updated.paymentStatus });
  });
}
