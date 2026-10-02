"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface AdminNavState {
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

const AdminNavContext = createContext<AdminNavState | null>(null);

export function AdminNavProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer after navigating.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <AdminNavContext.Provider
      value={{
        mobileOpen,
        openMobile: () => setMobileOpen(true),
        closeMobile: () => setMobileOpen(false),
      }}
    >
      {children}
    </AdminNavContext.Provider>
  );
}

export function useAdminNav(): AdminNavState {
  const ctx = useContext(AdminNavContext);
  if (!ctx) throw new Error("useAdminNav must be used inside <AdminNavProvider>");
  return ctx;
}
