import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr, num } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { availableStock } from "@/lib/commerce";
import { revalidateStorefront } from "@/lib/revalidate";

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("inventory");
    const body = await readJson(req);

    const variantId = reqStr(body.variantId, "Variant id", 64);
    const newStock = num(body.newStock, "New stock", { int: true, min: 0, max: 10_000_000 });
    const reason = reqStr(body.reason, "Reason", 500);

    const result = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: { id: variantId, product: { businessId: user.businessId } },
      });
      if (!variant) throw new ApiError(404, "NOT_FOUND", "Variant not found.");
      if (newStock < variant.reservedStock) {
        throw new ApiError(
          409,
          "BELOW_RESERVED",
          `${variant.reservedStock} units are reserved by open orders; stock cannot go below that.`
        );
      }

      // Compare-and-set on the stock we read, so a concurrent order cannot be overwritten.
      const swapped = await tx.productVariant.updateMany({
        where: { id: variantId, stock: variant.stock },
        data: { stock: newStock },
      });
      if (swapped.count !== 1) {
        throw new ApiError(409, "CONFLICT", "Stock changed while you were editing. Reload and try again.");
      }

      const movement = await tx.stockMovement.create({
        data: {
          variantId,
          type: "ADJUSTMENT",
          quantity: newStock - variant.stock,
          previousStock: variant.stock,
          newStock,
          notes: reason,
          userId: user.id,
        },
      });
      return { variant: { ...variant, stock: newStock }, movement };
    });

    await writeAudit({
      businessId: user.businessId,
      userId: user.id,
      action: "STOCK_ADJUSTED",
      entity: "ProductVariant",
      entityId: variantId,
      details: { from: result.movement.previousStock, to: newStock, reason },
    });
    revalidateStorefront();

    return ok({
      variant: result.variant,
      movement: result.movement,
      availableStock: availableStock(result.variant.stock, result.variant.reservedStock),
    });
  });
}
