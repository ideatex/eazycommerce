"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { removeItemFromWishlist, removeAllItemsFromWishlist } from "@/redux/features/wishlist-slice";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/utils/formatePrice";
import { apiRequest } from "@/lib/clientApi";
import toast from "react-hot-toast";

interface LiveProduct {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  listPrice: number | null;
  available: number;
  moq: number;
  variantId: string | null;
  variantAvailable: number;
  color: string;
  size: string;
}

const isLocal = (src: string) => src.startsWith("/");

function StockBadge({ state, available }: { state: "checking" | "gone" | "ready"; available: number }) {
  if (state === "checking")
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-2 text-gray-500">Checking…</span>;
  if (state === "gone")
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-2 text-gray-600">No longer available</span>;
  if (available < 1)
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Out of Stock</span>;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      {available <= 5 ? `Only ${available} left` : "In Stock"}
    </span>
  );
}

const Thumb = ({ src, alt, size }: { src: string; alt: string; size: number }) =>
  src ? (
    <Image src={src} alt={alt} width={size} height={size} unoptimized={!isLocal(src)} className="w-full h-full object-contain" />
  ) : (
    <span className="text-xs text-gray-400">No img</span>
  );

/** `price` is null while unverified or for unavailable items, so a stale saved price is never shown. */
const Price = ({ price, listPrice, className }: { price: number | null; listPrice: number | null; className: string }) => {
  if (price === null) return <span className={className}>—</span>;
  return (
    <span className={className}>
      {formatPrice(price)}
      {listPrice !== null && listPrice > price && <span className="ml-2 text-xs font-medium text-gray-400 line-through">{formatPrice(listPrice)}</span>}
    </span>
  );
};

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);


export default function WishlistView() {
  const wishlistItems = useSelector((state: RootState) => state.wishlistReducer.items);
  const dispatch = useDispatch<AppDispatch>();
  const { addItem } = useCart();

  // Prices and stock are read fresh from the catalogue; the saved copy only identifies the product.
  const [live, setLive] = useState<Record<string, LiveProduct>>({});
  const [checked, setChecked] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const idsKey = useMemo(() => wishlistItems.map((i) => i.id).join(","), [wishlistItems]);

  useEffect(() => {
    if (!idsKey) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await apiRequest<{ products: LiveProduct[] }>(`/api/wishlist/products?ids=${encodeURIComponent(idsKey)}`);
      if (cancelled) return;
      if (res.ok) {
        setLive(Object.fromEntries(res.data.products.map((p) => [p.id, p])));
        setCheckFailed(false);
      } else {
        setCheckFailed(true);
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const stateOf = (id: string): "checking" | "gone" | "ready" => {
    if (!checked) return "checking";
    if (checkFailed) return "ready"; // could not verify: fall back to the saved copy, cart re-checks stock
    return live[id] ? "ready" : "gone";
  };

  const handleMoveToCart = (item: { id: string; title: string }) => {
    const p = live[item.id];
    if (!p || !p.variantId || p.variantAvailable < 1) {
      toast.error("This item is not available right now.");
      return;
    }
    addItem({
      id: p.variantId,
      productId: p.id,
      variantId: p.variantId,
      name: p.title,
      price: p.price,
      currency: "inr",
      image: p.image,
      slug: p.slug,
      availableQuantity: p.variantAvailable,
      moq: p.moq,
      color: p.color,
      size: p.size,
      quantity: Math.min(p.moq, p.variantAvailable),
    });
    dispatch(removeItemFromWishlist(item.id));
    toast.success(`Moved ${item.title} to cart`);
  };

  const handleRemove = (id: string) => {
    dispatch(removeItemFromWishlist(id));
    toast.success("Removed from wishlist");
  };

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="pb-24 pt-12 bg-gray-1 min-h-[65vh] flex items-center">
        <div className="w-full px-4 mx-auto max-w-2xl text-center bg-white p-10 sm:p-16 rounded-2xl border border-gray-3 shadow-xs">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2">Your Wishlist is Empty</h1>
          <p className="text-gray-500 text-sm mb-8">
            You have not saved any favorite products yet. Browse our store to save items for later!
          </p>
          <Link href="/shop-with-sidebar" className="inline-flex py-3 px-8 bg-blue text-white font-semibold text-sm rounded-lg hover:bg-blue-dark transition duration-200 shadow-sm">
            Start Exploring
          </Link>
        </div>
      </div>
    );
  }

  const rows = wishlistItems.map((item) => {
    const p = live[item.id];
    const state = stateOf(item.id);
    return {
      item,
      state,
      title: p?.title ?? item.title,
      slug: p?.slug ?? item.slug,
      image: p?.image ?? item.image,
      // Live price when verified; the saved copy only when verification itself failed.
      price: p ? p.price : state === "ready" ? item.price : null,
      listPrice: p?.listPrice ?? null,
      available: p ? p.available : item.quantity,
      color: p?.color || item.color || "",
      canBuy: state === "ready" && !!p && !!p.variantId && p.variantAvailable > 0,
    };
  });

  return (
    <div className="pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark">My Wishlist</h1>
            <p className="text-gray-500 text-sm mt-1">
              You have <span className="font-semibold text-dark">{wishlistItems.length}</span> saved {wishlistItems.length === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm("Remove every item from your wishlist?")) dispatch(removeAllItemsFromWishlist());
            }}
            className="text-xs font-semibold text-red-500 hover:text-red-700 transition"
          >
            Clear Wishlist
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs">
          {/* Mobile Card List (< 768px) */}
          <div className="block md:hidden divide-y divide-gray-2">
            {rows.map((r) => (
              <div key={r.item.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Link href={`/products/${r.slug}`} className="w-20 h-20 rounded-xl bg-gray-2 border border-gray-3 shrink-0 flex items-center justify-center p-1.5 overflow-hidden" aria-label={r.title}>
                    <Thumb src={r.image} alt={r.title} size={80} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${r.slug}`} className="font-bold text-dark hover:text-blue transition line-clamp-2 text-sm">
                      {r.title}
                    </Link>
                    {r.color && <span className="text-xs text-gray-400 mt-0.5 block">Option: {r.color}</span>}
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <Price price={r.price} listPrice={r.listPrice} className="font-extrabold text-base text-dark" />
                      <StockBadge state={r.state} available={r.available} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleMoveToCart(r.item)}
                    disabled={!r.canBuy}
                    className="flex-1 py-2.5 px-4 bg-blue hover:bg-blue-dark text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>{r.state === "gone" ? "Unavailable" : r.canBuy || r.state === "checking" ? "Move to Cart" : "Out of Stock"}</span>
                  </button>
                  <button
                    onClick={() => handleRemove(r.item.id)}
                    className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition border border-gray-3 shrink-0"
                    title="Remove item"
                    aria-label={`Remove ${r.title}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-2 bg-gray-2/50 text-xs uppercase tracking-wider font-semibold text-gray-500">
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-4 text-center">Unit Price</th>
                  <th className="py-4 px-4 text-center">Stock Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-2 text-sm">
                {rows.map((r) => (
                  <tr key={r.item.id} className="hover:bg-gray-1/50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <Link href={`/products/${r.slug}`} className="w-16 h-16 rounded-xl bg-gray-2 border border-gray-3 shrink-0 flex items-center justify-center p-1 overflow-hidden" aria-label={r.title}>
                          <Thumb src={r.image} alt={r.title} size={64} />
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/products/${r.slug}`} className="font-bold text-dark hover:text-blue transition line-clamp-1">
                            {r.title}
                          </Link>
                          {r.color && <span className="text-xs text-gray-400 mt-1 block">Option: {r.color}</span>}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center font-bold text-dark whitespace-nowrap">
                      <Price price={r.price} listPrice={r.listPrice} className="" />
                    </td>

                    <td className="py-4 px-4 text-center">
                      <StockBadge state={r.state} available={r.available} />
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleMoveToCart(r.item)}
                          disabled={!r.canBuy}
                          className="py-2.5 px-4 bg-blue text-white text-xs font-bold rounded-lg hover:bg-blue-dark transition whitespace-nowrap min-h-[38px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {r.state === "gone" ? "Unavailable" : r.canBuy || r.state === "checking" ? "Add to Cart" : "Out of Stock"}
                        </button>
                        <button
                          onClick={() => handleRemove(r.item.id)}
                          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Remove item"
                          aria-label={`Remove ${r.title}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
