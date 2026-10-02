import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";
import { getStorefrontProducts } from "@/lib/storefront";

export const dynamic = "force-dynamic";

/** Public search over the live catalogue (published products). */
export async function GET(req: NextRequest) {
  return handle(async () => {
    rateLimit(req, "search", 60, 60 * 1000);
    const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
    if (q.length < 2) return ok({ products: [] });

    const products = await getStorefrontProducts({ search: q, take: 8 });
    return ok({
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        price: p.sellingPrice,
        image: p.thumbnails[0],
        category: p.category?.title ?? null,
      })),
    });
  });
}
