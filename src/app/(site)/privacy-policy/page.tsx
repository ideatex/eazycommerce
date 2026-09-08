import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | VANIGAM",
  description: "Learn how VANIGAM collects, uses, and safeguards your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pb-24 pt-10 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-4xl sm:px-8 xl:px-0">
        <div className="bg-white rounded-3xl border border-gray-3 p-8 sm:p-14 shadow-xs">
          <span className="text-xs font-bold text-blue uppercase tracking-widest block mb-2">
            Legal & Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark mb-4">
            Privacy Policy
          </h1>
          <p className="text-xs text-gray-400 mb-8 pb-6 border-b border-gray-2">
            Last Updated: January 1, 2026
          </p>

          <div className="prose max-w-none text-gray-600 text-sm sm:text-base leading-relaxed space-y-6">
            <h2 className="text-xl font-bold text-dark">1. Information We Collect</h2>
            <p>
              When you visit the VANIGAM Platform or make a purchase, we collect certain details including your name, shipping and billing address, email address, phone number, and payment information processed through secure PCI-DSS certified payment gateways.
            </p>

            <h2 className="text-xl font-bold text-dark">2. How We Use Your Information</h2>
            <p>
              We use the information collected to fulfill orders, communicate order confirmations, updates, and tracking numbers, prevent fraud, and provide tailored product recommendations if you have opted in.
            </p>

            <h2 className="text-xl font-bold text-dark">3. Cookies and Analytics</h2>
            <p>
              We utilize functional session cookies to remember your shopping cart items, preferred currency, and active login state. We also use anonymized telemetry to optimize storefront performance and navigation flows.
            </p>

            <h2 className="text-xl font-bold text-dark">4. Data Security</h2>
            <p>
              All customer transmissions are encrypted using industry-standard Transport Layer Security (TLS 1.3 / 256-bit encryption). We never store raw credit card numbers or banking secrets on our servers.
            </p>

            <h2 className="text-xl font-bold text-dark">5. Contact Information</h2>
            <p>
              If you have any questions about this Privacy Policy or wish to exercise your data rights (including GDPR / CCPA access or deletion requests), please email us at <a href="mailto:privacy@vanigam.com" className="text-blue font-medium underline">privacy@vanigam.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
