import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr, num, str } from "@/lib/api";
import { publicProductWhere } from "@/lib/storefront";

/**
 * Signed-in customers submit reviews. They start unapproved and appear on the
 * storefront only after an admin approves them (Admin → Reviews).
 */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireUser();
    const body = await readJson(req);

    const productId = reqStr(body.productId, "Product", 64);
    const rating = num(body.rating, "Rating", { int: true, min: 1, max: 5 });
    const comment = reqStr(body.comment, "Review", 2000);
    const title = str(body.title)?.slice(0, 150) || null;

    const product = await prisma.product.findFirst({ where: { id: productId, ...publicProductWhere }, select: { id: true } });
    if (!product) throw new ApiError(404, "NOT_FOUND", "Product not found.");

    const already = await prisma.productReview.findFirst({ where: { productId, customerId: user.id }, select: { id: true } });
    if (already) throw new ApiError(409, "CONFLICT", "You have already reviewed this product.");

    // "Verified purchase" is decided by the server from the order history.
    const purchased = await prisma.orderItem.findFirst({
      where: { productId, order: { customerId: user.id, status: "DELIVERED" } },
      select: { id: true },
    });

    const review = await prisma.productReview.create({
      data: { productId, customerId: user.id, rating, title, comment, isVerifiedPurchase: !!purchased, isApproved: false },
      select: { id: true },
    });
    return ok({ id: review.id, pendingModeration: true }, 201);
  });
}
