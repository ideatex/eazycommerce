import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { handle, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";
import { publicProductWhere, toStoreProduct } from "@/lib/storefront";

export const dynamic = "force-dynamic";

/**
 * Current price, availability and the variant to buy for products saved in a
 * visitor's (browser-side) wishlist. Public data only: unpublished products are
 * simply absent from the response.
 */
export async function GET(req: NextRequest) {
  return handle(async () => {
    rateLimit(req, "wishlist", 60, 60 * 1000);
    const ids = (req.nextUrl.searchParams.get("ids") || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[a-z0-9]{10,40}$/i.test(s))
      .slice(0, 50);
    if (ids.length === 0) return ok({ products: [] });

    const rows = await prisma.product.findMany({
      where: { id: { in: ids }, ...publicProductWhere },
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { orderBy: { createdAt: "asc" } },
        priceTiers: true,
        additionalInformation: { select: { name: true, description: true } },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
    });

    return ok({
      products: rows.map((row) => {
        const p = toStoreProduct(row);
        const buyable = p.productVariants.find((v) => v.available > 0) ?? p.productVariants[0] ?? null;
        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          image: p.thumbnails[0],
          price: buyable ? buyable.price : p.sellingPrice,
          listPrice: p.discountedPrice !== null ? p.price : null,
          available: p.quantity,
          moq: p.moq,
          variantId: buyable?.id ?? null,
          variantAvailable: buyable?.available ?? 0,
          color: buyable?.color ?? "",
          size: buyable?.size ?? "",
        };
      }),
    });
  });
}
