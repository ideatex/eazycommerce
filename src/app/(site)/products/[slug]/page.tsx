import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailsView from "@/components/Product/ProductDetailsView";
import {
  getRelatedStorefrontProducts,
  getStorefrontProductBySlug,
  getStoreReviews,
} from "@/lib/storefront";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  if (!product) return { title: "Product Not Found | VANIGAM" };
  return {
    title: `${product.title} | VANIGAM`,
    description: product.shortDescription || product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  // Draft and archived products are not publicly reachable.
  if (!product) notFound();

  const [relatedProducts, reviews] = await Promise.all([
    getRelatedStorefrontProducts(product),
    getStoreReviews(product.id),
  ]);

  return <ProductDetailsView product={product} relatedProducts={relatedProducts} reviews={reviews} />;
}
