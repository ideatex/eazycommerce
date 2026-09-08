"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { WorkspaceProvider, useWorkspace } from "@/context/WorkspaceContext";
import { UserRole } from "@/lib/auth/rbacMatrix";
import {
  actionGetNotifications,
  actionMarkNotificationAsRead,
  actionMarkAllNotificationsAsRead,
} from "@/actions/vanigamActions";
import { NotificationEntry } from "@/services/auditAndNotificationService";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    currentUser,
    currentWorkspace,
    allWorkspaces,
    currentRole,
    accessibleModules,
    switchWorkspace,
    switchRole,
    hasPermission,
  } = useWorkspace();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await actionGetNotifications(currentWorkspace.id);
      setNotifications(res || []);
    } catch {
      // quiet fallback
    }
  }, [currentWorkspace.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    await actionMarkNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await actionMarkAllNotificationsAsRead(currentWorkspace.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const isPlatform = currentWorkspace.organizationType === "PLATFORM";

  const iconMap: Record<string, React.ReactNode> = {
    dashboard: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    governance: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    b2b_orders: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    orders: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    catalog: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    cms: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    finance: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const badgeMap: Record<string, string | null> = {
    governance: isPlatform ? "5 KYC" : null,
    b2b_orders: "2 POs",
    cms: "Live",
    finance: "Eligible",
  };

  // Check if current route is accessible in this workspace/role
  const currentModule = accessibleModules.find((m) => m.href === pathname);
  const isRestrictedRoute = pathname !== "/admin" && !currentModule;

  const availableRoles: UserRole[] = isPlatform
    ? ["SUPER_ADMIN"]
    : ["ORG_OWNER", "ORG_ADMIN", "INVENTORY_MANAGER", "SALES_MANAGER", "FINANCE_MANAGER"];

  return (
    <div className="flex h-screen bg-[#F4F6F8] font-sans antialiased overflow-hidden">
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Mobile Off-Canvas Drawer + Desktop Collapsible */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#111928] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } ${sidebarOpen ? "md:w-64" : "md:w-20"} shrink-0`}
      >
        <div>
          {/* Logo & Platform Badge */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
            <Link
              href="/admin"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-3 overflow-hidden"
            >
              <Image
                src="/images/logo/logo-icon.svg"
                alt="Vanigam Commerce"
                width={40}
                height={40}
                className="h-9.5 w-9.5 object-contain shrink-0 rounded-xl"
              />
              {(sidebarOpen || mobileSidebarOpen) && (
                <div>
                  <span className="font-extrabold text-base tracking-wide block leading-tight text-white">
                    VANIGAM
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono tracking-wider block">
                    B2B2C PLATFORM
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hidden md:block"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-label="Toggle sidebar collapse"
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="text-gray-400 hover:text-white p-2 rounded-lg md:hidden"
              title="Close navigation"
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="p-3 border-b border-gray-800 relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="w-full bg-[#1F2A37] hover:bg-[#374151] p-2.5 rounded-xl flex items-center justify-between transition text-left"
            >
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                  Active Workspace
                </span>
                <span className="font-bold text-xs truncate block text-white">
                  {sidebarOpen ? currentWorkspace.name : currentWorkspace.name.slice(0, 3)}
                </span>
              </div>
              {sidebarOpen && <span className="text-xs text-gray-400">▼</span>}
            </button>

            {/* Dropdown Menu */}
            {orgDropdownOpen && (
              <div className="absolute top-18 left-3 right-3 bg-[#1F2A37] border border-gray-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 px-2 py-1 block uppercase">
                  Switch Enterprise Workspace
                </span>
                {allWorkspaces.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      switchWorkspace(org.id);
                      setOrgDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                      currentWorkspace.id === org.id
                        ? "bg-blue text-white font-bold"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 font-mono">
                      {org.organizationType}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Navigation Links (Derived from accessibleModules) */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {sidebarOpen ? `${currentWorkspace.organizationType} Modules` : "•"}
            </div>

            {accessibleModules.map((item) => {
              const active = pathname === item.href;
              const badge = badgeMap[item.key];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition group ${
                    active
                      ? "bg-blue text-white font-bold shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? "text-white" : "text-gray-400 group-hover:text-white"}>
                      {iconMap[item.key] || iconMap.dashboard}
                    </span>
                    {(sidebarOpen || mobileSidebarOpen) && <span>{item.label}</span>}
                  </div>
                  {(sidebarOpen || mobileSidebarOpen) && badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        active ? "bg-white text-blue" : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Exit */}
        <div className="p-3 border-t border-gray-800 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <span>🛍️</span>
            {(sidebarOpen || mobileSidebarOpen) && <span>Customer Storefront</span>}
          </Link>
          <Link
            href="/onboarding"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-blue hover:text-blue-dark transition bg-blue/10"
          >
            <span>➕</span>
            {(sidebarOpen || mobileSidebarOpen) && <span>Onboard Business</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-2 flex items-center justify-between px-3 sm:px-6 z-20 shrink-0 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-1 rounded-xl text-gray-600 hover:text-dark hover:bg-gray-100 md:hidden flex items-center justify-center shrink-0"
              title="Open navigation menu"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Organization Type Pill */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400 hidden xl:inline">
                Workspace:
              </span>
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-blue/10 text-blue border border-blue/20 rounded-md text-[11px] sm:text-xs font-mono font-bold whitespace-nowrap">
                {currentWorkspace.organizationType}
              </span>
            </div>

            <span className="text-gray-300 hidden sm:inline">•</span>

            {/* Distinct User Role with Quick Switcher */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400 hidden xl:inline">
                Role:
              </span>
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-dark hover:bg-gray-800 text-white rounded-md text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1 transition"
                  title="Click to simulate and test different user roles"
                >
                  <span className="max-w-[76px] sm:max-w-none truncate">{currentRole}</span>
                  <span className="text-[9px] text-gray-400">▼</span>
                </button>

                {roleDropdownOpen && (
                  <div className="absolute top-8 left-0 w-52 bg-white border border-gray-3 rounded-xl shadow-xl p-1.5 z-50 text-xs">
                    <span className="text-[10px] font-bold text-gray-400 px-2 py-1 block uppercase">
                      Simulate Role (RBAC)
                    </span>
                    {availableRoles.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                          currentRole === r ? "bg-blue text-white font-bold" : "text-gray-700 hover:bg-gray-1"
                        }`}
                      >
                        <span>{r}</span>
                        {currentRole === r && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <span className="text-gray-300 hidden md:inline">•</span>
            <span className="text-xs text-emerald-600 font-semibold hidden lg:flex items-center gap-1 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              {accessibleModules.length} Modules Active
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/onboarding"
              className="text-xs font-bold text-blue hover:underline hidden md:inline-block whitespace-nowrap"
            >
              + Register New Partner
            </Link>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-xl text-gray-500 hover:text-dark hover:bg-gray-1 transition"
                title="System Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 top-11 w-80 max-w-[calc(100vw-1.5rem)] sm:w-96 bg-white border border-gray-3 rounded-2xl shadow-2xl p-4 z-50 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-2 mb-2">
                    <div className="font-bold text-dark flex items-center gap-1.5">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full font-bold text-[10px]">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] text-blue hover:underline font-semibold"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-2">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-xs">
                        No notifications at this time
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`py-2.5 px-2 rounded-lg transition flex items-start gap-2.5 ${
                            n.isRead ? "opacity-65 hover:opacity-100" : "bg-blue/5"
                          }`}
                        >
                          <span className="mt-0.5 text-base">
                            {n.type === "SUCCESS" ? "🟢" : n.type === "CRITICAL" ? "🔴" : "🔵"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-dark leading-tight flex items-center justify-between gap-1">
                              <span className="truncate">{n.title}</span>
                              {!n.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(n.id)}
                                  className="text-[10px] text-blue hover:underline shrink-0"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                            <div className="text-gray-500 text-[11px] mt-0.5 leading-snug">{n.message}</div>
                            <div className="text-[10px] text-gray-400 mt-1 font-mono">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 pl-4 border-l border-gray-2">
              <div className="w-8 h-8 rounded-full bg-blue/10 text-blue font-bold flex items-center justify-center text-xs border border-blue/20">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-dark block leading-none">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-gray-400">{currentUser.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          {isRestrictedRoute ? (
            <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-xs text-center max-w-xl mx-auto my-12 space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl mx-auto">
                🚫
              </div>
              <h2 className="text-xl font-bold text-dark">Access Denied (RBAC Protected)</h2>
              <p className="text-sm text-gray-600">
                The active workspace <strong>{currentWorkspace.name}</strong> ({currentWorkspace.organizationType}) with role <strong>{currentRole}</strong> does not have permission to access this module.
              </p>
              <div className="pt-2">
                <Link
                  href="/admin"
                  className="py-2.5 px-5 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition inline-block"
                >
                  Return to Active Dashboard
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </WorkspaceProvider>
  );
}
