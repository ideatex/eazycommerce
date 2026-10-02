/** Public storefront shapes derived from the commerce database (never from fixtures). */

export interface StoreVariant {
  id: string;
  title: string;
  sku: string;
  price: number;
  available: number;
  /** Display attributes parsed from the variant's attributesJson. */
  color: string;
  size: string;
  image: string;
  isDefault: boolean;
}

export interface StoreProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  /** List price (compare-at price when set, otherwise the selling price). */
  price: number;
  /** Selling price when it is lower than the list price. */
  discountedPrice: number | null;
  /** The price a customer pays for a single unit. */
  sellingPrice: number;
  sku: string;
  /** Units available across all variants (stock minus reserved). */
  quantity: number;
  moq: number;
  reviews: number;
  rating: number;
  updatedAt: Date;
  category: { title: string; slug: string } | null;
  tags: string[];
  thumbnails: string[];
  previews: string[];
  productVariants: StoreVariant[];
  priceTiers: Array<{ minQuantity: number; price: number }>;
  additionalInfo: Array<{ name: string; description: string }>;
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  description: string | null;
  parentId: string | null;
  productCount: number;
}

export interface StoreSection {
  id: string;
  sectionType: string;
  title: string | null;
  subtitle: string | null;
  config: Record<string, unknown>;
}

export interface StoreReview {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
}
