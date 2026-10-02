import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 min-w-0">
    <div className="min-w-0">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-neutral-400 mb-1">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-neutral-700 hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-neutral-600">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">{title}</h1>
      {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
    </div>
    {actions && <div className="shrink-0">{actions}</div>}
  </div>
);
