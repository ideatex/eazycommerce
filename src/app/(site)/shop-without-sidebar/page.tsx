import { Metadata } from "next";
import ShopWithoutSidebarContent from "@/components/Shop/ShopWithoutSidebarContent";
import { getStorefrontProducts } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Shop Full Width | VANIGAM",
  description: "Explore all products in our catalog with full-width view.",
};

export default async function ShopWithoutSidebarPage() {
  const products = await getStorefrontProducts();
  return <ShopWithoutSidebarContent products={products} />;
}
