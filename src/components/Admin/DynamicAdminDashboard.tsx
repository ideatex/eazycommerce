"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/utils/formatePrice";
import { useWorkspace } from "@/context/WorkspaceContext";
import { actionGetDashboardData } from "@/actions/vanigamActions";
import { VanigamB2BOrder, VanigamBusinessOrder, VanigamSettlement } from "@/lib/b2b2c/mockVanigamData";
import { Skeleton } from "@/components/ui";

export default function DynamicAdminDashboard() {
  const {
    currentWorkspace,
    currentRole,
    isPlatformAdmin,
    isSupplier,
    isDistributor,
    isSeller,
    hasPermission,
  } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [b2bVolume, setB2bVolume] = useState(0);
  const [b2cVolume, setB2cVolume] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [pendingSettlement, setPendingSettlement] = useState(0);
  const [totalOrgsCount, setTotalOrgsCount] = useState(4);
  const [scopedB2BOrders, setScopedB2BOrders] = useState<VanigamB2BOrder[]>([]);
  const [scopedBusinessOrders, setScopedBusinessOrders] = useState<VanigamBusinessOrder[]>([]);
  const [scopedSettlements, setScopedSettlements] = useState<VanigamSettlement[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await actionGetDashboardData(currentWorkspace.id, isPlatformAdmin);
      setB2bVolume(data.b2bVolume);
      setB2cVolume(data.b2cVolume);
      setTotalCommission(data.totalCommission);
      setPendingSettlement(data.pendingSettlement);
      setTotalOrgsCount(data.totalOrgsCount);
      setScopedB2BOrders(data.scopedB2BOrders);
      setScopedBusinessOrders(data.scopedBusinessOrders);
      setScopedSettlements(data.scopedSettlements);
    } catch (err) {
      console.error("Failed to load live dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentWorkspace.id, isPlatformAdmin]);

  const canViewFinance = hasPermission("finance.view");
  const canViewB2B = hasPermission("b2b_orders.view");
  const canViewOrders = hasPermission("orders.view");

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner adapted to Active Workspace & Role */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue uppercase tracking-wider block">
              {isPlatformAdmin
                ? "Platform Control Tower"
                : `${currentWorkspace.organizationType} Operations`}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-gray-1 text-gray-700">
              {currentRole}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-dark">
            {currentWorkspace.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isPlatformAdmin &&
              "Global ecosystem oversight across Manufacturers, Distributors, Marketplace Sellers, and Consumers."}
            {isSupplier &&
              "Bulk manufacturing output, MOQ validation, wholesale distribution procurement, and B2B settlements."}
            {isDistributor &&
              "Regional logistics routing, upstream factory supply orders, and downstream merchant distribution."}
            {isSeller &&
              "Marketplace seller storefront, customer split basket fulfillments, item returns, and net escrow payouts."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="py-2.5 px-3 rounded-xl border border-gray-3 hover:bg-gray-1 text-xs font-semibold text-gray-600 transition flex items-center gap-1.5"
            title="Refresh metrics from backend"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isPlatformAdmin && (
            <Link
              href="/onboarding"
              className="py-2.5 px-4 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition shadow-sm"
            >
              + Onboard Enterprise
            </Link>
          )}
          {canViewB2B && (
            <Link
              href="/admin/b2b-orders"
              className="py-2.5 px-4 bg-dark text-white rounded-xl text-xs font-bold hover:bg-darkLight transition"
            >
              Review POs ({scopedB2BOrders.length})
            </Link>
          )}
          {canViewOrders && isSeller && (
            <Link
              href="/admin/orders"
              className="py-2.5 px-4 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition"
            >
              Fulfill Orders ({scopedBusinessOrders.length})
            </Link>
          )}
        </div>
      </div>

      {/* Dynamic KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Primary Volume */}
        <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {isPlatformAdmin
                ? "Total Ecosystem GMV"
                : isSupplier || isDistributor
                ? "Wholesale B2B Volume"
                : "Retail Storefront Gross"}
            </span>
            <span className="p-2 bg-blue/10 text-blue rounded-lg text-sm">📈</span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <div className="text-2xl font-extrabold text-dark">
              {isPlatformAdmin
                ? formatPrice(b2bVolume + b2cVolume)
                : isSupplier || isDistributor
                ? formatPrice(b2bVolume)
                : formatPrice(b2cVolume)}
            </div>
          )}
          <span className="text-xs text-emerald-600 font-semibold mt-2 block">
            Live Database Recomputed
          </span>
        </div>

        {/* Metric 2: Active Relationships or Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {isPlatformAdmin
                ? "Active Businesses"
                : isSupplier
                ? "Distributor Accounts"
                : isDistributor
                ? "Supply Chain Nodes"
                : "Assigned Orders"}
            </span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg text-sm">🏢</span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-24 rounded-lg" />
          ) : (
            <div className="text-2xl font-extrabold text-dark">
              {isPlatformAdmin
                ? `${totalOrgsCount} Orgs`
                : isSupplier || isDistributor
                ? `${scopedB2BOrders.length} Partner POs`
                : `${scopedBusinessOrders.length} Split Orders`}
            </div>
          )}
          <span className="text-xs text-gray-500 mt-2 block">
            {isPlatformAdmin
              ? "Across 4 supply-chain tiers"
              : `Active in ${currentWorkspace.name}`}
          </span>
        </div>

        {/* Metric 3: Commissions or Margins */}
        <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {isPlatformAdmin
                ? "Platform Commissions"
                : isSupplier || isDistributor
                ? "Credit Term Status"
                : "Marketplace Fee Deduction"}
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm">💰</span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 rounded-lg" />
          ) : (
            <div className="text-2xl font-extrabold text-dark">
              {isPlatformAdmin
                ? formatPrice(totalCommission)
                : isSupplier || isDistributor
                ? "Net 30-45 Days"
                : formatPrice(totalCommission)}
            </div>
          )}
          <span className="text-xs text-emerald-600 font-semibold mt-2 block">
            {isPlatformAdmin
              ? "8.0% avg take-rate"
              : isSupplier || isDistributor
              ? "Healthy revolving line"
              : "Automated at checkout"}
          </span>
        </div>

        {/* Metric 4: Settlements & Payouts (Role Protected) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {canViewFinance
                ? isPlatformAdmin
                  ? "Escrow Payouts Pending"
                  : "Net Receivable Settlement"
                : "Inventory SKU Health"}
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg text-sm">
              {canViewFinance ? "⏳" : "📦"}
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <div className="text-2xl font-extrabold text-dark">
              {canViewFinance
                ? formatPrice(pendingSettlement)
                : "100% In Stock"}
            </div>
          )}
          <span className="text-xs text-amber-600 font-semibold mt-2 block">
            {canViewFinance
              ? isPlatformAdmin
                ? "Awaiting payout trigger"
                : "Eligible after return window"
              : "0 Out of Stock alerts"}
          </span>
        </div>
      </div>

      {/* Tier-Specific Adaptive Section */}
      {isPlatformAdmin && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-3 shadow-xs">
          <h2 className="text-lg font-bold text-dark mb-2">Connected B2B2C Supply Chain Flow</h2>
          <p className="text-xs text-gray-500 mb-6">
            Real-time multi-tier topology spanning manufacturers, regional distributors, marketplace sellers, and end consumers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl border border-blue/20 bg-blue/5">
              <span className="text-xs font-bold text-blue uppercase tracking-wider block mb-1">Tier 1</span>
              <h3 className="font-bold text-dark text-sm mb-1">Manufacturers</h3>
              <p className="text-xs text-gray-600">TechFlow Electronics</p>
              <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full bg-blue text-white text-[10px] font-bold">
                Bulk Supply • MOQ
              </span>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1">Tier 2</span>
              <h3 className="font-bold text-dark text-sm mb-1">Distributors</h3>
              <p className="text-xs text-gray-600">Global Link Logistics</p>
              <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                Wholesale Lots • Credit
              </span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Tier 3</span>
              <h3 className="font-bold text-dark text-sm mb-1">Retailers / Sellers</h3>
              <p className="text-xs text-gray-600">Velocity Tech Store</p>
              <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                Multi-Seller Offers
              </span>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">Tier 4</span>
              <h3 className="font-bold text-dark text-sm mb-1">B2C Consumers</h3>
              <p className="text-xs text-gray-600">Unified Marketplace</p>
              <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                1-Cart • Split Order
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: B2B Purchase Orders */}
        {canViewB2B && (
          <div className="bg-white rounded-2xl border border-gray-3 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-dark">
                {isPlatformAdmin ? "Recent B2B Purchase Orders" : `B2B POs (${currentWorkspace.name})`}
              </h2>
              <Link href="/admin/b2b-orders" className="text-xs font-bold text-blue hover:underline">
                View All →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : scopedB2BOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No active B2B purchase orders found for this workspace.
              </div>
            ) : (
              <div className="space-y-3">
                {scopedB2BOrders.slice(0, 5).map((po) => (
                  <div key={po.id} className="p-3.5 rounded-xl border border-gray-2 hover:bg-gray-1 transition text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-dark">{po.poNumber}</span>
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue/10 text-blue">
                        {po.status}
                      </span>
                    </div>
                    <div className="text-gray-500 mb-1">
                      <span className="font-medium text-dark">{po.buyerName}</span> ← {po.supplierName}
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Terms: {po.paymentTerms}</span>
                      <span className="font-bold text-dark text-sm">{formatPrice(po.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Column 2: Customer Split Orders */}
        {canViewOrders && (
          <div className="bg-white rounded-2xl border border-gray-3 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-dark">
                {isPlatformAdmin ? "Recent Customer Split Orders" : `Fulfillment Orders (${currentWorkspace.name})`}
              </h2>
              <Link href="/admin/orders" className="text-xs font-bold text-blue hover:underline">
                View All →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : scopedBusinessOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No customer orders assigned to this workspace yet.
              </div>
            ) : (
              <div className="space-y-3">
                {scopedBusinessOrders.slice(0, 5).map((bo) => (
                  <div key={bo.id} className="p-3.5 rounded-xl border border-gray-2 hover:bg-gray-1 transition text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-dark">{bo.businessOrderNo}</span>
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-700">
                        {bo.status}
                      </span>
                    </div>
                    <div className="text-gray-500 mb-1">
                      Customer: <span className="font-medium text-dark">{bo.customerName}</span> • Seller: {bo.sellerOrgName}
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Platform Fee: {formatPrice(bo.commissionAmount)}</span>
                      <span className="font-bold text-dark text-sm">{formatPrice(bo.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
