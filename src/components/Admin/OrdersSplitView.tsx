"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/utils/formatePrice";
import {
  actionGetBusinessOrders,
  actionUpdateBusinessOrderStatus,
  actionProcessReturnDecision,
} from "@/actions/vanigamActions";
import { VanigamBusinessOrder } from "@/lib/b2b2c/mockVanigamData";
import { useWorkspace } from "@/context/WorkspaceContext";
import { StatusBadge, Card, CardHeader, CardTitle, CardDescription, Skeleton } from "@/components/ui";
import toast from "react-hot-toast";

export default function OrdersSplitView() {
  const { currentWorkspace, isPlatformAdmin, hasPermission } = useWorkspace();
  const [orders, setOrders] = useState<VanigamBusinessOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnReviewOrder, setReturnReviewOrder] = useState<VanigamBusinessOrder | null>(null);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // Search & Status Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Dispatch modal state
  const [shippingModalOrder, setShippingModalOrder] = useState<VanigamBusinessOrder | null>(null);
  const [carrier, setCarrier] = useState("FedEx Express");
  const [trackingNumber, setTrackingNumber] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const fetched = await actionGetBusinessOrders(currentWorkspace.id);
      setOrders(fetched);
    } catch (err) {
      console.error("Failed to load business orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentWorkspace.id, isPlatformAdmin]);

  // Multi-Tenant Isolation Filter
  const workspaceOrders = isPlatformAdmin
    ? orders
    : orders.filter((o) => o.sellerOrgId === currentWorkspace.id);

  // Search & Filtered orders
  const visibleOrders = workspaceOrders.filter((order) => {
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.businessOrderNo.toLowerCase().includes(q) ||
      order.masterOrderId.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.sellerOrgName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (
    orderId: string,
    status: VanigamBusinessOrder["status"],
    trackingData?: { carrier?: string; trackingNumber?: string }
  ) => {
    try {
      const updated = await actionUpdateBusinessOrderStatus(orderId, status);
      if (updated) {
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
        if (status === "CANCELLED") {
          toast.success(`Order ${updated.businessOrderNo} cancelled! Reserved stock restored to inventory.`);
        } else if (status === "SHIPPED") {
          toast.success(`Order ${updated.businessOrderNo} shipped via ${trackingData?.carrier || "Carrier"}!`);
        } else if (status === "DELIVERED") {
          toast.success(`Order ${updated.businessOrderNo} delivered! 14-day return window started.`);
        } else {
          toast.success(`Order ${updated.businessOrderNo} updated to ${status}`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update order status");
    }
  };

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingModalOrder) return;
    const tracking = trackingNumber || `TRK-${Date.now().toString().slice(-6)}`;
    handleStatusChange(shippingModalOrder.id, "SHIPPED", { carrier, trackingNumber: tracking });
    setShippingModalOrder(null);
    setTrackingNumber("");
  };

  const handleReturnDecision = async (approved: boolean) => {
    if (!returnReviewOrder) return;
    setIsProcessingReturn(true);

    try {
      await actionProcessReturnDecision({
        businessOrderId: returnReviewOrder.id,
        approved,
      });

      setOrders(
        orders.map((o) =>
          o.id === returnReviewOrder.id
            ? ({
                ...o,
                returnStatus: approved ? "APPROVED_REFUNDED" : "REJECTED",
                status: approved ? "RETURNED" : o.status,
              } as any)
            : o
        )
      );

      if (approved) {
        toast.success(
          `Return for ${returnReviewOrder.businessOrderNo} APPROVED. Settlement deducted and inventory restored!`
        );
      } else {
        toast.error(`Return for ${returnReviewOrder.businessOrderNo} REJECTED.`);
      }
      setReturnReviewOrder(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to process return decision");
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Order No", "Master Order", "Customer", "Seller", "Gross Total", "Commission", "Net Payout", "Status", "Tracking"];
    const rows = visibleOrders.map((o) => [
      o.businessOrderNo,
      o.masterOrderId,
      o.customerName,
      o.sellerOrgName,
      o.totalAmount,
      o.commissionAmount,
      o.payoutAmount,
      o.status,
      o.trackingNumber || "—",
    ]);
    const content = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `seller-business-orders-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Orders exported to CSV!");
  };

  const canManageOrders = hasPermission("orders.manage");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
              Fulfillment & Splitting
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {workspaceOrders.length} Split Orders
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-dark">Customer Orders & Seller Fulfillment</h1>
          <p className="text-sm text-gray-500 mt-1">
            Autonomous multi-seller order decomposition: Pick, pack, ship, deliver, and handle return refunds per seller.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="py-2.5 px-4 bg-gray-1 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-2 transition border border-gray-3 flex items-center gap-1.5"
            title="Refresh orders"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-4 bg-white text-dark rounded-xl text-xs font-bold hover:bg-gray-1 transition border border-gray-3 flex items-center gap-1.5"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-3 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="Search orders by Order #, Master #, Customer, or Seller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-3 rounded-lg text-sm focus:outline-none focus:border-blue"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-dark font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                statusFilter === filter
                  ? "bg-dark text-white"
                  : "bg-gray-1 border border-gray-3 text-gray-600 hover:bg-gray-2"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-2 bg-gray-2/50 font-bold text-dark text-sm flex justify-between items-center">
          <span>Decomposed Seller Orders ({visibleOrders.length})</span>
          <span className="text-xs text-gray-400 font-normal">
            Automated take-rate calculation & escrow allocation
          </span>
        </div>

        {/* Mobile & Tablet Card View (< 1024px) */}
        <div className="block lg:hidden divide-y divide-gray-2">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No business orders match your search criteria.
            </div>
          ) : (
            visibleOrders.map((order) => {
              const isReturnRequested =
                (order as any).returnRequested ||
                (order as any).returnStatus === "PENDING_SELLER_REVIEW";

              return (
                <div key={order.id} className="p-4 sm:p-5 space-y-3 bg-white">
                  {/* Order Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-bold text-dark text-sm">
                        {order.businessOrderNo}
                      </div>
                      <div className="font-mono text-[11px] text-gray-400 mt-0.5">
                        Master: {order.masterOrderId}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-700"
                            : order.status === "SHIPPED"
                            ? "bg-purple-100 text-purple-700"
                            : order.status === "PROCESSING" || order.status === "CONFIRMED"
                            ? "bg-blue/10 text-blue"
                            : order.status === "CANCELLED" || order.status === "RETURNED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {order.status}
                      </span>
                      {isReturnRequested && order.status !== "RETURNED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 animate-pulse">
                          Return Requested
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer & Seller Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-1 p-2.5 rounded-xl">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Customer</span>
                      <span className="font-medium text-dark truncate block">{order.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Seller</span>
                      <span className="font-medium text-dark truncate block">{order.sellerOrgName}</span>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-xs border border-gray-2 p-2.5 rounded-xl text-center">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Gross</span>
                      <span className="font-bold text-dark">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Platform Fee</span>
                      <span className="font-mono text-emerald-600 font-semibold">{formatPrice(order.commissionAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Net Payout</span>
                      <span className="font-bold text-blue font-mono">{formatPrice(order.payoutAmount)}</span>
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {isReturnRequested && order.status !== "RETURNED" && (
                      <button
                        onClick={() => setReturnReviewOrder(order)}
                        className="py-2 px-3 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition shadow-xs flex-1 text-center min-h-[38px]"
                      >
                        Review Return
                      </button>
                    )}

                    {canManageOrders && order.status === "CREATED" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(order.id, "CONFIRMED")}
                          className="py-2 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex-1 text-center min-h-[38px]"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, "CANCELLED")}
                          className="py-2 px-3 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition flex-1 text-center min-h-[38px]"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {canManageOrders && order.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "PROCESSING")}
                        className="py-2 px-3 bg-blue text-white rounded-lg text-xs font-bold hover:bg-blue-dark transition w-full text-center min-h-[38px]"
                      >
                        Pack & Process
                      </button>
                    )}
                    {canManageOrders && order.status === "PROCESSING" && (
                      <button
                        onClick={() => setShippingModalOrder(order)}
                        className="py-2 px-3 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition w-full text-center min-h-[38px]"
                      >
                        Dispatch
                      </button>
                    )}
                    {canManageOrders && order.status === "SHIPPED" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "DELIVERED")}
                        className="py-2 px-3 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition w-full text-center min-h-[38px]"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table (>= 1024px) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-2 text-xs uppercase tracking-wider font-semibold text-gray-500 bg-gray-1/30">
                <th className="py-3 px-6">Order No</th>
                <th className="py-3 px-4">Master Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Seller Org</th>
                <th className="py-3 px-4">Gross Total</th>
                <th className="py-3 px-4">Platform Fee (8%)</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-2">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-6 space-y-3">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </td>
                </tr>
              ) : visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-gray-400">
                    No business orders match your search criteria.
                  </td>
                </tr>
              ) : (
                visibleOrders.map((order) => {
                  const isReturnRequested = (order as any).returnRequested || (order as any).returnStatus === "PENDING_SELLER_REVIEW";

                  return (
                    <tr key={order.id} className="hover:bg-gray-1/50 transition">
                      <td className="py-4 px-6 font-mono font-bold text-dark">{order.businessOrderNo}</td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-500">{order.masterOrderId}</td>
                      <td className="py-4 px-4 font-medium text-dark">{order.customerName}</td>
                      <td className="py-4 px-4 text-gray-600">{order.sellerOrgName}</td>
                      <td className="py-4 px-4 font-bold text-dark">{formatPrice(order.totalAmount)}</td>
                      <td className="py-4 px-4 text-xs font-mono text-emerald-600 font-semibold">
                        {formatPrice(order.commissionAmount)}
                      </td>
                      <td className="py-4 px-4 font-bold text-blue font-mono">{formatPrice(order.payoutAmount)}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            order.status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-700"
                              : order.status === "SHIPPED"
                              ? "bg-purple-100 text-purple-700"
                              : order.status === "PROCESSING" || order.status === "CONFIRMED"
                              ? "bg-blue/10 text-blue"
                              : order.status === "CANCELLED" || order.status === "RETURNED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {order.status}
                        </span>
                        {isReturnRequested && order.status !== "RETURNED" && (
                          <div className="mt-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 animate-pulse">
                              Return Requested
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-1">
                        {isReturnRequested && order.status !== "RETURNED" && (
                          <button
                            onClick={() => setReturnReviewOrder(order)}
                            className="py-1 px-2.5 bg-amber-500 text-white rounded-md text-xs font-bold hover:bg-amber-600 transition shadow-xs"
                          >
                            Review Return
                          </button>
                        )}

                        {canManageOrders && order.status === "CREATED" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, "CONFIRMED")}
                              className="py-1 px-2.5 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 transition"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, "CANCELLED")}
                              className="py-1 px-2.5 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {canManageOrders && order.status === "CONFIRMED" && (
                          <button
                            onClick={() => handleStatusChange(order.id, "PROCESSING")}
                            className="py-1 px-2.5 bg-blue text-white rounded-md text-xs font-bold hover:bg-blue-dark transition"
                          >
                            Pack & Process
                          </button>
                        )}
                        {canManageOrders && order.status === "PROCESSING" && (
                          <button
                            onClick={() => setShippingModalOrder(order)}
                            className="py-1 px-2.5 bg-purple-600 text-white rounded-md text-xs font-bold hover:bg-purple-700 transition"
                          >
                            Dispatch
                          </button>
                        )}
                        {canManageOrders && order.status === "SHIPPED" && (
                          <button
                            onClick={() => handleStatusChange(order.id, "DELIVERED")}
                            className="py-1 px-2.5 bg-emerald-700 text-white rounded-md text-xs font-bold hover:bg-emerald-800 transition"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Modal */}
      {shippingModalOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-3 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-dark">Dispatch Business Order</h3>
            <p className="text-xs text-gray-500">
              Provide carrier logistics and tracking for {shippingModalOrder.businessOrderNo}.
            </p>

            <form onSubmit={handleDispatchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark mb-1">Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white"
                >
                  <option value="FedEx Express">FedEx Express</option>
                  <option value="DHL Supply Chain">DHL Supply Chain</option>
                  <option value="BlueDart Air">BlueDart Air</option>
                  <option value="UPS Ground">UPS Ground</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. FDX-990182741"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-2">
                <button
                  type="button"
                  onClick={() => setShippingModalOrder(null)}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Review Modal */}
      {returnReviewOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-3 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-dark">Review Customer Return Request</h3>
            <p className="text-xs text-gray-600">
              Order: <strong>{returnReviewOrder.businessOrderNo}</strong> ({returnReviewOrder.sellerOrgName})
            </p>
            <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 p-3 rounded-xl">
              Customer reason: &quot;{(returnReviewOrder as any).returnReason || "Defective item upon unboxing"}&quot;
            </p>

            <div className="text-xs text-gray-600 space-y-1">
              <div>Refund Amount: <strong className="text-dark">{formatPrice(returnReviewOrder.totalAmount)}</strong></div>
              <div className="text-gray-400">
                Approving this return will automatically deduct the seller payout from the settlement ledger and restore stock.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-2">
              <button
                type="button"
                disabled={isProcessingReturn}
                onClick={() => handleReturnDecision(false)}
                className="py-2 px-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 disabled:opacity-50"
              >
                Reject Return
              </button>
              <button
                type="button"
                disabled={isProcessingReturn}
                onClick={() => handleReturnDecision(true)}
                className="py-2 px-5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {isProcessingReturn ? "Processing..." : "Approve & Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
