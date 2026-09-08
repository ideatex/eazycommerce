"use client";

import Image from "next/image";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  removeItemFromWishlist,
  removeAllItemsFromWishlist,
} from "@/redux/features/wishlist-slice";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/utils/formatePrice";
import toast from "react-hot-toast";

export default function WishlistView() {
  const wishlistItems = useSelector((state: RootState) => state.wishlistReducer.items);
  const dispatch = useDispatch<AppDispatch>();
  const { addItem } = useCart();

  const handleMoveToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.title,
      price: item.price,
      currency: "usd",
      image: item.image || "",
      slug: item.slug || "",
      availableQuantity: item.quantity || 10,
      color: item.color || "",
      size: "",
      quantity: 1,
    });
    dispatch(removeItemFromWishlist(item.id));
    toast.success(`Moved ${item.title} to cart!`);
  };

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="pb-24 pt-12 bg-gray-1 min-h-[65vh] flex items-center">
        <div className="w-full px-4 mx-auto max-w-2xl text-center bg-white p-10 sm:p-16 rounded-2xl border border-gray-3 shadow-xs">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2">Your Wishlist is Empty</h1>
          <p className="text-gray-500 text-sm mb-8">
            You have not saved any favorite products yet. Browse our store to save items for later!
          </p>
          <Link
            href="/shop-with-sidebar"
            className="inline-flex py-3 px-8 bg-blue text-white font-semibold text-sm rounded-lg hover:bg-blue-dark transition duration-200 shadow-sm"
          >
            Start Exploring
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark">My Wishlist</h1>
            <p className="text-gray-500 text-sm mt-1">
              You have <span className="font-semibold text-dark">{wishlistItems.length}</span> saved items
            </p>
          </div>
          <button
            onClick={() => dispatch(removeAllItemsFromWishlist())}
            className="text-xs font-semibold text-red-500 hover:text-red-700 transition"
          >
            Clear Wishlist
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs">
          {/* Mobile Card List (< 768px) */}
          <div className="block md:hidden divide-y divide-gray-2">
            {wishlistItems.map((item) => (
              <div key={item.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-xl bg-gray-2 border border-gray-3 shrink-0 flex items-center justify-center p-1.5 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No img</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug || "product"}`}
                      className="font-bold text-dark hover:text-blue transition line-clamp-2 text-sm"
                    >
                      {item.title}
                    </Link>
                    {item.color && (
                      <span className="text-xs text-gray-400 mt-0.5 block">
                        Option: {item.color}
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-extrabold text-base text-dark">
                        {formatPrice(item.price)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                        In Stock
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="flex-1 py-2.5 px-4 bg-blue hover:bg-blue-dark text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Move to Cart</span>
                  </button>
                  <button
                    onClick={() => dispatch(removeItemFromWishlist(item.id))}
                    className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition border border-gray-3 shrink-0"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
                {wishlistItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-1/50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-2 border border-gray-3 shrink-0 flex items-center justify-center p-1 overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
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
                            className="font-bold text-dark hover:text-blue transition line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          {item.color && (
                            <span className="text-xs text-gray-400 mt-1 block">
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center font-bold text-dark whitespace-nowrap">
                      {formatPrice(item.price)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        In Stock
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleMoveToCart(item)}
                          className="py-2.5 px-4 bg-blue text-white text-xs font-bold rounded-lg hover:bg-blue-dark transition whitespace-nowrap min-h-[38px]"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => dispatch(removeItemFromWishlist(item.id))}
                          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
