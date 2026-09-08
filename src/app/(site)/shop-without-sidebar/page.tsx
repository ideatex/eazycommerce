import { Metadata } from "next";
import ShopWithoutSidebarContent from "@/components/Shop/ShopWithoutSidebarContent";

export const metadata: Metadata = {
  title: "Shop Full Width | VANIGAM",
  description: "Explore all products in our catalog with full-width view.",
};

export default function ShopWithoutSidebarPage() {
  return <ShopWithoutSidebarContent />;
}
