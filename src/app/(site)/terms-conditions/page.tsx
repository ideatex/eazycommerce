import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | VANIGAM",
  description: "Read our terms of service, warranty, and return policies.",
};

export default function TermsConditionsPage() {
  return (
    <div className="pb-24 pt-10 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-4xl sm:px-8 xl:px-0">
        <div className="bg-white rounded-3xl border border-gray-3 p-8 sm:p-14 shadow-xs">
          <span className="text-xs font-bold text-blue uppercase tracking-widest block mb-2">
            Terms of Service
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark mb-4">
            Terms & Conditions
          </h1>
          <p className="text-xs text-gray-400 mb-8 pb-6 border-b border-gray-2">
            Last Updated: January 1, 2026
          </p>

          <div className="prose max-w-none text-gray-600 text-sm sm:text-base leading-relaxed space-y-6">
            <h2 className="text-xl font-bold text-dark">1. Agreement to Terms</h2>
            <p>
              By accessing the VANIGAM Platform and purchasing products, you agree to be bound by these Terms & Conditions. If you do not agree to all terms, you may not access or use the services.
            </p>

            <h2 className="text-xl font-bold text-dark">2. Products and Pricing</h2>
            <p>
              All prices displayed are subject to change without notice. We reserve the right to modify or discontinue products at any time. We make every effort to display product colors and specifications accurately, but cannot guarantee exact monitor rendering.
            </p>

            <h2 className="text-xl font-bold text-dark">3. Shipping and Delivery</h2>
            <p>
              Delivery timeframes are estimates provided by carrier partners (FedEx, DHL). VANIGAM is not liable for customs delays, severe weather disruptions, or courier delays beyond our reasonable control.
            </p>

            <h2 className="text-xl font-bold text-dark">4. Returns and Warranty</h2>
            <p>
              We offer a hassle-free 30-day return policy for unused items in original packaging. All electronics are backed by a minimum 1-year manufacturer warranty against hardware defects.
            </p>

            <h2 className="text-xl font-bold text-dark">5. Limitation of Liability</h2>
            <p>
              In no event shall VANIGAM, its directors, or affiliates be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use purchased items.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
