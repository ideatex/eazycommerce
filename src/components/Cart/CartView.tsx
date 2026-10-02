"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { loadCoupon, saveCoupon, useCartQuote } from "@/hooks/useCartQuote";
import { formatPrice } from "@/utils/formatePrice";
import toast from "react-hot-toast";

export default function CartView() {
  const { cartCount, incrementItem, decrementItem, removeItem, clearCart } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  useEffect(() => {
    setCouponCode(loadCoupon());
  }, []);

  const { items, quote, loading, error } = useCartQuote({ couponCode });
  const lineByVariant = new Map((quote?.lines ?? []).map((l) => [l.variantId, l]));

  const couponIssue = quote?.issues.find((i) => !i.variantId);
  const lineIssues = (quote?.issues ?? []).filter((i) => i.variantId);
  const blocked = (quote?.issues ?? []).some((i) => i.variantId);

  // A coupon the server rejects is dropped so it does not block checkout.
  useEffect(() => {
    if (couponCode && couponIssue) {
      toast.error(couponIssue.message);
      saveCoupon("");
      setCouponCode("");
    }
  }, [couponCode, couponIssue]);

  const applyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    saveCoupon(code);
    setCouponCode(code);
    setCouponInput("");
  };

  const removeCoupon = () => {
    saveCoupon("");
    setCouponCode("");
  };

  const removeUnavailable = () => {
    const bad = new Set(lineIssues.map((i) => i.variantId));
    items.filter((i) => i.variantId && bad.has(i.variantId)).forEach((i) => removeItem(i.id));
  };

  if (items.length === 0) {
    return (
      <div className="pb-24 pt-12 bg-gray-1 min-h-[65vh] flex items-center">
        <div className="w-full px-4 mx-auto max-w-2xl text-center bg-white p-10 sm:p-16 rounded-3xl border border-gray-3 shadow-xs">
          <div className="w-20 h-20 bg-blue/10 text-blue rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🛒</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark mb-2">Your cart is empty</h1>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            You haven&apos;t added anything yet. Browse the catalogue to find something you like.
          </p>
          <Link
            href="/shop-with-sidebar"
            className="inline-flex py-3.5 px-8 bg-blue text-white font-bold text-sm rounded-xl hover:bg-blue-dark transition-all duration-150 shadow-xs"
          >
            Browse the catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark">Review your cart</h1>
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-bold text-dark">{cartCount}</span> item{cartCount === 1 ? "" : "s"} in your cart
            </p>
          </div>
          <button onClick={clearCart} className="text-xs font-bold text-red hover:text-red-dark transition-colors text-left sm:text-right">
            Clear all items
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
            {error}
          </div>
        )}

        {lineIssues.length > 0 && (
          <div role="alert" className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
            {lineIssues.map((i, idx) => (
              <p key={idx}>{i.message}</p>
            ))}
            <button onClick={removeUnavailable} className="font-bold underline mt-1">
              Remove unavailable items
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-3 overflow-hidden shadow-xs divide-y divide-gray-2 p-4 sm:p-6">
              {items.map((item) => {
                const line = item.variantId ? lineByVariant.get(item.variantId) : undefined;
                const unitPrice = line ? line.unitPrice : item.price;
                const maxQty = line ? line.available : item.availableQuantity ?? Infinity;
                return (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gray-2 border border-gray-3 shrink-0 flex items-center justify-center p-1 overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={64}
                            height={64}
                            unoptimized={!item.image.startsWith("/")}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">No img</span>
                        )}
                      </div>
                      <div>
                        <Link href={`/products/${item.slug || ""}`} className="font-bold text-dark text-sm hover:text-blue transition-colors line-clamp-1">
                          {item.name}
                        </Link>
                        <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
                          {item.color && <span>Option: {item.color}</span>}
                          <span className="font-semibold text-dark">{formatPrice(unitPrice)} each</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                      <div className="inline-flex items-center border border-gray-3 rounded-xl bg-gray-1 overflow-hidden">
                        <button
                          onClick={() => decrementItem(item.id)}
                          disabled={item.quantity <= (item.moq ?? 1)}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-600 hover:text-dark font-bold text-sm transition-colors disabled:opacity-30"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="px-2 sm:px-3 py-1 font-bold text-dark text-xs min-w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => incrementItem(item.id)}
                          disabled={item.quantity >= maxQty}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-600 hover:text-dark font-bold text-sm transition-colors disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-extrabold text-dark text-sm whitespace-nowrap min-w-16 text-right">
                        {formatPrice(unitPrice * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red hover:bg-red/10 rounded-lg transition-colors"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
              <form onSubmit={applyCoupon} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  aria-label="Coupon code"
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="px-4 py-2.5 border border-gray-3 rounded-xl text-xs bg-gray-1 text-dark focus:outline-none focus:border-blue uppercase w-full sm:w-60 font-semibold"
                />
                <button type="submit" className="py-2.5 px-5 bg-dark text-white text-xs font-bold rounded-xl hover:bg-dark-2 transition-colors whitespace-nowrap">
                  Apply
                </button>
              </form>
              {quote?.coupon && (
                <span className="text-xs font-bold text-emerald-600">
                  ✓ {quote.coupon.code} applied (−{formatPrice(quote.coupon.discount)}){" "}
                  <button onClick={removeCoupon} className="underline ml-1 text-gray-500">remove</button>
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-dark pb-4 border-b border-gray-2">Order summary</h2>
            {!quote ? (
              <p className="text-xs text-gray-500">{loading ? "Calculating totals…" : "Totals unavailable."}</p>
            ) : (
              <div className={`space-y-3 text-xs ${loading ? "opacity-60" : ""}`}>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartCount})</span>
                  <span className="font-bold text-dark">{formatPrice(quote.totals.subtotal)}</span>
                </div>
                {quote.totals.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>−{formatPrice(quote.totals.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-bold text-dark">{quote.totals.shippingFee === 0 ? "FREE" : formatPrice(quote.totals.shippingFee)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (calculated at checkout by delivery state)</span>
                  <span className="font-bold text-dark">{formatPrice(quote.totals.taxTotal)}</span>
                </div>
                <div className="pt-4 border-t border-gray-2 flex justify-between items-baseline">
                  <span className="text-base font-extrabold text-dark">Total</span>
                  <span className="text-2xl font-black text-dark">{formatPrice(quote.totals.grandTotal)}</span>
                </div>
              </div>
            )}

            {blocked || !quote ? (
              <button disabled className="w-full py-4 px-6 bg-gray-3 text-gray-500 font-extrabold text-sm rounded-2xl cursor-not-allowed">
                {blocked ? "Fix cart issues to continue" : "Proceed to Checkout"}
              </button>
            ) : (
              <Link
                href="/checkout"
                className="w-full py-4 px-6 bg-blue hover:bg-blue-dark text-white text-center font-extrabold text-sm rounded-2xl shadow-md transition-all duration-150 flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
