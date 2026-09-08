import { prisma } from "@/lib/prismaDB";
import { initialProductOffers, initialRelationships } from "@/lib/b2b2c/mockVanigamData";

export interface PricingRequestItem {
  productId: string;
  organizationId?: string;
  quantity: number;
  clientSubmittedPrice?: number;
  color?: string;
  size?: string;
}

export interface AuthoritativePriceResult {
  productId: string;
  productTitle: string;
  organizationId: string;
  organizationName: string;
  unitPrice: number;
  totalPrice: number;
  originalSubmittedPrice?: number;
  priceAdjusted: boolean;
  moq: number;
  moqSatisfied: boolean;
  appliedRule: "RETAIL" | "WHOLESALE" | "CONTRACT_RELATIONSHIP" | "VOLUME_BREAK";
  discountPercentage: number;
}

/**
 * Centralized Server-Side Pricing Engine
 * Authoritatively calculates unit price, volume discounts, contract pricing,
 * and validates Minimum Order Quantity (MOQ).
 * The client browser is NEVER trusted for final pricing.
 */
export async function calculateAuthoritativePrice(
  item: PricingRequestItem,
  buyerOrgId?: string
): Promise<AuthoritativePriceResult> {
  const targetOrgId = item.organizationId || "org-seller-velocity";
  const quantity = Math.max(1, item.quantity || 1);

  // 1. Fetch authoritative commercial offer from DB or fallback
  let basePrice = 29.99;
  let wholesalePrice = 22.0;
  let productTitle = "Product Item";
  let organizationName = "Authorized Seller";
  let moq = 1;

  try {
    const offer = await prisma.productOffer.findFirst({
      where: {
        productId: item.productId,
        organizationId: targetOrgId,
        isMarketplaceLive: true,
      },
      include: {
        product: true,
        organization: true,
      },
    });

    if (offer) {
      basePrice = Number(offer.sellingPrice);
      wholesalePrice = Number(offer.wholesalePrice || offer.sellingPrice);
      productTitle = offer.product.title;
      organizationName = offer.organization.name;
      moq = offer.minimumQuantity;
    } else {
      // Memory fallback lookup
      const memOffer = initialProductOffers.find(
        (o) => o.productId === item.productId && o.organizationId === targetOrgId
      ) || initialProductOffers.find((o) => o.productId === item.productId);

      if (memOffer) {
        basePrice = memOffer.sellingPrice;
        wholesalePrice = memOffer.wholesalePrice;
        productTitle = memOffer.productTitle;
        organizationName = memOffer.organizationName;
        moq = memOffer.minimumOrderQuantity;
      }
    }
  } catch {
    const memOffer = initialProductOffers.find(
      (o) => o.productId === item.productId && o.organizationId === targetOrgId
    ) || initialProductOffers.find((o) => o.productId === item.productId);

    if (memOffer) {
      basePrice = memOffer.sellingPrice;
      wholesalePrice = memOffer.wholesalePrice;
      productTitle = memOffer.productTitle;
      organizationName = memOffer.organizationName;
      moq = memOffer.minimumOrderQuantity;
    }
  }

  // 2. Determine applied rule according to price precedence hierarchy:
  // Precedence: Contract/Relationship > Volume Break > Wholesale Lot > Retail
  let unitPrice = basePrice;
  let appliedRule: AuthoritativePriceResult["appliedRule"] = "RETAIL";
  let discountPercentage = 0;

  // Check relationship contract pricing if buyer is a known business organization
  if (buyerOrgId && buyerOrgId !== targetOrgId) {
    const hasActiveRelationship = initialRelationships.some(
      (r) =>
        r.status === "ACTIVE" &&
        ((r.sourceOrgId === targetOrgId && r.targetOrgId === buyerOrgId) ||
          (r.sourceOrgId === buyerOrgId && r.targetOrgId === targetOrgId))
    );

    if (hasActiveRelationship) {
      unitPrice = Number((wholesalePrice * 0.95).toFixed(2)); // Extra 5% partner discount
      appliedRule = "CONTRACT_RELATIONSHIP";
      discountPercentage = 5;
    }
  }

  // Check volume pricing breaks
  if (appliedRule === "RETAIL") {
    if (quantity >= 50) {
      unitPrice = wholesalePrice;
      appliedRule = "WHOLESALE";
      discountPercentage = Number((((basePrice - wholesalePrice) / basePrice) * 100).toFixed(1));
    } else if (quantity >= 10) {
      unitPrice = Number((basePrice * 0.9).toFixed(2)); // 10% volume discount for 10+
      appliedRule = "VOLUME_BREAK";
      discountPercentage = 10;
    }
  }

  const moqSatisfied = quantity >= moq;
  const totalPrice = Number((unitPrice * quantity).toFixed(2));
  const priceAdjusted =
    item.clientSubmittedPrice !== undefined &&
    Math.abs(item.clientSubmittedPrice - unitPrice) > 0.01;

  return {
    productId: item.productId,
    productTitle,
    organizationId: targetOrgId,
    organizationName,
    unitPrice,
    totalPrice,
    originalSubmittedPrice: item.clientSubmittedPrice,
    priceAdjusted,
    moq,
    moqSatisfied,
    appliedRule,
    discountPercentage,
  };
}
