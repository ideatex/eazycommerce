"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    q: "What is the Minimum Order Quantity (MOQ) for B2B wholesale orders?",
    a: "Each product shows its minimum order quantity. Approved B2B accounts also see volume pricing tiers and any agreed credit terms. Contact us to apply for a B2B account.",
  },
  {
    q: "What payment methods are supported for retail and B2B purchases?",
    a: "You can pay cash on delivery, or online by card or UPI when online payments are enabled. Approved B2B accounts may be offered credit terms.",
  },
];

export default function FAQView() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="pb-24 pt-10 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-4xl sm:px-8 xl:px-0">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-blue uppercase tracking-widest block mb-2">
            Help & Knowledge Center
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Everything you need to know about the VANIGAM B2B2C marketplace, supply chains, and orders.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left font-bold text-dark text-base sm:text-lg flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <span className={`text-blue font-bold text-xl transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-2 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-3 p-8 text-center shadow-xs">
          <h3 className="text-lg font-bold text-dark mb-1">Still have questions?</h3>
          <p className="text-xs text-gray-400 mb-4">
            Can&apos;t find the answer you&apos;re looking for? Reach out to our 24/7 dedicated support team.
          </p>
          <Link
            href="/contact"
            className="inline-block py-2.5 px-6 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition shadow-sm"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
}
