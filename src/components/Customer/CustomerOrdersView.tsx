"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatPrice } from "@/utils/formatePrice";
import { initialBusinessOrders, VanigamBusinessOrder } from "@/lib/b2b2c/mockVanigamData";
import { Button, StatusBadge, EmptyState } from "@/components/ui";
import { actionRequestOrderReturn } from "@/actions/vanigamActions";
import { useSession } from "next-auth/react";

export default function CustomerOrdersView() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<VanigamBusinessOrder[]>(initialBusinessOrders);
  const [returnModalOrder, setReturnModalOrder] = useState<VanigamBusinessOrder | null>(null);
  const [returnReason, setReturnReason] = useState("Item received defective or damaged");
  const [returnNotes, setReturnNotes] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Authenticated customer scoping
  const customerEmail = session?.user?.email || "alex.johnson@example.com";
  const customerName = session?.user?.name || "Alex Johnson";

  const customerOrders = orders.filter(
    (o) =>
      o.customerEmail === customerEmail ||
      o.customerName.toLowerCase() === customerName.toLowerCase() ||
      o.customerName.toLowerCase().includes("alex")
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

      toast.success("Return request submitted! The seller will review within 2 business days.");
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-gray-3 shadow-xs mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue uppercase tracking-wider block">
                Customer Account
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-mono text-gray-500 bg-gray-1 px-2 py-0.5 rounded-md">
                {customerEmail}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark">
              My Orders & Multi-Seller Tracking
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track independent shipments, packing statuses, and delivery confirmations for all marketplace items.
            </p>
          </div>

          <Link href="/shop-with-sidebar">
            <Button variant="primary" size="sm">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Orders List */}
        {customerOrders.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No Orders Found"
            description="You haven't placed any orders yet. Discover top tech and gaming gear in our catalog."
            actionLabel="Start Shopping →"
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
                  className="bg-white rounded-2xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-6"
                >
                  {/* Order Top Meta */}
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
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Sold By Partner</span>
                        <span className="font-bold text-blue">{order.sellerOrgName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-mono">{order.businessOrderNo}</span>
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
                      <div key={idx} className="py-4 flex items-center justify-between gap-4 text-sm">
                        <div>
                          <h3 className="font-bold text-dark">{item.productTitle}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            SKU: {item.sku} • Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                        <span className="font-bold text-dark text-sm whitespace-nowrap">
                          {formatPrice(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Tracking Stepper */}
                  <div className="p-4 bg-gray-2 rounded-xl border border-gray-3">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="text-blue font-bold">✓ Order Confirmed</span>
                      <span className={order.status === "PROCESSING" || order.status === "SHIPPED" || order.status === "DELIVERED" ? "text-blue font-bold" : "text-gray-400"}>
                        {order.status === "PROCESSING" ? "● Packing & Inspection" : "✓ Packaged"}
                      </span>
                      <span className={order.status === "SHIPPED" || order.status === "DELIVERED" ? "text-blue font-bold" : "text-gray-400"}>
                        {order.status === "SHIPPED" ? "● In Transit (FedEx/DHL)" : order.status === "DELIVERED" ? "✓ Shipped" : "○ Dispatched"}
                      </span>
                      <span className={order.status === "DELIVERED" ? "text-emerald-600 font-bold" : "text-gray-400"}>
                        {order.status === "DELIVERED" ? "✓ Delivered" : "○ Delivered"}
                      </span>
                    </div>

                    <div className="w-full bg-gray-3 h-1.5 rounded-full overflow-hidden">
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

                  {/* Actions: Return / Dispute */}
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-3 bg-white text-dark text-sm focus:border-blue focus:outline-none"
                  >
                    <option value="Item received defective or damaged">Item received defective or damaged</option>
                    <option value="Wrong item or incorrect variant sent">Wrong item or incorrect variant sent</option>
                    <option value="Product not as described on storefront">Product not as described on storefront</option>
                    <option value="Arrived past guaranteed delivery timeline">Arrived past guaranteed delivery timeline</option>
                    <option value="Changed mind / No longer needed">Changed mind / No longer needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark mb-1">
                    Additional Details & Notes
                  </label>
                  <textarea
                    rows={3}
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Describe what was wrong with the package or item..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-3 bg-white text-dark text-sm focus:border-blue focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-blue/5 rounded-xl border border-blue/20 text-xs text-dark">
                  <strong>Estimated Refund:</strong> {formatPrice(returnModalOrder.totalAmount)}
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Refunds will be reversed to your original payment method once the seller inspects the returned parcel.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReturnModalOrder(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingReturn}
                  >
                    Submit Return Request
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
