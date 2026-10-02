import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { revalidateStorefront } from "@/lib/revalidate";

export async function PATCH(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("reviews");
    const body = await readJson(req);
    const id = reqStr(body.id, "Review id", 64);
    if (typeof body.isApproved !== "boolean")
      throw new ApiError(400, "VALIDATION", "isApproved must be true or false.");

    const review = await prisma.productReview.findFirst({
      where: { id, product: { businessId: user.businessId } },
      select: { id: true },
    });
    if (!review) throw new ApiError(404, "NOT_FOUND", "Review not found.");

    await prisma.productReview.update({ where: { id }, data: { isApproved: body.isApproved } });
    await writeAudit({ businessId: user.businessId, userId: user.id, action: body.isApproved ? "REVIEW_APPROVED" : "REVIEW_HIDDEN", entity: "ProductReview", entityId: id });
    revalidateStorefront();
    return ok({ id, isApproved: body.isApproved });
  });
}

export async function DELETE(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("reviews");
    const id = reqStr(req.nextUrl.searchParams.get("id"), "Review id", 64);

    const review = await prisma.productReview.findFirst({
      where: { id, product: { businessId: user.businessId } },
      select: { id: true },
    });
    if (!review) throw new ApiError(404, "NOT_FOUND", "Review not found.");

    await prisma.productReview.delete({ where: { id } });
    await writeAudit({ businessId: user.businessId, userId: user.id, action: "REVIEW_DELETED", entity: "ProductReview", entityId: id });
    revalidateStorefront();
    return ok({ id });
  });
}
