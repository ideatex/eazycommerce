import { Metadata } from "next";
import ShopWithSidebarContent from "@/components/Shop/ShopWithSidebarContent";

export const metadata: Metadata = {
  title: "Shop All Products | VANIGAM",
  description: "Browse our catalog of high quality electronics, computers, and accessories with flexible filters.",
};

export default function ShopWithSidebarPage() {
  return <ShopWithSidebarContent />;
}
