import React from "react";

export interface TrustFeaturesBarProps {
  className?: string;
  variant?: "full" | "compact";
}

export const TrustFeaturesBar: React.FC<TrustFeaturesBarProps> = ({
  className = "",
  variant = "full",
}) => {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      title: "Free Fast Shipping",
      description: "Direct partner dispatch on orders over $100",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "100% Verified Partners",
      description: "Every seller vetted with valid business KYC",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: "30-Day Easy Returns",
      description: "Hassle-free return policy on all eligible goods",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Escrow Protected Checkout",
      description: "Payments held securely until delivery confirmed",
    },
  ];

  if (variant === "compact") {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-1 rounded-2xl border border-gray-3 ${className}`}>
        {features.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-3 flex items-center justify-center shrink-0 shadow-xs">
              {item.icon}
            </div>
            <div>
              <h4 className="text-xs font-bold text-dark">{item.title}</h4>
              <p className="text-[11px] text-gray-500 leading-tight">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className={`py-8 bg-white border-y border-gray-2 ${className}`}>
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
          {features.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-1 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-gray-1 border border-gray-3 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-dark mb-0.5">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
