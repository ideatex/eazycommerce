import { Metadata } from "next";
import DynamicAdminDashboard from "@/components/Admin/DynamicAdminDashboard";

export const metadata: Metadata = {
  title: "Workspace Operations & Control Tower | VANIGAM B2B2C",
  description: "Dynamic operational dashboard adapting to enterprise workspace tier, user role, and active permissions.",
};

export default function AdminDashboardPage() {
  return <DynamicAdminDashboard />;
}
