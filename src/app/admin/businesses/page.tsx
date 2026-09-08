import { Metadata } from "next";
import BusinessManagementView from "@/components/Admin/BusinessManagementView";

export const metadata: Metadata = {
  title: "Business Governance & KYC | VANIGAM B2B2C Platform",
  description: "Manage registered manufacturers, distributors, authorized sellers, and commercial supply links.",
};

export default function BusinessesAdminPage() {
  return <BusinessManagementView />;
}
