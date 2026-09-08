import { Metadata } from "next";
import Link from "next/link";
import { TrustFeaturesBar } from "@/components/ui/TrustFeaturesBar";

export const metadata: Metadata = {
  title: "Order Confirmation | VANIGAM B2B2C Marketplace",
  description: "Your order has been confirmed. View multi-seller shipment tracking and delivery details.",
};

interface PageProps {
  searchParams: Promise<{
    orderNo?: string;
    email?: string;
    packages?: string;
  }>;
}

export default async function OrderConfirmationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderNo = params.orderNo || "MO-2026-90412";
  const customerEmail = params.email ? decodeURIComponent(params.email) : "customer@example.com";
  const packageCount = Number(params.packages) || 2;

  return (
    <div className="pb-24 pt-10 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-4xl sm:px-8 xl:px-0">
        {/* Main Success Card */}
        <div className="bg-white rounded-3xl border border-gray-3 p-8 sm:p-12 shadow-xs mb-10 text-center">
          {/* Checkmark */}
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-2">
            Payment Confirmed • Escrow Protected
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-dark mb-3">
            Thank You for Your Order!
          </h1>

          <p className="text-sm text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">
            We have confirmed your purchase. A receipt and tracking overview have been sent to{" "}
            <strong className="text-dark font-mono">{customerEmail}</strong>.
          </p>

          {/* Master Order Meta Box */}
          <div className="bg-gray-1 p-5 rounded-2xl border border-gray-3 max-w-xl mx-auto text-left text-xs space-y-3 mb-8">
            <div className="flex justify-between items-center pb-2 border-b border-gray-2">
              <span className="text-gray-500">Master Order Reference:</span>
              <span className="font-mono font-bold text-dark text-sm">{orderNo}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-2">
              <span className="text-gray-500">Number of Partner Packages:</span>
              <span className="font-bold text-blue text-sm">{packageCount} Shipments</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Payment Status:</span>
              <span className="font-bold text-emerald-600">✓ Settled in Escrow</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/account?tab=orders"
              className="py-3.5 px-8 bg-blue hover:bg-blue-dark text-white font-bold text-sm rounded-xl transition-all shadow-xs"
            >
              Track Shipments in My Account →
            </Link>
            <Link
              href="/shop-with-sidebar"
              className="py-3.5 px-8 bg-gray-2 hover:bg-gray-3 text-dark font-bold text-sm rounded-xl transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Multi-Shipment Breakdown Preview */}
        <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs mb-10">
          <h2 className="text-lg font-extrabold text-dark mb-4">
            Partner Shipment Logistics Schedule
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-gray-1 rounded-2xl border border-gray-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue/10 text-blue font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-dark text-sm">Package A: Velocity Tech Store</h3>
                  <p className="text-xs text-gray-500">Gaming & Controller Accessories • Standard Courier</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-bold text-emerald-600 block">Est. 2 - 3 Business Days</span>
                <span className="text-[11px] text-gray-400 font-mono">Status: Preparing Dispatch</span>
              </div>
            </div>

            {packageCount > 1 && (
              <div className="p-4 bg-gray-1 rounded-2xl border border-gray-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-dark text-sm">Package B: Apex SmartWear Co.</h3>
                    <p className="text-xs text-gray-500">Titanium Smartwatches & Wearables • Priority Dispatch</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-bold text-emerald-600 block">Est. 1 - 2 Business Days</span>
                  <span className="text-[11px] text-gray-400 font-mono">Status: Awaiting Courier Pickup</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Platform Trust Guarantee */}
        <TrustFeaturesBar />
      </div>
    </div>
  );
}
