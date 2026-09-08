import { Metadata } from "next";
import { notFound } from "next/navigation";
import { mockProducts } from "@/data/mockProducts";
import ProductDetailsView from "@/components/Product/ProductDetailsView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = mockProducts.find((p) => p.slug === slug);

  if (!product) {
    return {
      title: "Product Not Found | VANIGAM",
    };
  }

  return {
    title: `${product.title} | VANIGAM`,
    description: product.shortDescription,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = mockProducts.find((p) => p.slug === slug);

  if (!product) {
    // If not found in mock, fallback to first product or notFound
    const fallback = mockProducts[0];
    if (!fallback) notFound();
    const related = mockProducts.filter((p) => p.id !== fallback.id);
    return <ProductDetailsView product={fallback} relatedProducts={related} />;
  }

  const relatedProducts = mockProducts.filter(
    (p) => p.id !== product.id && (p.category.slug === product.category.slug || true)
  );

  return <ProductDetailsView product={product} relatedProducts={relatedProducts} />;
}
