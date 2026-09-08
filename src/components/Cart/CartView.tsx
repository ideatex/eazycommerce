"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/utils/formatePrice";
import { TrustFeaturesBar } from "@/components/ui/TrustFeaturesBar";
import toast from "react-hot-toast";

export default function CartView() {
  const {
    cartDetails,
    cartCount,
    totalPrice,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");

  const items = Object.values(cartDetails ?? {});

  // Group items by Seller / Store
  const groupedBySeller = items.reduce((acc, item) => {
    const seller = (item as any).organizationName || "Velocity Tech Store";
    if (!acc[seller]) acc[seller] = [];
    acc[seller].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const sellerCount = Object.keys(groupedBySeller).length;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;

    if (cleanCode === "VANIGAM10" || cleanCode === "COZY10" || cleanCode === "SAVE10" || cleanCode === "WELCOME") {
      setDiscountAmount(15);
      setAppliedCoupon(cleanCode);
      toast.success(`Coupon ${cleanCode} applied! $15 saved.`);
      setCouponCode("");
    } else {
      toast.error("Invalid coupon code. Try 'VANIGAM10' or 'SAVE10'");
    }
  };

  const shippingCost = items.length > 0 && totalPrice < 100 ? 9.99 : 0;
  const finalTotal = Math.max(0, totalPrice - discountAmount + shippingCost);

  if (items.length === 0) {
    return (
      <div className="pb-24 pt-12 bg-gray-1 min-h-[65vh] flex items-center">
        <div className="w-full px-4 mx-auto max-w-2xl text-center bg-white p-10 sm:p-16 rounded-3xl border border-gray-3 shadow-xs">
          <div className="w-20 h-20 bg-blue/10 text-blue rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            🛒
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark mb-2">
            Your Shopping Cart is Empty
          </h1>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Looks like you haven&apos;t added any items to your cart yet. Explore our verified marketplace catalog to find the latest equipment.
          </p>
          <Link
            href="/shop-with-sidebar"
            className="inline-flex py-3.5 px-8 bg-blue text-white font-bold text-sm rounded-xl hover:bg-blue-dark transition-all duration-150 shadow-xs"
          >
            Explore Marketplace Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        {/* Cart Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue uppercase tracking-wider">
                Shopping Bag
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-emerald-600 font-semibold">Buyer Protection Guaranteed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark">
              Review Your Cart Items
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              You have <span className="font-bold text-dark">{cartCount}</span> items across{" "}
              <span className="font-bold text-blue">{sellerCount}</span> authorized partner store(s)
            </p>
          </div>

          <button
            onClick={clearCart}
            className="text-xs font-bold text-red hover:text-red-dark transition-colors text-left sm:text-right"
          >
            Clear All Items
          </button>
        </div>

        {/* Multi-seller Notice Banner */}
        {sellerCount > 1 && (
          <div className="mb-8 p-4 bg-blue/5 border border-blue/20 rounded-2xl flex items-center gap-3">
            <span className="text-xl">📦</span>
            <div className="text-xs">
              <span className="font-bold text-dark block">
                Multi-Seller Split Shipment Notice
              </span>
              <span className="text-gray-600">
                Your cart contains items fulfilled by {sellerCount} different verified partners. Each partner will dispatch their package directly with separate tracking.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List Grouped by Seller (Left 2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(groupedBySeller).map(([sellerName, sellerItems]) => (
              <div
                key={sellerName}
                className="bg-white rounded-3xl border border-gray-3 overflow-hidden shadow-xs"
              >
                {/* Seller Group Header */}
                <div className="p-4 sm:p-5 bg-gray-2/70 border-b border-gray-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-extrabold text-xs sm:text-sm text-dark">
                      Package Fulfilled by: <span className="text-blue">{sellerName}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {sellerItems.length} item(s)
                  </span>
                </div>

                {/* Seller Items Table / List */}
                <div className="divide-y divide-gray-2 p-4 sm:p-6 space-y-4 sm:space-y-0">
                  {sellerItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-2 border border-gray-3 shrink-0 flex items-center justify-center p-1 overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">No img</span>
                          )}
                        </div>

                        <div>
                          <Link
                            href={`/products/${item.slug || "product"}`}
                            className="font-bold text-dark text-sm hover:text-blue transition-colors line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
                            {item.color && <span>Option: {item.color}</span>}
                            <span>•</span>
                            <span className="font-semibold text-dark">
                              {formatPrice(item.price)} each
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                        {/* Quantity Adjuster */}
                        <div className="inline-flex items-center border border-gray-3 rounded-xl bg-gray-1 overflow-hidden">
                          <button
                            onClick={() => decrementItem(item.id)}
                            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-600 hover:text-dark font-bold text-sm transition-colors"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="px-2 sm:px-3 py-1 font-bold text-dark text-xs min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => incrementItem(item.id)}
                            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-600 hover:text-dark font-bold text-sm transition-colors"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Total */}
                        <span className="font-extrabold text-dark text-sm whitespace-nowrap min-w-16 text-right">
                          {formatPrice(item.price * item.quantity)}
                        </span>

                        {/* Remove */}
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
                  ))}
                </div>
              </div>
            ))}

            {/* Coupon Strip */}
            <div className="bg-white p-5 rounded-2xl border border-gray-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
              <form onSubmit={handleApplyCoupon} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Coupon code (e.g. VANIGAM10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="px-4 py-2.5 border border-gray-3 rounded-xl text-xs bg-gray-1 text-dark focus:outline-none focus:border-blue uppercase w-full sm:w-60 font-semibold"
                />
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-dark text-white text-xs font-bold rounded-xl hover:bg-dark-2 transition-colors whitespace-nowrap"
                >
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <span className="text-xs font-bold text-emerald-600">
                  ✓ {appliedCoupon} Applied (-$15.00)
                </span>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar (Right 1 Col) */}
          <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-dark pb-4 border-b border-gray-2">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal ({cartCount})</span>
                <span className="font-bold text-dark">{formatPrice(totalPrice)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Promotional Discount</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Estimated Shipping</span>
                <span className="font-bold text-dark">
                  {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
                </span>
              </div>

              {totalPrice < 100 && (
                <p className="text-[11px] text-blue bg-blue/5 p-2 rounded-lg">
                  Add {formatPrice(100 - totalPrice)} more for Free Shipping!
                </p>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Estimated Tax (Included)</span>
                <span className="font-bold text-dark">$0.00</span>
              </div>

              <div className="pt-4 border-t border-gray-2 flex justify-between items-baseline">
                <span className="text-base font-extrabold text-dark">Total</span>
                <span className="text-2xl font-black text-dark">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full py-4 px-6 bg-blue hover:bg-blue-dark text-white text-center font-extrabold text-sm rounded-2xl shadow-md transition-all duration-150 flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <span>→</span>
            </Link>

            <div className="space-y-2 pt-2 border-t border-gray-2 text-[11px] text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Protected Escrow Settlement</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue font-bold">✓</span>
                <span>Direct Partner Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span>30-Day Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
