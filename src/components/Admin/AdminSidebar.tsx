"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Boxes,
  Users,
  Building2,
  Ticket,
  Star,
  LayoutTemplate,
  Palette,
  BarChart3,
  ScrollText,
  Settings,
  Activity,
  X,
} from "lucide-react";
import { useAdminNav } from "@/context/AdminNavContext";

const NAV_GROUPS: Array<{
  label: string;
  items: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }>;
}> = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/b2b", label: "B2B Accounts", icon: Building2 },
    ],
  },
  {
    label: "Storefront",
    items: [
      { href: "/admin/content", label: "Content", icon: LayoutTemplate },
      { href: "/admin/themes", label: "Themes", icon: Palette },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/system-health", label: "System Health", icon: Activity },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(href + "/");
}

function NavList() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            {group.label}
          </div>
          <ul className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                      active
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  const { mobileOpen, closeMobile } = useAdminNav();

  return (
    <>
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-white border-r border-neutral-200 sticky top-0 h-screen">
        <div className="h-14 px-5 flex items-center border-b border-neutral-100">
          <Link href="/admin" className="text-sm font-bold tracking-tight text-neutral-900">
            Vanigam Admin
          </Link>
        </div>
        <NavList />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-neutral-900/50" onClick={closeMobile} aria-hidden="true" />
          <aside className="relative w-64 max-w-[85vw] flex flex-col bg-white shadow-xl">
            <div className="h-14 px-5 flex items-center justify-between border-b border-neutral-100">
              <span className="text-sm font-bold tracking-tight text-neutral-900">Vanigam Admin</span>
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Close navigation"
                className="p-1 text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <NavList />
          </aside>
        </div>
      )}
    </>
  );
}
