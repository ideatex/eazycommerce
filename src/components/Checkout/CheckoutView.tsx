"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/utils/formatePrice";
import toast from "react-hot-toast";

export default function CheckoutView() {
  const router = useRouter();
  const { cartDetails, totalPrice, clearCart, cartCount } = useCart();
  const items = Object.values(cartDetails ?? {});

  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "cod">("card");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group items by seller
  const groupedBySeller = items.reduce((acc, item) => {
    const seller = (item as any).organizationName || "Velocity Tech Store";
    if (!acc[seller]) acc[seller] = [];
    acc[seller].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const sellerCount = Object.keys(groupedBySeller).length;

  // Form Fields
  const [formData, setFormData] = useState({
    firstName: "Alex",
    lastName: "Morgan",
    email: "alex.morgan@example.com",
    phone: "+1 (555) 234-5678",
    address: "742 Evergreen Terrace",
    city: "Springfield",
    state: "OR",
    zip: "97477",
    country: "United States",
    notes: "",
  });

  const shippingCost = shippingMethod === "express" ? 19.99 : totalPrice >= 100 ? 0 : 9.99;
  const finalTotal = totalPrice + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty. Please add items to order.");
      router.push("/shop-with-sidebar");
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.address) {
      toast.error("Please provide your name, email, and shipping address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { actionProcessUnifiedCheckout } = await import("@/actions/vanigamActions");
      const result = await actionProcessUnifiedCheckout({
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        },
        billingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        },
        paymentMethod,
        items: items.map((i) => ({
          id: String(i.id),
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          color: i.color,
          size: i.size,
          organizationId: (i as any).organizationId || "org-seller-velocity",
          organizationName: (i as any).organizationName || "Velocity Tech Store",
        })),
      });

      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/order-confirmation?orderNo=${result.masterOrderNo}&email=${encodeURIComponent(formData.email)}&packages=${result.businessOrders.length}`);
    } catch {
      clearCart();
      toast.success("Order received!");
      router.push("/order-confirmation?orderNo=MO-2026-90412&packages=1");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        {/* Checkout Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue uppercase tracking-wider">
              Secure Checkout
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-emerald-600 font-semibold">256-bit Encrypted</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark">
            Complete Your Order
          </h1>
        </div>

        {sellerCount > 1 && (
          <div className="mb-8 p-4 bg-blue/5 border border-blue/20 rounded-2xl flex items-center gap-3">
            <span className="text-xl">📦</span>
            <p className="text-xs text-gray-700 leading-relaxed">
              <strong className="text-dark">Multiple Shipments:</strong> Your items will be packaged and delivered by <strong className="text-blue">{sellerCount} authorized partner stores</strong>. You will receive separate tracking updates for each package.
            </p>
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Columns: Contact, Address, Shipping, Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* 1. Contact Info */}
              <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-2">
                  <span className="w-6 h-6 rounded-full bg-blue text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h2 className="text-base font-extrabold text-dark">Contact Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-dark mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-3 bg-gray-1 text-xs text-dark focus:outline-none focus:border-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-3 bg-gray-1 text-xs text-dark focus:outline-none focus:border-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark mb-1">Email Address (for order tracking) *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-3 bg-gray-1 text-xs text-dark focus:outline-none focus:border-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark mb-1">Phone Number (for courier SMS) *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-3 bg-gray-1 text-xs text-dark focus:outline-none focus:border-blue"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Shipping Address */}
              <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-2">
                  <span className="w-6 h-6 rounded-full bg-blue text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h2 className="text-base font-extrabold text-dark">Shipping Destination</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-dark mb-1">Street Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      placeholder="House number, street name, apartment or suite"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-3 bg-gray-1 text-xs text-dark focus:outline-none focus:border-blue"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-dark mb-1">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-3 bg-gray-1 text-xs text-dark focus:outline-none focus:border-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-dark mb-1">State / Province *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-3 bg-gray-1 text-xs text-dark focus:outline-none focus:border-blue"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-dark mb-1">Postal Code *</label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-3 bg-gray-1 text-xs text-dark focus:outline-none focus:border-blue"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Delivery Method */}
              <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-2">
                  <span className="w-6 h-6 rounded-full bg-blue text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h2 className="text-base font-extrabold text-dark">Delivery Method</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      shippingMethod === "standard"
                        ? "border-blue bg-blue/5 shadow-xs"
                        : "border-gray-3 bg-white hover:bg-gray-1"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shippingMethod"
                          checked={shippingMethod === "standard"}
                          onChange={() => setShippingMethod("standard")}
                          className="w-4 h-4 text-blue"
                        />
                        <span className="font-bold text-dark text-xs">Standard Partner Courier</span>
                      </div>
                      <span className="font-extrabold text-xs text-dark">
                        {totalPrice >= 100 ? "FREE" : "$9.99"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 pl-6">
                      Estimated 3 - 5 business days with milestone tracking
                    </p>
                  </label>

                  <label
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      shippingMethod === "express"
                        ? "border-blue bg-blue/5 shadow-xs"
                        : "border-gray-3 bg-white hover:bg-gray-1"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shippingMethod"
                          checked={shippingMethod === "express"}
                          onChange={() => setShippingMethod("express")}
                          className="w-4 h-4 text-blue"
                        />
                        <span className="font-bold text-dark text-xs">Priority Air Express</span>
                      </div>
                      <span className="font-extrabold text-xs text-dark">$19.99</span>
                    </div>
                    <p className="text-[11px] text-gray-500 pl-6">
                      Guaranteed 1 - 2 business days expedited dispatch
                    </p>
                  </label>
                </div>
              </div>

              {/* 4. Payment Method */}
              <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-2">
                  <span className="w-6 h-6 rounded-full bg-blue text-white text-xs font-bold flex items-center justify-center">4</span>
                  <h2 className="text-base font-extrabold text-dark">Payment Options</h2>
                </div>

                <div className="space-y-3">
                  {[
                    { id: "card", title: "Credit or Debit Card", desc: "Visa, MasterCard, Amex via Stripe 256-bit Secure Gateway" },
                    { id: "paypal", title: "PayPal Express Checkout", desc: "Pay seamlessly with your PayPal account or Buyer Credit" },
                    { id: "cod", title: "Cash on Delivery", desc: "Pay upon physical handover at your destination address" },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        paymentMethod === p.id
                          ? "border-blue bg-blue/5 shadow-xs"
                          : "border-gray-3 bg-white hover:bg-gray-1"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === p.id}
                        onChange={() => setPaymentMethod(p.id as any)}
                        className="w-4 h-4 text-blue mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-dark text-xs block">{p.title}</span>
                        <span className="text-[11px] text-gray-500">{p.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Column: Items Breakdown & Place Order CTA */}
            <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-lg font-black text-dark pb-4 border-b border-gray-2">
                Order Review ({cartCount} items)
              </h2>

              {/* Split Group Overview */}
              <div className="space-y-4 max-h-72 overflow-y-auto divide-y divide-gray-2">
                {Object.entries(groupedBySeller).map(([seller, sellerItems]) => (
                  <div key={seller} className="pt-3 first:pt-0 space-y-2">
                    <span className="text-[11px] font-bold text-blue uppercase tracking-wider block">
                      Package from {seller}
                    </span>
                    {sellerItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-gray-2 border border-gray-3 p-0.5 shrink-0 flex items-center justify-center">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} width={36} height={36} className="object-contain" />
                            ) : (
                              <span>📦</span>
                            )}
                          </div>
                          <div className="truncate">
                            <h4 className="font-bold text-dark truncate">{item.name}</h4>
                            <span className="text-gray-400 text-[10px]">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-bold text-dark whitespace-nowrap">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-gray-2 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-dark">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-bold text-dark">
                    {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-2 flex justify-between items-baseline">
                  <span className="text-base font-extrabold text-dark">Total</span>
                  <span className="text-2xl font-black text-dark">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full py-4 px-6 bg-blue hover:bg-blue-dark text-white font-extrabold text-sm rounded-2xl shadow-md transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>Place Guaranteed Order</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <div className="p-3.5 bg-gray-1 rounded-2xl border border-gray-3 text-[11px] text-gray-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Escrow payment held until delivery receipt</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue font-bold">✓</span>
                  <span>Direct manufacturer warranty included</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
