import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, slugify, str } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { revalidateStorefront } from "@/lib/revalidate";
import { parseImages, parseProductFields, parseTiers, parseVariants } from "@/lib/productInput";

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "product";
  let candidate = root;
  for (let n = 2; n < 50; n++) {
    const clash = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!clash) return candidate;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("products");
    const body = await readJson(req);

    const fields = parseProductFields(body, true);
    const images = parseImages(body.images) ?? [];
    const tiers = parseTiers(body.priceTiers) ?? [];
    const variants = parseVariants(body.variants, { sku: fields.sku!, price: fields.basePrice! });

    if (fields.categoryId) {
      const cat = await prisma.category.findFirst({ where: { id: fields.categoryId, businessId: user.businessId } });
      if (!cat) throw new ApiError(400, "VALIDATION", "Selected category does not exist.");
    }
    const slug = await uniqueSlug(str(body.slug) || fields.title!);

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          businessId: user.businessId,
          title: fields.title!,
          slug,
          sku: fields.sku!,
          description: fields.description ?? "",
          shortDescription: fields.shortDescription ?? null,
          basePrice: fields.basePrice!,
          compareAtPrice: fields.compareAtPrice ?? null,
          costPrice: fields.costPrice ?? null,
          moq: fields.moq ?? 1,
          hsnCode: fields.hsnCode ?? null,
          taxRatePercent: fields.taxRatePercent ?? 18,
          status: fields.status ?? "DRAFT",
          tags: fields.tags ?? null,
          brand: fields.brand ?? null,
          categoryId: fields.categoryId ?? null,
          images: { create: images.map((url, i) => ({ url, sortOrder: i })) },
          priceTiers: { create: tiers },
          variants: {
            create: variants.map((v, i) => ({
              title: v.title,
              sku: v.sku,
              price: v.price,
              stock: v.stock,
              attributesJson: v.attributesJson,
              isDefault: i === 0,
            })),
          },
        },
        include: { variants: true },
      });

      for (const variant of created.variants) {
        if (variant.stock > 0) {
          await tx.stockMovement.create({
            data: { variantId: variant.id, type: "INITIAL", quantity: variant.stock, previousStock: 0, newStock: variant.stock, notes: "Initial stock on product creation", userId: user.id },
          });
        }
      }
      return created;
    });

    await writeAudit({ businessId: user.businessId, userId: user.id, action: "PRODUCT_CREATED", entity: "Product", entityId: product.id, details: { title: product.title, sku: product.sku, status: product.status } });
    revalidateStorefront();
    return ok({ id: product.id, slug: product.slug, status: product.status }, 201);
  });
}
