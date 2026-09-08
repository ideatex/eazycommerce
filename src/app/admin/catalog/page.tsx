import { Metadata } from "next";
import CatalogOffersView from "@/components/Admin/CatalogOffersView";

export const metadata: Metadata = {
  title: "Master Catalog & Offers | VANIGAM Platform",
  description: "Manage global master products and multi-seller commercial offers.",
};

export default function CatalogAdminPage() {
  return <CatalogOffersView />;
}
