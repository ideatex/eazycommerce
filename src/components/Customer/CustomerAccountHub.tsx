"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { formatPrice } from "@/utils/formatePrice";
import { StatusBadge } from "@/components/ui";
import { apiRequest } from "@/lib/clientApi";
import toast from "react-hot-toast";

export interface AccountOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  grandTotal: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingFee: number;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  createdAt: string;
  returnRequested: boolean;
  items: Array<{ id: string; title: string; quantity: number; unitPrice: number; totalPrice: number }>;
  timeline: Array<{ id: string; status: string; note: string | null; createdAt: string }>;
}

interface AccountAddress {
  id: string;
  name: string;
  phone: string;
  streetAddress: string;
  apartment: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefaultShipping: boolean;
}

interface Props {
  user: { name: string; email: string; phone: string | null; memberSince: string | null };
  orders: AccountOrder[];
  addresses: AccountAddress[];
}

type Tab = "orders" | "returns" | "addresses" | "profile";

function Hub({ user, orders, addresses }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    requested && ["orders", "returns", "addresses", "profile"].includes(requested) ? requested : "orders"
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [returnOrder, setReturnOrder] = useState<AccountOrder | null>(null);
  const [returnReason, setReturnReason] = useState("Item received defective or damaged");
  const [returnNotes, setReturnNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const returns = orders.filter((o) => o.returnRequested || ["RETURNED", "REFUNDED"].includes(o.status));

  const cancelOrder = async (orderNumber: string) => {
    if (!confirm(`Cancel order ${orderNumber}?`)) return;
    setBusy(orderNumber);
    const res = await apiRequest(`/api/orders/${orderNumber}/cancel`, { body: {} });
    setBusy(null);
    if (res.ok) {
      toast.success("Order cancelled.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const submitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrder) return;
    setBusy(returnOrder.orderNumber);
    const res = await apiRequest(`/api/orders/${returnOrder.orderNumber}/return-request`, {
      body: { reason: `${returnReason}${returnNotes ? ` - ${returnNotes}` : ""}` },
    });
    setBusy(null);
    if (res.ok) {
      toast.success("Return request submitted. Our team will review it shortly.");
      setReturnOrder(null);
      setReturnNotes("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-6xl sm:px-8 xl:px-0">
        <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue/10 text-blue font-black text-xl flex items-center justify-center shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-dark">{user.name}</h1>
              <p className="text-xs text-gray-500">
                {user.email}
                {user.memberSince && ` • Member since ${new Date(user.memberSince).getFullYear()}`}
              </p>
            </div>
          </div>
          <Link href="/shop-with-sidebar" className="py-2.5 px-5 bg-blue hover:bg-blue-dark text-white text-xs font-bold rounded-xl transition-all shadow-xs text-center">
            Continue shopping
          </Link>
        </div>

        <div role="tablist" className="flex border-b border-gray-3 gap-2 sm:gap-6 mb-8 overflow-x-auto">
          {(
            [
              { id: "orders", label: `My Orders (${orders.length})` },
              { id: "returns", label: `Returns & Refunds (${returns.length})` },
              { id: "addresses", label: "Saved Addresses" },
              { id: "profile", label: "Profile" },
            ] as Array<{ id: Tab; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                activeTab === tab.id ? "text-blue border-b-2 border-blue" : "text-gray-400 hover:text-dark"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "orders" &&
          (orders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-3 shadow-xs">
              <h3 className="text-lg font-bold text-dark mb-1">No orders yet</h3>
              <p className="text-sm text-gray-500 mb-6">When you place an order it will show up here with live status updates.</p>
              <Link href="/shop-with-sidebar" className="inline-flex py-2.5 px-5 bg-blue text-white text-xs font-bold rounded-xl">
                Browse the catalogue
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-3 shadow-xs overflow-hidden">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-mono font-bold text-dark text-sm">{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">
                        Placed {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} • {order.items.length} item
                        {order.items.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <StatusBadge status={order.status} />
                      <span className="font-extrabold text-dark text-sm">{formatPrice(order.grandTotal)}</span>
                      <button
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        className="text-xs font-bold text-blue hover:underline"
                        aria-expanded={expanded === order.id}
                      >
                        {expanded === order.id ? "Hide details" : "View details"}
                      </button>
                    </div>
                  </div>

                  {expanded === order.id && (
                    <div className="border-t border-gray-2 p-5 space-y-5 text-xs">
                      <div className="divide-y divide-gray-2">
                        {order.items.map((i) => (
                          <div key={i.id} className="py-2 flex justify-between gap-4">
                            <span className="text-dark">
                              {i.title} <span className="text-gray-400">× {i.quantity}</span>
                            </span>
                            <span className="font-semibold text-dark">{formatPrice(i.totalPrice)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1 max-w-xs ml-auto text-gray-600">
                        <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                        {order.discountTotal > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−{formatPrice(order.discountTotal)}</span></div>}
                        <div className="flex justify-between"><span>GST</span><span>{formatPrice(order.taxTotal)}</span></div>
                        <div className="flex justify-between"><span>Shipping</span><span>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</span></div>
                        <div className="flex justify-between font-bold text-dark pt-1 border-t border-gray-2"><span>Total</span><span>{formatPrice(order.grandTotal)}</span></div>
                        <div className="flex justify-between pt-1"><span>Payment</span><span>{order.paymentMethod} • {order.paymentStatus}</span></div>
                      </div>

                      {order.trackingNumber && (
                        <p className="text-gray-600">
                          Tracking: <span className="font-mono font-bold text-dark">{order.trackingNumber}</span>
                          {order.trackingCarrier && ` via ${order.trackingCarrier}`}
                        </p>
                      )}

                      <ol className="space-y-2 border-l-2 border-gray-3 pl-4">
                        {order.timeline.map((t) => (
                          <li key={t.id}>
                            <span className="font-bold text-dark">{t.status.replace(/_/g, " ")}</span>
                            <span className="text-gray-400"> • {new Date(t.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                            {t.note && <div className="text-gray-500">{t.note}</div>}
                          </li>
                        ))}
                      </ol>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <a
                          href={`/api/invoices/${order.orderNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-4 rounded-xl border border-gray-3 text-dark font-bold hover:bg-gray-1"
                        >
                          Download invoice
                        </a>
                        {["PENDING", "CONFIRMED"].includes(order.status) && (
                          <button
                            onClick={() => cancelOrder(order.orderNumber)}
                            disabled={busy === order.orderNumber}
                            className="py-2 px-4 rounded-xl border border-red/40 text-red font-bold hover:bg-red/5 disabled:opacity-50"
                          >
                            {busy === order.orderNumber ? "Cancelling…" : "Cancel order"}
                          </button>
                        )}
                        {order.status === "DELIVERED" && !order.returnRequested && (
                          <button
                            onClick={() => setReturnOrder(order)}
                            className="py-2 px-4 rounded-xl border border-gray-3 text-dark font-bold hover:bg-gray-1"
                          >
                            Request return
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

        {activeTab === "returns" &&
          (returns.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-3 shadow-xs text-sm text-gray-500">
              You have no return or refund requests.
            </div>
          ) : (
            <div className="space-y-3">
              {returns.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl border border-gray-3 p-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-mono font-bold text-dark">{o.orderNumber}</span>
                  <StatusBadge status={o.status === "DELIVERED" ? "RETURN REQUESTED" : o.status} />
                  <span className="font-bold">{formatPrice(o.grandTotal)}</span>
                </div>
              ))}
            </div>
          ))}

        {activeTab === "addresses" &&
          (addresses.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-3 shadow-xs text-sm text-gray-500">
              No saved addresses yet. Your address is saved automatically when you place your first order.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-3 p-5 text-xs text-gray-600 space-y-0.5">
                  <div className="font-bold text-dark text-sm">
                    {a.name} {a.isDefaultShipping && <span className="ml-1 text-[10px] text-blue">Default</span>}
                  </div>
                  <div>{[a.streetAddress, a.apartment].filter(Boolean).join(", ")}</div>
                  <div>{a.city}, {a.state} {a.postalCode}</div>
                  <div>{a.country}</div>
                  <div>{a.phone}</div>
                </div>
              ))}
            </div>
          ))}

        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-gray-3 p-6 text-sm space-y-3 max-w-xl">
            <div><span className="text-gray-400 text-xs block">Name</span><span className="font-semibold text-dark">{user.name}</span></div>
            <div><span className="text-gray-400 text-xs block">Email</span><span className="font-semibold text-dark">{user.email}</span></div>
            <div><span className="text-gray-400 text-xs block">Phone</span><span className="font-semibold text-dark">{user.phone || "Not provided"}</span></div>
          </div>
        )}
      </div>

      {returnOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Request a return">
          <form onSubmit={submitReturn} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-black text-dark">Request a return</h2>
            <p className="text-xs text-gray-500">Order <span className="font-mono font-bold">{returnOrder.orderNumber}</span></p>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              aria-label="Return reason"
              className="w-full px-3 py-2 rounded-xl border border-gray-3 text-xs"
            >
              <option>Item received defective or damaged</option>
              <option>Item not as described</option>
              <option>Wrong item delivered</option>
              <option>No longer needed</option>
            </select>
            <textarea
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              rows={3}
              maxLength={300}
              aria-label="Additional notes"
              placeholder="Additional details (optional)"
              className="w-full px-3 py-2 rounded-xl border border-gray-3 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReturnOrder(null)} className="py-2 px-4 rounded-xl border border-gray-3 text-xs font-bold">Close</button>
              <button type="submit" disabled={busy === returnOrder.orderNumber} className="py-2 px-4 rounded-xl bg-blue text-white text-xs font-bold disabled:opacity-50">
                {busy === returnOrder.orderNumber ? "Submitting…" : "Submit request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function CustomerAccountHub(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-1 py-20 text-center text-xs text-gray-400">Loading your account…</div>}>
      <Hub {...props} />
    </Suspense>
  );
}
