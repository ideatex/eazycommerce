import { Metadata } from "next";
import ShopWithSidebarContent from "@/components/Shop/ShopWithSidebarContent";

export const metadata: Metadata = {
  title: "Popular Products | VANIGAM",
  description: "Browse our most popular and highest rated e-commerce items.",
};

export default function PopularPage() {
  return <ShopWithSidebarContent initialSort="popular" />;
}
