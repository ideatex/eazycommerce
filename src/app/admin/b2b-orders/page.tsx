import { Metadata } from "next";
import B2BOrdersView from "@/components/Admin/B2BOrdersView";

export const metadata: Metadata = {
  title: "B2B Purchase Orders | VANIGAM Platform",
  description: "Manage wholesale B2B procurement, credit terms, and purchase orders between suppliers and distributors.",
};

export default function B2BOrdersAdminPage() {
  return <B2BOrdersView />;
}
