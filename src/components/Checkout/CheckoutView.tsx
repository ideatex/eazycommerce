"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { loadCoupon, saveCoupon, useCartQuote } from "@/hooks/useCartQuote";
import { formatPrice } from "@/utils/formatePrice";
import { apiRequest } from "@/lib/clientApi";
import toast from "react-hot-toast";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

interface Props {
  user: { name: string; email: string; phone: string };
  defaultAddress: {
    name: string;
    phone: string;
    streetAddress: string;
    apartment: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  businessState: string;
}

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-3 bg-gray-1 text-xs text-dark focus:outline-none focus:border-blue";

export default function CheckoutView({ user, defaultAddress, businessState }: Props) {
  const router = useRouter();
  const { clearCart, removeItem } = useCart();

  const [form, setForm] = useState({
    name: defaultAddress?.name ?? user.name,
    phone: defaultAddress?.phone ?? user.phone,
    streetAddress: defaultAddress?.streetAddress ?? "",
    apartment: defaultAddress?.apartment ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? businessState,
    postalCode: defaultAddress?.postalCode ?? "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    setCouponCode(loadCoupon());
  }, []);

  const { items, quote, loading, error } = useCartQuote({ couponCode, state: form.state });
  const lineIssues = (quote?.issues ?? []).filter((i) => i.variantId);
  const couponIssue = quote?.issues.find((i) => !i.variantId);

  useEffect(() => {
    if (couponCode && couponIssue) {
      toast.error(couponIssue.message);
      saveCoupon("");
      setCouponCode("");
    }
  }, [couponCode, couponIssue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      router.push("/shop-with-sidebar");
      return;
    }
    if (!quote || quote.issues.some((i) => i.variantId)) {
      toast.error("Please resolve the cart issues before placing your order.");
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest<{ orderNumber: string; paymentUrl: string | null }>("/api/checkout", {
      body: {
        items: items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        couponCode: couponCode || undefined,
        paymentMethod,
        notes: form.notes || undefined,
        address: {
          name: form.name,
          phone: form.phone,
          streetAddress: form.streetAddress,
          apartment: form.apartment || undefined,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: "India",
        },
      },
    });
    setIsSubmitting(false);

    // Only a confirmed server response clears the cart and shows success.
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    clearCart();
    saveCoupon("");
    if (res.data.paymentUrl) {
      window.location.assign(res.data.paymentUrl);
      return;
    }
    toast.success("Order placed successfully!");
    router.push(`/order-confirmation?orderNo=${encodeURIComponent(res.data.orderNumber)}`);
  };

  if (items.length === 0) {
    return (
      <div className="pb-24 pt-12 bg-gray-1 min-h-[60vh] flex items-center justify-center text-center">
        <div>
          <h1 className="text-xl font-extrabold text-dark mb-3">Your cart is empty</h1>
          <Link href="/shop-with-sidebar" className="inline-flex py-3 px-6 bg-blue text-white font-bold text-sm rounded-xl">
            Browse the catalogue
          </Link>
        </div>
      </div>
    );
  }

  const lineByVariant = new Map((quote?.lines ?? []).map((l) => [l.variantId, l]));

  return (
    <div className="pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="mb-8">
          <span className="text-xs font-bold text-blue uppercase tracking-wider">Secure checkout</span>
          <h1 className="text-2xl sm:text-3xl font-black text-dark">Complete your order</h1>
          <p className="text-xs text-gray-500 mt-1">Signed in as {user.email}</p>
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
            <Link href="/cart" className="font-bold underline">Review your cart</Link>
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-base font-extrabold text-dark pb-3 border-b border-gray-2">Delivery address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold text-dark mb-1">Recipient name *</label>
                    <input id="name" name="name" required value={form.name} onChange={handleChange} className={inputClass} autoComplete="name" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-dark mb-1">Phone number *</label>
                    <input id="phone" name="phone" type="tel" required value={form.phone} onChange={handleChange} className={inputClass} autoComplete="tel" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="streetAddress" className="block text-xs font-bold text-dark mb-1">Street address *</label>
                    <input id="streetAddress" name="streetAddress" required value={form.streetAddress} onChange={handleChange} className={inputClass} autoComplete="address-line1" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="apartment" className="block text-xs font-bold text-dark mb-1">Apartment, suite, landmark</label>
                    <input id="apartment" name="apartment" value={form.apartment} onChange={handleChange} className={inputClass} autoComplete="address-line2" />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-xs font-bold text-dark mb-1">City *</label>
                    <input id="city" name="city" required value={form.city} onChange={handleChange} className={inputClass} autoComplete="address-level2" />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-xs font-bold text-dark mb-1">State *</label>
                    <select id="state" name="state" required value={form.state} onChange={handleChange} className={inputClass}>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-xs font-bold text-dark mb-1">PIN code *</label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      required
                      inputMode="numeric"
                      pattern="[1-9][0-9]{5}"
                      title="6-digit PIN code"
                      maxLength={6}
                      value={form.postalCode}
                      onChange={handleChange}
                      className={inputClass}
                      autoComplete="postal-code"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-xs font-bold text-dark mb-1">Order notes (optional)</label>
                  <textarea id="notes" name="notes" rows={2} maxLength={500} value={form.notes} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-base font-extrabold text-dark pb-3 border-b border-gray-2">Payment</h2>
                <label className="flex items-center gap-3 p-4 rounded-2xl border border-gray-3 cursor-pointer has-[:checked]:border-blue has-[:checked]:bg-blue/5">
                  <input type="radio" name="payment" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
                  <span className="text-sm font-bold text-dark">Cash on delivery</span>
                </label>
                {quote?.onlinePaymentsEnabled && (
                  <label className="flex items-center gap-3 p-4 rounded-2xl border border-gray-3 cursor-pointer has-[:checked]:border-blue has-[:checked]:bg-blue/5">
                    <input type="radio" name="payment" checked={paymentMethod === "ONLINE"} onChange={() => setPaymentMethod("ONLINE")} />
                    <span className="text-sm font-bold text-dark">Pay online (card / UPI)</span>
                  </label>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 shadow-xs space-y-5 lg:sticky lg:top-24">
              <h2 className="text-lg font-black text-dark pb-4 border-b border-gray-2">Order summary</h2>
              <ul className="divide-y divide-gray-2 text-xs">
                {items.map((item) => {
                  const line = item.variantId ? lineByVariant.get(item.variantId) : undefined;
                  return (
                    <li key={item.id} className="py-3 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-2 border border-gray-3 shrink-0 overflow-hidden flex items-center justify-center">
                        {item.image && (
                          <Image src={item.image} alt={item.name} width={48} height={48} unoptimized={!item.image.startsWith("/")} className="object-contain w-full h-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-dark truncate">{item.name}</div>
                        <div className="text-gray-400">Qty {item.quantity}</div>
                      </div>
                      <span className="font-bold text-dark">{formatPrice(line ? line.totalPrice : item.price * item.quantity)}</span>
                      <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`} className="text-gray-400 hover:text-red">✕</button>
                    </li>
                  );
                })}
              </ul>

              {quote ? (
                <div className={`space-y-2 text-xs ${loading ? "opacity-60" : ""}`}>
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-bold text-dark">{formatPrice(quote.totals.subtotal)}</span></div>
                  {quote.totals.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold"><span>Discount ({quote.coupon?.code})</span><span>−{formatPrice(quote.totals.discountTotal)}</span></div>
                  )}
                  {quote.totals.cgstTotal > 0 && <div className="flex justify-between text-gray-600"><span>CGST</span><span>{formatPrice(quote.totals.cgstTotal)}</span></div>}
                  {quote.totals.sgstTotal > 0 && <div className="flex justify-between text-gray-600"><span>SGST</span><span>{formatPrice(quote.totals.sgstTotal)}</span></div>}
                  {quote.totals.igstTotal > 0 && <div className="flex justify-between text-gray-600"><span>IGST</span><span>{formatPrice(quote.totals.igstTotal)}</span></div>}
                  <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-bold text-dark">{quote.totals.shippingFee === 0 ? "FREE" : formatPrice(quote.totals.shippingFee)}</span></div>
                  <div className="pt-3 border-t border-gray-2 flex justify-between items-baseline">
                    <span className="text-base font-extrabold text-dark">Total</span>
                    <span className="text-2xl font-black text-dark">{formatPrice(quote.totals.grandTotal)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">{loading ? "Calculating totals…" : "Totals unavailable."}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !quote || lineIssues.length > 0}
                className="w-full py-4 px-6 bg-blue hover:bg-blue-dark text-white font-extrabold text-sm rounded-2xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Placing order…" : paymentMethod === "ONLINE" ? "Continue to payment" : "Place order"}
              </button>
              <p className="text-[11px] text-gray-400 text-center">
                Final prices, GST and stock are confirmed by our server when you place the order.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
