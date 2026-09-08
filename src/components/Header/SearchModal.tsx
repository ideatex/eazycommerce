"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { mockProducts, mockCategories } from "@/data/mockProducts";
import { initialOrganizations } from "@/lib/b2b2c/mockVanigamData";
import { formatPrice } from "@/utils/formatePrice";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  const matchingProducts = cleanQuery
    ? mockProducts.filter((p) =>
        p.title.toLowerCase().includes(cleanQuery) ||
        p.shortDescription?.toLowerCase().includes(cleanQuery) ||
        p.category?.title?.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchingCategories = cleanQuery
    ? mockCategories.filter((c) =>
        c.title.toLowerCase().includes(cleanQuery) ||
        c.slug.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchingStores = cleanQuery
    ? initialOrganizations.filter((o) =>
        o.organizationType !== "PLATFORM" &&
        (o.name.toLowerCase().includes(cleanQuery) ||
         o.description.toLowerCase().includes(cleanQuery))
      )
    : [];

  const popularKeywords = ["Gamepad", "Watch", "Wireless Mouse", "Titanium", "Gaming", "Headphones"];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
      <div className="bg-white rounded-3xl border border-gray-3 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Header Input */}
        <div className="p-4 sm:p-5 border-b border-gray-2 flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            autoFocus
            placeholder="Search products, categories, or verified stores..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-base font-semibold text-dark focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-gray-400 hover:text-dark px-2 py-1 bg-gray-2 rounded-lg"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-dark hover:bg-gray-1 text-sm font-bold transition-colors shrink-0"
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        {/* Results / Suggestion Body */}
        <div className="max-h-[65dvh] overflow-y-auto p-4 sm:p-6 space-y-6 momentum-scroll">
          {cleanQuery === "" ? (
            <div className="space-y-6">
              {/* Popular Searches */}
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
                  Popular Searches
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularKeywords.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => setQuery(kw)}
                      className="py-1.5 px-3 rounded-full bg-gray-2 hover:bg-blue/10 hover:text-blue text-xs font-semibold text-gray-600 transition-colors"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified Stores Quick Links */}
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
                  Featured Verified Stores
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {initialOrganizations
                    .filter((o) => o.organizationType !== "PLATFORM")
                    .slice(0, 4)
                    .map((store) => (
                      <Link
                        key={store.id}
                        href={`/store/${store.slug}`}
                        onClick={onClose}
                        className="p-3 rounded-xl border border-gray-3 bg-gray-1 hover:border-blue hover:bg-white transition-all flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-3 p-1 flex items-center justify-center shrink-0">
                          <Image
                            src={store.logo || "/images/sellers/sellers-01.png"}
                            alt={store.name}
                            width={28}
                            height={28}
                            className="object-contain"
                          />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-dark truncate">{store.name}</h4>
                          <span className="text-[10px] text-emerald-600 font-semibold">✓ Verified</span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          ) : matchingProducts.length === 0 && matchingCategories.length === 0 && matchingStores.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-3xl block mb-2">🔍</span>
              <h4 className="font-bold text-dark text-sm mb-1">No matches for &quot;{query}&quot;</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Check your spelling or search by general keywords like &quot;Gamepad&quot; or &quot;SmartWatch&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category Results */}
              {matchingCategories.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Matching Categories ({matchingCategories.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {matchingCategories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/categories/${cat.slug}`}
                        onClick={onClose}
                        className="py-1.5 px-3 rounded-xl bg-blue/10 text-blue font-bold text-xs hover:bg-blue hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <span>📁</span>
                        <span>{cat.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Store Results */}
              {matchingStores.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Verified Stores ({matchingStores.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingStores.map((store) => (
                      <Link
                        key={store.id}
                        href={`/store/${store.slug}`}
                        onClick={onClose}
                        className="p-3 rounded-xl border border-gray-3 bg-gray-1 hover:border-blue hover:bg-white transition-all flex items-center justify-between"
                      >
                        <span className="font-bold text-dark text-xs">{store.name}</span>
                        <span className="text-[10px] text-blue font-semibold">Visit Store →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Results */}
              {matchingProducts.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Products ({matchingProducts.length})
                  </span>
                  <div className="divide-y divide-gray-2">
                    {matchingProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={onClose}
                        className="py-3 px-2 rounded-xl flex items-center justify-between hover:bg-gray-1 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-2 border border-gray-3 p-1 shrink-0 flex items-center justify-center">
                            <Image
                              src={product.previews[0] || product.thumbnails[0] || "/images/products/product-1-bg-1.png"}
                              alt={product.title}
                              width={40}
                              height={40}
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-dark text-xs sm:text-sm group-hover:text-blue transition line-clamp-1">
                              {product.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">
                              {product.category?.title} • Sold by Velocity Tech
                            </span>
                          </div>
                        </div>
                        <span className="font-extrabold text-dark text-xs sm:text-sm whitespace-nowrap pl-4">
                          {formatPrice(product.discountedPrice || product.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
