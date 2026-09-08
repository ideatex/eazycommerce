import { Metadata } from "next";
import OrdersSplitView from "@/components/Admin/OrdersSplitView";

export const metadata: Metadata = {
  title: "Customer & Split Orders | VANIGAM Platform",
  description: "Monitor unified customer orders and automated seller business order decompositions.",
};

export default function OrdersAdminPage() {
  return <OrdersSplitView />;
}
