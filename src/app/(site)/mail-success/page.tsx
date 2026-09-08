import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order Placed Successfully | VANIGAM",
  description: "Thank you for your order. We are preparing your shipment.",
};

export default function MailSuccessPage() {
  return (
    <div className="pb-24 pt-12 bg-gray-1 min-h-[70vh] flex items-center justify-center">
      <div className="w-full px-4 mx-auto max-w-xl text-center">
        <div className="bg-white rounded-3xl border border-gray-3 p-8 sm:p-14 shadow-xs">
          {/* Animated Success Checkmark */}
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-2">
            Payment & Order Confirmed
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark mb-4">
            Thank You for Your Order!
          </h1>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
            We have received your order details and sent a confirmation email with your invoice and tracking number.
          </p>

          <div className="bg-gray-2 p-4 rounded-xl border border-gray-3 text-left text-xs text-gray-500 space-y-2 mb-8">
            <div className="flex justify-between">
              <span>Order Number:</span>
              <span className="font-mono font-bold text-dark">#VNG-2026-89412</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Delivery:</span>
              <span className="font-bold text-dark">3 - 5 Business Days</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Partner:</span>
              <span className="font-bold text-dark">FedEx Express</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop-with-sidebar"
              className="py-3 px-6 bg-blue text-white rounded-xl text-sm font-bold hover:bg-blue-dark transition duration-200 shadow-sm"
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="py-3 px-6 bg-gray-2 text-dark rounded-xl text-sm font-bold hover:bg-gray-3 transition duration-200"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
