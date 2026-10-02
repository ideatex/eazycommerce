import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine } from "@/lib/auth";
import { handle, ok, readJson, str } from "@/lib/api";
import { parseCartItems, quoteCart } from "@/lib/checkout";

export const dynamic = "force-dynamic";

/**
 * Authoritative cart pricing. The browser sends variant ids and quantities
 * only; prices, GST, coupon discount, shipping and stock come from the database.
 */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = await readJson(req);
    const items = parseCartItems(body.items);

    const user = await AuthEngine.getSessionUserFromCookies();
    let isApprovedB2B = false;
    if (user) {
      const profile = await prisma.b2BProfile.findUnique({ where: { userId: user.id }, select: { status: true } });
      isApprovedB2B = profile?.status === "APPROVED";
    }

    const quote = await quoteCart({
      items,
      couponCode: str(body.couponCode),
      shippingState: str(body.state),
      isApprovedB2B,
    });

    return ok({
      ...quote,
      signedIn: !!user,
      onlinePaymentsEnabled: !!process.env.STRIPE_SECRET_KEY,
    });
  });
}
