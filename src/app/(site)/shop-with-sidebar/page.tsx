import { Metadata } from "next";
import ShopWithSidebarContent from "@/components/Shop/ShopWithSidebarContent";
import { getStorefrontCategories, getStorefrontProducts } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Shop All Products | VANIGAM",
  description: "Browse the full catalogue with category, store, price and availability filters.",
};

export default async function ShopWithSidebarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [products, categories] = await Promise.all([
    getStorefrontProducts(),
    getStorefrontCategories(),
  ]);
  return (
    <ShopWithSidebarContent
      products={products}
      categories={categories}
      initialSearch={typeof q === "string" ? q.slice(0, 100) : ""}
    />
  );
}
