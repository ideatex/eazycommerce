"use client";

import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, ExternalLink, LogOut } from "lucide-react";
import { useAdminNav } from "@/context/AdminNavContext";

interface AdminTopBarProps {
  user: { fullName: string; role: string };
}

export function AdminTopBar({ user }: AdminTopBarProps) {
  const { openMobile } = useAdminNav();

  return (
    <header className="h-14 shrink-0 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
      <button
        type="button"
        onClick={openMobile}
        aria-label="Open navigation"
        className="lg:hidden p-1.5 -ml-1.5 text-neutral-600 hover:text-neutral-900"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden lg:block text-xs text-neutral-500">Platform administration</div>

      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900"
        >
          View storefront <ExternalLink className="w-3 h-3" />
        </Link>
        <div className="text-right leading-tight">
          <div className="text-xs font-semibold text-neutral-900 truncate max-w-[10rem]">
            {user.fullName}
          </div>
          <div className="text-[10px] text-neutral-400">{user.role.replace("_", " ")}</div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-rose-600"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
