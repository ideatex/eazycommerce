import { prisma } from "@/lib/prismaDB";
import {
  initialProductOffers,
  VanigamProductOffer,
} from "@/lib/b2b2c/mockVanigamData";

let inMemoryOffers: VanigamProductOffer[] = [...initialProductOffers];

export async function getProductOffers(orgId?: string): Promise<VanigamProductOffer[]> {
  try {
    const offers = await prisma.productOffer.findMany({
      where: orgId ? { organizationId: orgId } : undefined,
      include: {
        organization: true,
        product: true,
      },
    });

    if (offers && offers.length > 0) {
      return offers.map((o) => ({
        id: o.id,
        organizationId: o.organizationId,
        organizationName: o.organization.name,
        productId: o.productId,
        productTitle: o.product.title,
        sku: o.product.sku || "SKU-DEFAULT",
        sellingPrice: Number(o.sellingPrice),
        costPrice: Number(o.costPrice || 0),
        wholesalePrice: Number(o.wholesalePrice || 0),
        minimumOrderQuantity: o.minimumQuantity,
        stockQuantity: 100,
        leadTimeDays: o.leadTimeDays,
        isMarketplaceLive: o.isMarketplaceLive,
        status: o.status as any,
      }));
    }
    return orgId ? inMemoryOffers.filter((o) => o.organizationId === orgId) : inMemoryOffers;
  } catch {
    return orgId ? inMemoryOffers.filter((o) => o.organizationId === orgId) : inMemoryOffers;
  }
}

export async function getOffersForProduct(productId: string): Promise<VanigamProductOffer[]> {
  try {
    const offers = await prisma.productOffer.findMany({
      where: { productId, isMarketplaceLive: true },
      include: {
        organization: true,
        product: true,
      },
    });

    if (offers && offers.length > 0) {
      return offers.map((o) => ({
        id: o.id,
        organizationId: o.organizationId,
        organizationName: o.organization.name,
        productId: o.productId,
        productTitle: o.product.title,
        sku: o.product.sku || "SKU-DEFAULT",
        sellingPrice: Number(o.sellingPrice),
        costPrice: Number(o.costPrice || 0),
        wholesalePrice: Number(o.wholesalePrice || 0),
        minimumOrderQuantity: o.minimumQuantity,
        stockQuantity: 100,
        leadTimeDays: o.leadTimeDays,
        isMarketplaceLive: o.isMarketplaceLive,
        status: o.status as any,
      }));
    }
    return inMemoryOffers.filter((o) => o.productId === productId && o.isMarketplaceLive);
  } catch {
    return inMemoryOffers.filter((o) => o.productId === productId && o.isMarketplaceLive);
  }
}

export async function createOrUpdateOffer(
  data: Partial<VanigamProductOffer> & { organizationId: string; productId: string }
): Promise<VanigamProductOffer> {
  const existingIdx = data.id
    ? inMemoryOffers.findIndex((o) => o.id === data.id)
    : inMemoryOffers.findIndex(
        (o) => o.organizationId === data.organizationId && o.productId === data.productId
      );

  const offer: VanigamProductOffer = {
    id: data.id || (existingIdx !== -1 ? inMemoryOffers[existingIdx].id : `offer-${Date.now()}`),
    organizationId: data.organizationId,
    organizationName: data.organizationName || (existingIdx !== -1 ? inMemoryOffers[existingIdx].organizationName : "Seller Store"),
    productId: data.productId,
    productTitle: data.productTitle || (existingIdx !== -1 ? inMemoryOffers[existingIdx].productTitle : "Product"),
    productImage: data.productImage || (existingIdx !== -1 ? inMemoryOffers[existingIdx].productImage : "/images/products/product-1-bg-1.png"),
    sku: data.sku || (existingIdx !== -1 ? inMemoryOffers[existingIdx].sku : "SKU-OFFER"),
    sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : 50,
    costPrice: data.costPrice !== undefined ? data.costPrice : 35,
    wholesalePrice: data.wholesalePrice !== undefined ? data.wholesalePrice : 40,
    minimumOrderQuantity: data.minimumOrderQuantity !== undefined ? data.minimumOrderQuantity : 1,
    stockQuantity: data.stockQuantity !== undefined ? data.stockQuantity : 100,
    leadTimeDays: data.leadTimeDays !== undefined ? data.leadTimeDays : 1,
    isMarketplaceLive: data.isMarketplaceLive !== undefined ? data.isMarketplaceLive : true,
    status: "ACTIVE",
  };

  try {
    await prisma.productOffer.upsert({
      where: {
        organizationId_productId_productVariantId: {
          organizationId: data.organizationId,
          productId: data.productId,
          productVariantId: null as any,
        },
      },
      update: {
        sellingPrice: offer.sellingPrice,
        costPrice: offer.costPrice,
        wholesalePrice: offer.wholesalePrice,
        minimumQuantity: offer.minimumOrderQuantity,
        leadTimeDays: offer.leadTimeDays,
        isMarketplaceLive: offer.isMarketplaceLive,
      },
      create: {
        organizationId: data.organizationId,
        productId: data.productId,
        sellingPrice: offer.sellingPrice,
        costPrice: offer.costPrice,
        wholesalePrice: offer.wholesalePrice,
        minimumQuantity: offer.minimumOrderQuantity,
        leadTimeDays: offer.leadTimeDays,
        isMarketplaceLive: offer.isMarketplaceLive,
      },
    });
  } catch {
    // handled by in-memory sync
  }

  if (existingIdx !== -1) {
    inMemoryOffers[existingIdx] = offer;
  } else {
    inMemoryOffers.unshift(offer);
  }

  return offer;
}

export async function deleteProductOffer(offerId: string): Promise<boolean> {
  const idx = inMemoryOffers.findIndex((o) => o.id === offerId);
  if (idx !== -1) {
    inMemoryOffers.splice(idx, 1);
  }
  try {
    await prisma.productOffer.delete({ where: { id: offerId } });
  } catch {}
  return true;
}

export function getOfferByOrgAndProduct(orgId: string, productId: string): VanigamProductOffer | undefined {
  return inMemoryOffers.find(
    (o) => o.organizationId === orgId && o.productId === productId
  );
}

export async function incrementOfferStock(
  orgId: string,
  productId: string,
  quantity: number,
  productTitle?: string
): Promise<VanigamProductOffer> {
  let offer = inMemoryOffers.find(
    (o) => o.organizationId === orgId && o.productId === productId
  );

  if (!offer) {
    offer = await createOrUpdateOffer({
      organizationId: orgId,
      productId,
      productTitle: productTitle || "Wholesale Sourced Product",
      stockQuantity: quantity,
      sellingPrice: 29.99,
      wholesalePrice: 22.0,
      minimumOrderQuantity: 1,
      isMarketplaceLive: true,
    });
  } else {
    offer.stockQuantity += quantity;
    offer.isMarketplaceLive = true;
    offer.status = "ACTIVE";
  }

  return offer;
}

export async function decrementOfferStock(
  orgId: string,
  productId: string,
  quantity: number
): Promise<VanigamProductOffer> {
  const offer = inMemoryOffers.find(
    (o) => o.organizationId === orgId && o.productId === productId
  );

  if (!offer) {
    throw new Error(`PRODUCT_NOT_FOUND: Offer for product ${productId} not found in organization ${orgId}.`);
  }

  if (offer.stockQuantity < quantity) {
    throw new Error(
      `INSUFFICIENT_STOCK: Cannot deduct ${quantity} units. Only ${offer.stockQuantity} units available for ${offer.productTitle}.`
    );
  }

  offer.stockQuantity -= quantity;
  if (offer.stockQuantity === 0) {
    offer.isMarketplaceLive = false;
  }

  return offer;
}

export async function toggleOfferMarketplaceLive(offerId: string): Promise<VanigamProductOffer> {
  const offer = inMemoryOffers.find((o) => o.id === offerId);
  if (!offer) {
    throw new Error(`Offer ${offerId} not found`);
  }
  offer.isMarketplaceLive = !offer.isMarketplaceLive;
  try {
    await prisma.productOffer.update({
      where: { id: offerId },
      data: { isMarketplaceLive: offer.isMarketplaceLive },
    });
  } catch {
    // in-memory sync
  }
  return offer;
}

