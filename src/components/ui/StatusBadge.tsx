import React from "react";

export interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "purple";
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  showDot = true,
  className = "",
}) => {
  // Infer variant from status string if not explicitly passed
  let computedVariant = variant;
  if (!computedVariant) {
    const s = status.toUpperCase();
    if (s.includes("ACTIVE") || s.includes("DELIVERED") || s.includes("PAID") || s.includes("APPROVED") || s.includes("FULFILLED") || s.includes("RESOLVED")) {
      computedVariant = "success";
    } else if (s.includes("PENDING") || s.includes("SUBMITTED") || s.includes("HOLD") || s.includes("PACKING") || s.includes("REQUESTED")) {
      computedVariant = "warning";
    } else if (s.includes("PROCESSING") || s.includes("SHIPPED") || s.includes("IN_TRANSIT") || s.includes("DISPATCHED")) {
      computedVariant = "info";
    } else if (s.includes("REJECTED") || s.includes("SUSPENDED") || s.includes("CANCELLED") || s.includes("FAILED") || s.includes("REFUNDED")) {
      computedVariant = "error";
    } else if (s.includes("TIER") || s.includes("WHOLESALE") || s.includes("SPECIAL")) {
      computedVariant = "purple";
    } else {
      computedVariant = "neutral";
    }
  }

  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue/10 text-blue border-blue/20",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    neutral: "bg-gray-2 text-gray-700 border-gray-3",
  };

  const dotColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
    info: "bg-blue",
    purple: "bg-purple-500",
    neutral: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${styles[computedVariant]} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[computedVariant]}`} />
      )}
      {status}
    </span>
  );
};
