import { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopWithSidebarContent from "@/components/Shop/ShopWithSidebarContent";
import { countStorefrontProducts, getStorefrontCategories, getStorefrontProducts } from "@/lib/storefront";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getStorefrontCategories()).find((c) => c.slug === slug);
  if (!category) return { title: "Category not found | VANIGAM" };
  return {
    title: `${category.name} | VANIGAM`,
    description: category.description || `Shop ${category.name} products.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [categories, products, totalCount] = await Promise.all([
    getStorefrontCategories(),
    getStorefrontProducts({ categorySlug: slug }),
    countStorefrontProducts(),
  ]);
  // Unknown or hidden (inactive) categories are a 404, not an empty shop.
  if (!categories.some((c) => c.slug === slug)) notFound();

  return (
    <ShopWithSidebarContent
      products={products}
      categories={categories}
      initialCategory={slug}
      totalCount={totalCount}
    />
  );
}
