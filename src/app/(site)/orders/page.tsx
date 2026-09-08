import { Metadata } from "next";
import { Suspense } from "react";
import CustomerAccountHub from "@/components/Customer/CustomerAccountHub";

export const metadata: Metadata = {
  title: "My Orders & Shipments | VANIGAM",
  description: "View and track your multi-vendor customer orders and delivery updates.",
};

export default function CustomerOrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-1 py-20 text-center text-xs text-gray-400">Loading orders...</div>}>
      <CustomerAccountHub />
    </Suspense>
  );
}
