import { Metadata } from "next";
import CMSManagementView from "@/components/Admin/CMSManagementView";

export const metadata: Metadata = {
  title: "Storefront CMS & Content Management | Admin Portal",
  description: "Unified Content Management System for storefront carousel sliders, promotional hero banners, countdown offers, header announcements, and blog articles.",
};

export default function CMSPage() {
  return <CMSManagementView />;
}
