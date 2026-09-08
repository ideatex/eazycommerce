import { Metadata } from "next";
import AdminLayout from "@/components/Admin/AdminLayout";

export const metadata: Metadata = {
  title: "VANIGAM B2B2C Platform Administration",
  description: "Enterprise multi-tenant operations, business governance, B2B purchase orders, and settlements.",
};

export default function RootAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
