import { Metadata } from "next";
import ShopWithSidebarContent from "@/components/Shop/ShopWithSidebarContent";
import { getStorefrontCategories, getStorefrontProducts } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Popular Products | VANIGAM",
  description: "Our most reviewed and highest rated products.",
};

export default async function PopularPage() {
  const [products, categories] = await Promise.all([
    getStorefrontProducts({ sort: "popular" }),
    getStorefrontCategories(),
  ]);
  return (
    <ShopWithSidebarContent products={products} categories={categories} initialSort="popular" />
  );
}
