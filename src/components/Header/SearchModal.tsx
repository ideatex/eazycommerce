"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/clientApi";
import { formatPrice } from "@/utils/formatePrice";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResults {
  products: Array<{ id: string; slug: string; title: string; price: number; image: string; category: string | null }>;
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cleanQuery = query.trim();

  // Debounced live search against the real catalogue.
  useEffect(() => {
    if (!isOpen) return;
    if (cleanQuery.length < 2) {
      setResults(null);
      setError("");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await apiRequest<SearchResults>(`/api/search?q=${encodeURIComponent(cleanQuery)}`);
      if (cancelled) return;
      setLoading(false);
      if (res.ok) {
        setResults(res.data);
        setError("");
      } else {
        setResults(null);
        setError(res.error);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleanQuery, isOpen]);

  if (!isOpen) return null;

  const hasResults = !!results && results.products.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanQuery.length < 2) return;
    onClose();
    router.push(`/shop-with-sidebar?q=${encodeURIComponent(cleanQuery)}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="bg-white rounded-3xl border border-gray-3 shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        <form onSubmit={submit} className="p-4 sm:p-5 border-b border-gray-2 flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            autoFocus
            placeholder="Search products..."
            aria-label="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-base font-semibold text-dark focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs text-gray-400 hover:text-dark px-2 py-1 bg-gray-2 rounded-lg"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-dark hover:bg-gray-1 text-sm font-bold transition-colors shrink-0"
            aria-label="Close search"
          >
            ✕
          </button>
        </form>

        <div className="max-h-[65dvh] overflow-y-auto p-4 sm:p-6 space-y-6">
          {cleanQuery.length < 2 ? (
            <p className="text-xs text-gray-500 py-6 text-center">Type at least two characters to search.</p>
          ) : loading && !results ? (
            <p className="text-xs text-gray-500 py-6 text-center">Searching…</p>
          ) : error ? (
            <p className="text-xs text-red-600 py-6 text-center">{error}</p>
          ) : !hasResults ? (
            <div className="py-12 text-center">
              <h4 className="font-bold text-dark text-sm mb-1">No matches for &quot;{cleanQuery}&quot;</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">Check your spelling or try a more general keyword.</p>
            </div>
          ) : (
            <>
              {results!.products.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Products ({results!.products.length})
                  </span>
                  <div className="divide-y divide-gray-2">
                    {results!.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={onClose}
                        className="py-3 px-2 rounded-xl flex items-center justify-between hover:bg-gray-1 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-2 border border-gray-3 p-1 shrink-0 flex items-center justify-center">
                            <Image
                              src={product.image}
                              alt={product.title}
                              width={40}
                              height={40}
                              unoptimized={!product.image.startsWith("/")}
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-dark text-xs sm:text-sm group-hover:text-blue transition line-clamp-1">
                              {product.title}
                            </h4>
                            {product.category && (
                              <span className="text-[10px] text-gray-400 uppercase font-semibold">{product.category}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-extrabold text-dark text-xs sm:text-sm whitespace-nowrap pl-4">
                          {formatPrice(product.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
