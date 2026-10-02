import React from "react";

export type BadgeVariant = "neutral" | "success" | "warning" | "error" | "info";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  className = "",
  children,
  ...props
}) => (
  <span
    className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold leading-4 ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {children}
  </span>
);
