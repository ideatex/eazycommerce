import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, num } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { revalidateStorefront } from "@/lib/revalidate";
import { parseImages, parseProductFields, parseTiers } from "@/lib/productInput";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("products");
    const { id } = await ctx.params;
    const body = await readJson(req);

    const existing = await prisma.product.findFirst({
      where: { id, businessId: user.businessId },
      include: { variants: { orderBy: { createdAt: "asc" } } },
    });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Product not found.");

    const fields = parseProductFields(body, false);
    const images = parseImages(body.images);
    const tiers = parseTiers(body.priceTiers);
    const stock = body.stock === undefined ? undefined : num(body.stock, "Stock", { int: true, min: 0, max: 10_000_000 });

    if (fields.compareAtPrice != null && fields.basePrice == null && fields.compareAtPrice < existing.basePrice)
      throw new ApiError(400, "VALIDATION", "Compare-at price must not be lower than the selling price.");
    if (fields.categoryId) {
      const cat = await prisma.category.findFirst({ where: { id: fields.categoryId, businessId: user.businessId } });
      if (!cat) throw new ApiError(400, "VALIDATION", "Selected category does not exist.");
    }
    const primary = existing.variants[0];
    const singleVariant = existing.variants.length === 1;

    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: fields });

      if (primary && singleVariant) {
        const variantData: Record<string, unknown> = {};
        if (fields.basePrice !== undefined) variantData.price = fields.basePrice;
        if (fields.sku !== undefined && primary.sku === existing.sku) variantData.sku = fields.sku;
        if (Object.keys(variantData).length) await tx.productVariant.update({ where: { id: primary.id }, data: variantData });
      }

      if (stock !== undefined && primary && stock !== primary.stock) {
        if (stock < primary.reservedStock)
          throw new ApiError(409, "BELOW_RESERVED", `${primary.reservedStock} units are reserved by open orders; stock cannot go below that.`);
        const swapped = await tx.productVariant.updateMany({ where: { id: primary.id, stock: primary.stock }, data: { stock } });
        if (swapped.count !== 1)
          throw new ApiError(409, "CONFLICT", "Stock changed while you were editing. Reload and try again.");
        await tx.stockMovement.create({
          data: { variantId: primary.id, type: "ADJUSTMENT", quantity: stock - primary.stock, previousStock: primary.stock, newStock: stock, notes: "Adjusted from product editor", userId: user.id },
        });
      }

      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length) await tx.productImage.createMany({ data: images.map((url, i) => ({ productId: id, url, sortOrder: i })) });
      }
      if (tiers) {
        await tx.priceTier.deleteMany({ where: { productId: id } });
        if (tiers.length) await tx.priceTier.createMany({ data: tiers.map((t) => ({ productId: id, ...t })) });
      }
    });

    await writeAudit({ businessId: user.businessId, userId: user.id, action: "PRODUCT_UPDATED", entity: "Product", entityId: id, details: { ...fields, stock } });
    revalidateStorefront();
    return ok({ id });
  });
}

/** Products are archived rather than deleted, so historical orders keep their references. */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("products");
    const { id } = await ctx.params;

    const existing = await prisma.product.findFirst({ where: { id, businessId: user.businessId }, select: { id: true, title: true } });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Product not found.");

    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    await writeAudit({ businessId: user.businessId, userId: user.id, action: "PRODUCT_ARCHIVED", entity: "Product", entityId: id, details: { title: existing.title } });
    revalidateStorefront();
    return ok({ id, status: "ARCHIVED" });
  });
}
