import { Metadata } from "next";
import { Suspense } from "react";
import CustomerAccountHub from "@/components/Customer/CustomerAccountHub";

export const metadata: Metadata = {
  title: "Customer Account & Orders | VANIGAM",
  description: "Manage your customer orders, track multi-seller shipments, request returns, and manage addresses.",
};

export default function CustomerAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-1 py-20 text-center text-xs text-gray-400">Loading your account...</div>}>
      <CustomerAccountHub />
    </Suspense>
  );
}
