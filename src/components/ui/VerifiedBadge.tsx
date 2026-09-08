import React from "react";

export interface VerifiedBadgeProps {
  type?: "OFFICIAL_STORE" | "VERIFIED_SELLER" | "AUTHORIZED_DISTRIBUTOR" | "BUYER_PROTECTION";
  size?: "sm" | "md";
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  type = "VERIFIED_SELLER",
  size = "sm",
  className = "",
}) => {
  const configs = {
    OFFICIAL_STORE: {
      label: "Official Brand Store",
      bg: "bg-blue/10 text-blue border-blue/20",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    VERIFIED_SELLER: {
      label: "Verified Partner",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    AUTHORIZED_DISTRIBUTOR: {
      label: "Authorized Distributor",
      bg: "bg-purple-50 text-purple-700 border-purple-200",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    BUYER_PROTECTION: {
      label: "Buyer Protection",
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const current = configs[type] || configs.VERIFIED_SELLER;
  const sizeClasses = size === "sm" ? "text-[11px] px-2.5 py-0.5" : "text-xs px-3 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border tracking-wide uppercase ${current.bg} ${sizeClasses} ${className}`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};
