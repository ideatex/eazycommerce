import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prismaDB";
import { availableStock } from "@/lib/commerce";
import { buildDefaultSections } from "@/lib/storefrontSections";
import type {
  StoreCategory,
  StoreProduct,
  StoreReview,
  StoreSection,
  StoreVariant,
} from "@/types/storefront";

/**
 * Visibility rule for the public catalogue: published products only.
 */
export const publicProductWhere: Prisma.ProductWhereInput = {
  status: "PUBLISHED",
};

const productInclude = {
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: { createdAt: "asc" as const } },
  priceTiers: { orderBy: { minQuantity: "asc" as const } },
  additionalInformation: { select: { name: true, description: true } },
  reviews: { where: { isApproved: true }, select: { rating: true } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const FALLBACK_IMAGE = "/images/placeholder.svg";

function parseAttrs(json: string): Record<string, string> {
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k.toLowerCase(), String(v)]));
    }
  } catch {
    // fall through
  }
  return {};
}

export function toStoreProduct(p: ProductRow): StoreProduct {
  const images = p.images.map((i) => i.url);
  const mainImage = images[0] ?? FALLBACK_IMAGE;

  const variants: StoreVariant[] = p.variants.map((v, index) => {
    const attrs = parseAttrs(v.attributesJson);
    return {
      id: v.id,
      title: v.title,
      sku: v.sku,
      price: v.price,
      available: availableStock(v.stock, v.reservedStock),
      color: attrs.color || (v.title !== "Standard" ? v.title : ""),
      size: attrs.size || "",
      image: attrs.image || mainImage,
      isDefault: v.isDefault || index === 0,
    };
  });

  const ratings = p.reviews.map((r) => r.rating);
  const rating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
  const hasList = p.compareAtPrice !== null && p.compareAtPrice > p.basePrice;

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    shortDescription: p.shortDescription ?? "",
    description: p.description,
    price: hasList ? (p.compareAtPrice as number) : p.basePrice,
    discountedPrice: hasList ? p.basePrice : null,
    sellingPrice: p.basePrice,
    sku: p.sku,
    quantity: variants.reduce((sum, v) => sum + v.available, 0),
    moq: p.moq,
    reviews: ratings.length,
    rating,
    updatedAt: p.updatedAt,
    category: p.category ? { title: p.category.name, slug: p.category.slug } : null,
    tags: p.tags ? p.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    thumbnails: images.length ? images : [mainImage],
    previews: images.length ? images : [mainImage],
    productVariants: variants,
    priceTiers: p.priceTiers.map((t) => ({ minQuantity: t.minQuantity, price: t.price })),
    additionalInfo: p.additionalInformation,
  };
}

export type ProductSort = "newest" | "popular" | "price-low" | "price-high" | "rating" | "discount";

export interface ProductQuery {
  categorySlug?: string;
  search?: string;
  sort?: ProductSort;
  take?: number;
}

/** Published products for the public shop, home and category pages. */
export async function getStorefrontProducts(q: ProductQuery = {}): Promise<StoreProduct[]> {
  const and: Prisma.ProductWhereInput[] = [publicProductWhere];
  if (q.categorySlug) and.push({ category: { slug: q.categorySlug } });
  if (q.search?.trim()) {
    const term = q.search.trim().slice(0, 100);
    and.push({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { shortDescription: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { tags: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  const rows = await prisma.product.findMany({
    where: { AND: and },
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: q.take ?? 200,
  });

  const products = rows.map(toStoreProduct);
  switch (q.sort) {
    case "popular":
      return products.sort((a, b) => b.reviews - a.reviews);
    case "discount": {
      const pct = (p: StoreProduct) => (p.discountedPrice !== null ? (p.price - p.discountedPrice) / p.price : 0);
      return products.sort((a, b) => pct(b) - pct(a));
    }
    case "rating":
      return products.sort((a, b) => b.rating - a.rating);
    case "price-low":
      return products.sort((a, b) => a.sellingPrice - b.sellingPrice);
    case "price-high":
      return products.sort((a, b) => b.sellingPrice - a.sellingPrice);
    default:
      return products;
  }
}

export async function getStorefrontProductBySlug(slug: string): Promise<StoreProduct | null> {
  const row = await prisma.product.findFirst({
    where: { AND: [publicProductWhere, { slug }] },
    include: productInclude,
  });
  return row ? toStoreProduct(row) : null;
}

export async function getRelatedStorefrontProducts(product: StoreProduct, take = 4): Promise<StoreProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      AND: [
        publicProductWhere,
        { id: { not: product.id } },
        product.category ? { category: { slug: product.category.slug } } : {},
      ],
    },
    include: productInclude,
    orderBy: { updatedAt: "desc" },
    take,
  });
  return rows.map(toStoreProduct);
}

export async function getStoreReviews(productId: string): Promise<StoreReview[]> {
  const rows = await prisma.productReview.findMany({
    where: { productId, isApproved: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { customer: { select: { fullName: true, name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.customer.fullName || r.customer.name || "Verified customer",
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    isVerifiedPurchase: r.isVerifiedPurchase,
    createdAt: r.createdAt,
  }));
}

/** Active categories with the number of publicly visible products in each. */
export async function getStorefrontCategories(): Promise<StoreCategory[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: publicProductWhere } } } },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
    description: c.description,
    parentId: c.parentId,
    productCount: c._count.products,
  }));
}

/** Homepage sections as configured in Admin → Content (defaults until an admin saves). */
export async function getStorefrontSections(): Promise<StoreSection[]> {
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  const rows = business
    ? await prisma.storefrontSection.findMany({
        where: { businessId: business.id, isActive: true },
        orderBy: { sortOrder: "asc" },
      })
    : [];
  const source = rows.length
    ? rows
    : buildDefaultSections().map((s, i) => ({ ...s, id: `default-${i}` }));

  return source.map((s) => {
    let config: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(s.configJson);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) config = parsed;
    } catch {
      // Malformed config renders with defaults rather than breaking the homepage.
    }
    return { id: s.id, sectionType: s.sectionType, title: s.title, subtitle: s.subtitle, config };
  });
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const RADIUS = /^[0-9]{1,2}(\.[0-9]{1,3})?(rem|px)$/;

/** The active theme, validated again on read since it is injected into a <style> tag. */
export async function getActiveTheme() {
  const theme = await prisma.themeConfig.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } });
  if (!theme || !HEX.test(theme.primaryColor) || !HEX.test(theme.accentColor)) return null;
  return {
    presetName: theme.presetName,
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    borderRadius: RADIUS.test(theme.borderRadius) ? theme.borderRadius : "0.375rem",
  };
}

export async function getBusinessProfile() {
  return prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { name: true, currency: true, currencySymbol: true, email: true, phone: true, address: true, city: true, state: true, postalCode: true },
  });
}

export async function countStorefrontProducts(): Promise<number> {
  return prisma.product.count({ where: publicProductWhere });
}

/** Most recent approved reviews across the catalogue, for the homepage. */
export async function getTopReviews(limit = 3) {
  const rows = await prisma.productReview.findMany({
    where: { isApproved: true, product: publicProductWhere },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: Math.min(Math.max(limit, 1), 12),
    include: {
      customer: { select: { fullName: true, name: true } },
      product: { select: { title: true, slug: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.customer.fullName || r.customer.name || "Verified customer",
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    isVerifiedPurchase: r.isVerifiedPurchase,
    product: r.product,
  }));
}
