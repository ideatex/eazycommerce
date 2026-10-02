"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { apiRequest } from "@/lib/clientApi";

export interface QuoteLine {
  variantId: string;
  productId: string;
  title: string;
  variantTitle: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRatePercent: number;
  available: number;
  moq: number;
  image: string | null;
}

export interface Quote {
  lines: QuoteLine[];
  totals: {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    shippingFee: number;
    grandTotal: number;
  };
  coupon: { code: string; discount: number } | null;
  issues: Array<{ variantId?: string; message: string }>;
  signedIn: boolean;
  onlinePaymentsEnabled: boolean;
}

const COUPON_KEY = "vanigam-coupon";

export function loadCoupon(): string {
  try {
    return sessionStorage.getItem(COUPON_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveCoupon(code: string) {
  try {
    if (code) sessionStorage.setItem(COUPON_KEY, code);
    else sessionStorage.removeItem(COUPON_KEY);
  } catch {
    // Private mode: the coupon just will not carry over to the next page.
  }
}

/**
 * Asks the server to price the cart. Prices, tax, shipping and discounts shown
 * on the cart and checkout pages always come from this response, never from
 * the (possibly stale) values saved in the browser.
 */
export function useCartQuote(options: { couponCode?: string; state?: string }) {
  const { cartDetails } = useCart();
  const items = useMemo(() => Object.values(cartDetails ?? {}), [cartDetails]);

  const payload = useMemo(
    () =>
      items
        .filter((i) => i.variantId)
        .map((i) => ({ variantId: i.variantId as string, quantity: i.quantity })),
    [items]
  );
  const key = JSON.stringify([payload, options.couponCode ?? "", options.state ?? ""]);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (payload.length === 0) {
      setQuote(null);
      setError("");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await apiRequest<Quote>("/api/checkout/quote", {
        body: { items: payload, couponCode: options.couponCode || undefined, state: options.state || undefined },
      });
      if (cancelled) return;
      setLoading(false);
      if (res.ok) {
        setQuote(res.data);
        setError("");
      } else {
        setError(res.error);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `key` captures every input that should trigger a re-quote.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { items, quote, loading, error };
}
