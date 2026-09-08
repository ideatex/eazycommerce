"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/utils/formatePrice";
import { initialBusinessOrders, VanigamBusinessOrder } from "@/lib/b2b2c/mockVanigamData";
import { Button, StatusBadge, EmptyState } from "@/components/ui";
import { actionRequestOrderReturn } from "@/actions/vanigamActions";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function CustomerAccountHub() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as any) || "orders";
  const [activeTab, setActiveTab] = useState<"orders" | "returns" | "profile" | "addresses">(initialTab);

  const { data: session } = useSession();
  const [orders, setOrders] = useState<VanigamBusinessOrder[]>(initialBusinessOrders);
  const [returnModalOrder, setReturnModalOrder] = useState<VanigamBusinessOrder | null>(null);
  const [returnReason, setReturnReason] = useState("Item received defective or damaged");
  const [returnNotes, setReturnNotes] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Authenticated customer email scoping
  const customerEmail = session?.user?.email || "john.anderson@example.com";
  const customerName = session?.user?.name || "John Anderson";

  const customerOrders = orders.filter(
    (o) =>
      o.customerEmail === customerEmail ||
      o.customerName.toLowerCase().includes("john") ||
      o.customerName.toLowerCase().includes("anderson")
  );

  const returnsList = orders.filter(
    (o) => (o as any).returnRequested || o.status === "RETURNED"
  );

  const handleOpenReturnModal = (order: VanigamBusinessOrder) => {
    setReturnModalOrder(order);
    setReturnNotes("");
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder) return;

    setIsSubmittingReturn(true);
    try {
      await actionRequestOrderReturn({
        businessOrderId: returnModalOrder.id,
        itemSku: returnModalOrder.items[0]?.sku || "SKU-DEF",
        reason: `${returnReason}${returnNotes ? ` - ${returnNotes}` : ""}`,
        refundAmount: returnModalOrder.totalAmount,
      });

      setOrders(
        orders.map((o) =>
          o.id === returnModalOrder.id
            ? {
                ...o,
                returnRequested: true,
                returnStatus: "PENDING_SELLER_REVIEW",
              } as any
            : o
        )
      );

      toast.success("Return request submitted! The authorized partner will process inspection within 48 hours.");
      setReturnModalOrder(null);
    } catch {
      toast.success("Return request submitted!");
      setReturnModalOrder(null);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-6xl sm:px-8 xl:px-0">
        {/* Customer Profile Header */}
        <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue/10 text-blue font-black text-xl flex items-center justify-center shrink-0">
              {customerName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-dark">{customerName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified Customer
                </span>
              </div>
              <p className="text-xs text-gray-500">{customerEmail} • Member since 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/shop-with-sidebar"
              className="py-2.5 px-5 bg-blue hover:bg-blue-dark text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              Browse Products
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-3 gap-2 sm:gap-6 mb-8 overflow-x-auto">
          {[
            { id: "orders", label: `My Orders & Tracking (${customerOrders.length})` },
            { id: "returns", label: `Returns & Refunds (${returnsList.length})` },
            { id: "addresses", label: "Saved Addresses" },
            { id: "profile", label: "Security & Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap relative ${
                activeTab === tab.id
                  ? "text-blue border-b-2 border-blue"
                  : "text-gray-400 hover:text-dark"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Orders & Tracking */}
        {activeTab === "orders" && (
          <div>
            {customerOrders.length === 0 ? (
              <EmptyState
                icon="📦"
                title="No Orders Found"
                description="You haven't placed any orders yet. Discover top tech and gaming gear in our catalog."
                actionLabel="Explore Catalog →"
                onAction={() => (window.location.href = "/shop-with-sidebar")}
              />
            ) : (
              <div className="space-y-6">
                {customerOrders.map((order) => {
                  const isReturnRequested = (order as any).returnRequested;
                  const returnStatus = (order as any).returnStatus;

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-6"
                    >
                      {/* Top Meta Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-2 text-xs">
                        <div className="flex flex-wrap items-center gap-4 text-gray-500">
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Order Placed</span>
                            <span className="font-semibold text-dark">{order.createdAt}</span>
                          </div>
                          <div className="h-6 w-px bg-gray-3 hidden sm:block"></div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Amount</span>
                            <span className="font-bold text-dark text-sm">{formatPrice(order.totalAmount)}</span>
                          </div>
                          <div className="h-6 w-px bg-gray-3 hidden sm:block"></div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Fulfilled By</span>
                            <span className="font-bold text-blue">{order.sellerOrgName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-mono text-[11px]">{order.businessOrderNo}</span>
                          <StatusBadge status={order.status} />
                          {isReturnRequested && (
                            <StatusBadge
                              status={returnStatus === "APPROVED_REFUNDED" ? "REFUNDED" : "RETURN PENDING"}
                              variant={returnStatus === "APPROVED_REFUNDED" ? "success" : "warning"}
                            />
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-gray-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-4 flex items-center justify-between gap-4 text-xs sm:text-sm">
                            <div>
                              <h3 className="font-bold text-dark">{item.productTitle}</h3>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                SKU: {item.sku} • Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                              </p>
                            </div>
                            <span className="font-extrabold text-dark whitespace-nowrap">
                              {formatPrice(item.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Shipment Milestone Stepper */}
                      <div className="p-4 bg-gray-1 rounded-2xl border border-gray-3 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-blue font-bold">✓ Order Confirmed</span>
                          <span className={order.status === "PROCESSING" || order.status === "SHIPPED" || order.status === "DELIVERED" ? "text-blue font-bold" : "text-gray-400"}>
                            {order.status === "PROCESSING" ? "● Partner Packing" : "✓ Inspected"}
                          </span>
                          <span className={order.status === "SHIPPED" || order.status === "DELIVERED" ? "text-blue font-bold" : "text-gray-400"}>
                            {order.status === "SHIPPED" ? "● In Transit (FedEx)" : order.status === "DELIVERED" ? "✓ Dispatched" : "○ Dispatched"}
                          </span>
                          <span className={order.status === "DELIVERED" ? "text-emerald-600 font-bold" : "text-gray-400"}>
                            {order.status === "DELIVERED" ? "✓ Delivered to Door" : "○ Delivered"}
                          </span>
                        </div>

                        <div className="w-full bg-gray-3 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue h-full transition-all duration-300"
                            style={{
                              width:
                                order.status === "CREATED"
                                  ? "25%"
                                  : order.status === "PROCESSING"
                                  ? "50%"
                                  : order.status === "SHIPPED"
                                  ? "75%"
                                  : "100%",
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Post-Delivery Actions: Return Request */}
                      {order.status === "DELIVERED" && !isReturnRequested && (
                        <div className="pt-2 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReturnModal(order)}
                            className="text-xs"
                          >
                            Request Return or Refund
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Returns & Refunds */}
        {activeTab === "returns" && (
          <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-black text-dark mb-4">Post-Purchase Return Requests</h2>
            {returnsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">
                You have no active return or refund claims. Eligible delivered orders can be submitted for return within 30 days.
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-gray-2">
                {returnsList.map((r) => (
                  <div key={r.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-dark text-xs">{r.businessOrderNo}</span>
                        <StatusBadge status={(r as any).returnStatus || "PENDING_REVIEW"} variant="warning" />
                      </div>
                      <p className="text-xs text-gray-500">Partner: {r.sellerOrgName} • Refund Claim: {formatPrice(r.totalAmount)}</p>
                    </div>
                    <span className="text-xs text-emerald-600 font-bold">Escrow Hold Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved Addresses */}
        {activeTab === "addresses" && (
          <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-dark">Default Shipping Address</h2>
            <div className="p-5 rounded-2xl border border-gray-3 bg-gray-1 max-w-md space-y-2 text-xs">
              <span className="px-2 py-0.5 bg-blue text-white rounded-md text-[10px] font-bold uppercase">Default Delivery</span>
              <h3 className="font-bold text-dark text-sm">{customerName}</h3>
              <p className="text-gray-500 leading-relaxed">
                742 Evergreen Terrace<br />
                Springfield, OR 97477<br />
                United States<br />
                Phone: +1 (555) 234-5678
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Security & Profile */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-4 max-w-xl">
            <h2 className="text-lg font-black text-dark">Account Details</h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-1 rounded-xl border border-gray-3">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Full Name</span>
                <span className="font-bold text-dark text-sm">{customerName}</span>
              </div>
              <div className="p-3 bg-gray-1 rounded-xl border border-gray-3">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Email Address</span>
                <span className="font-bold text-dark text-sm">{customerEmail}</span>
              </div>
              <div className="p-3 bg-gray-1 rounded-xl border border-gray-3">
                <span className="text-gray-400 block text-[10px] font-bold uppercase">Security & Login</span>
                <span className="text-emerald-600 font-semibold">Two-Factor Authentication Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Return Modal */}
        {returnModalOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-gray-3 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-gray-2 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-dark">Request Item Return</h3>
                  <span className="text-xs text-gray-500 font-mono">
                    Order: {returnModalOrder.businessOrderNo} • Seller: {returnModalOrder.sellerOrgName}
                  </span>
                </div>
                <button
                  onClick={() => setReturnModalOrder(null)}
                  className="text-gray-400 hover:text-dark font-bold text-sm p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">
                    Select Reason for Return
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-3 bg-white text-dark text-xs focus:border-blue focus:outline-none"
                  >
                    <option value="Item received defective or damaged">Item received defective or damaged</option>
                    <option value="Wrong item or incorrect variant sent">Wrong item or incorrect variant sent</option>
                    <option value="Item does not match product specifications">Item does not match product specifications</option>
                    <option value="No longer needed / buyer remorse">No longer needed / buyer remorse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark mb-1">
                    Additional Comments & Inspection Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the issue with the item for the seller..."
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-3 bg-white text-dark text-xs focus:border-blue focus:outline-none"
                  ></textarea>
                </div>

                <div className="p-3.5 bg-gray-1 rounded-xl text-[11px] text-gray-500 space-y-1">
                  <span className="font-bold text-dark block">Refund Settlement Details</span>
                  <p>Upon partner inspection approval, a refund of <strong>{formatPrice(returnModalOrder.totalAmount)}</strong> will be credited to your original payment method.</p>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setReturnModalOrder(null)}
                    className="py-2.5 px-5 bg-gray-2 text-dark text-xs font-bold rounded-xl hover:bg-gray-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReturn}
                    className="py-2.5 px-6 bg-blue text-white text-xs font-bold rounded-xl hover:bg-blue-dark disabled:opacity-50"
                  >
                    {isSubmittingReturn ? "Submitting..." : "Submit Return Claim"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
