"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ProductCard from "@/components/Common/ProductCard";
import type { StoreCategory, StoreProduct } from "@/types/storefront";

interface Props {
  products: StoreProduct[];
  categories: StoreCategory[];
  /** Category this page is scoped to (server-filtered); "all" for the full catalogue. */
  initialCategory?: string;
  /** Total published products, used for the "All" count when the list is category-scoped. */
  totalCount?: number;
  initialSort?: string;
  initialSearch?: string;
}

export default function ShopWithSidebarContent({
  products,
  categories,
  initialCategory = "all",
  totalCount,
  initialSort = "default",
  initialSearch = "",
}: Props) {
  const selectedCategory = initialCategory;
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState(initialSort);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const categoryTitle = (slug: string) => categories.find((c) => c.slug === slug)?.name;

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search filter
      if (
        searchQuery &&
        !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "all" && p.category?.slug !== selectedCategory) {
        return false;
      }

      // In stock filter
      if (inStockOnly && p.quantity < 1) {
        return false;
      }

      // Price filter
      const price = p.sellingPrice;
      if (selectedPriceRange === "under-500" && price >= 500) return false;
      if (selectedPriceRange === "500-2000" && (price < 500 || price > 2000)) return false;
      if (selectedPriceRange === "2000-10000" && (price < 2000 || price > 10000)) return false;
      if (selectedPriceRange === "above-10000" && price <= 10000) return false;

      // Rating filter
      if (minRating > 0 && p.rating < minRating) return false;

      return true;
    }).sort((a, b) => {
      const priceA = a.sellingPrice;
      const priceB = b.sellingPrice;

      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "popular") return b.reviews - a.reviews;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [products, selectedCategory, selectedPriceRange, minRating, inStockOnly, sortBy, searchQuery]);

  const resetFilters = () => {
    setSelectedPriceRange("all");
    setMinRating(0);
    setInStockOnly(false);
    setSortBy("default");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedPriceRange !== "all" ||
    minRating > 0 ||
    inStockOnly ||
    searchQuery.trim() !== "";

  // Render Sidebar Filter Content (Shared between desktop and mobile drawer)
  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div className="bg-white p-5 rounded-2xl border border-gray-3 shadow-xs">
        <h3 className="font-bold text-dark text-sm mb-3.5 pb-2 border-b border-gray-2 uppercase tracking-wider text-[11px] text-gray-500">
          Categories
        </h3>
        <ul className="space-y-1.5 text-sm">
          <li>
            <Link
              href="/shop-with-sidebar"
              className={`w-full text-left py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                selectedCategory === "all" ? "bg-blue text-white" : "text-gray-600 hover:bg-gray-2"
              }`}
            >
              <span>All Categories</span>
              <span className="text-[11px] opacity-80">{totalCount ?? products.length}</span>
            </Link>
          </li>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <li key={cat.slug}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className={`w-full text-left py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                    isSelected ? "bg-blue text-white" : "text-gray-600 hover:bg-gray-2"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[11px] opacity-80">{cat.productCount}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Price Range */}
      <div className="bg-white p-5 rounded-2xl border border-gray-3 shadow-xs">
        <h3 className="font-bold text-dark text-sm mb-3.5 pb-2 border-b border-gray-2 uppercase tracking-wider text-[11px] text-gray-500">
          Price Range
        </h3>
        <div className="space-y-2 text-xs">
          {[
            { id: "all", label: "All Prices" },
            { id: "under-500", label: "Under ₹500" },
            { id: "500-2000", label: "₹500 to ₹2,000" },
            { id: "2000-10000", label: "₹2,000 to ₹10,000" },
            { id: "above-10000", label: "Above ₹10,000" },
          ].map((range) => (
            <label
              key={range.id}
              className="flex items-center gap-2.5 text-gray-600 hover:text-dark cursor-pointer select-none"
            >
              <input
                type="radio"
                name="priceRange"
                checked={selectedPriceRange === range.id}
                onChange={() => setSelectedPriceRange(range.id)}
                className="w-3.5 h-3.5 text-blue border-gray-3 focus:ring-blue cursor-pointer"
              />
              <span>{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability & Rating */}
      <div className="bg-white p-5 rounded-2xl border border-gray-3 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-dark text-sm mb-3 pb-2 border-b border-gray-2 uppercase tracking-wider text-[11px] text-gray-500">
            Availability
          </h3>
          <label className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-dark cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue border-gray-3 focus:ring-blue cursor-pointer"
            />
            <span className="font-medium">In-Stock Only</span>
          </label>
        </div>

        <div>
          <h3 className="font-bold text-dark text-sm mb-3 pb-2 border-b border-gray-2 uppercase tracking-wider text-[11px] text-gray-500">
            Customer Rating
          </h3>
          <div className="space-y-1.5 text-xs">
            {[4, 3, 0].map((star) => (
              <label
                key={star}
                className="flex items-center gap-2 text-gray-600 hover:text-dark cursor-pointer select-none"
              >
                <input
                  type="radio"
                  name="ratingFilter"
                  checked={minRating === star}
                  onChange={() => setMinRating(star)}
                  className="w-3.5 h-3.5 text-blue border-gray-3 focus:ring-blue cursor-pointer"
                />
                <span>{star === 0 ? "Any Rating" : `★ ${star}.0 & above`}</span>
              </label>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="w-full py-2 px-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-center border border-red-200 mt-2"
          >
            Reset All Filters
          </button>
        )}
      </div>
    </div>
  );

  return (
    <section className="pb-20 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-3 shadow-xs mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue uppercase tracking-wider">
                Catalogue
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-emerald-600 font-semibold">100% Authentic Guaranteed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark">
              {selectedCategory === "all"
                ? "All Products & Equipment"
                : categoryTitle(selectedCategory) || "Products"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing <span className="font-bold text-dark">{filteredProducts.length}</span> verified results
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-60 pl-9 pr-4 py-2 text-xs border border-gray-3 rounded-xl focus:outline-none focus:border-blue bg-gray-1 text-dark"
              />
              <svg
                className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 text-xs border border-gray-3 rounded-xl bg-white focus:outline-none focus:border-blue text-dark font-semibold cursor-pointer"
            >
              <option value="default">Default: Featured</option>
              <option value="popular">Popularity</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center border border-gray-3 rounded-xl overflow-hidden bg-gray-1 p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                title="Grid View"
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewMode === "grid" ? "bg-white text-blue shadow-2xs" : "text-gray-400 hover:text-dark"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="List View"
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewMode === "list" ? "bg-white text-blue shadow-2xs" : "text-gray-400 hover:text-dark"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden py-2 px-3 bg-blue text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs text-gray-400 font-semibold">Active:</span>
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue/10 text-blue rounded-full text-xs font-bold">
                {categoryTitle(selectedCategory) || selectedCategory}
                <Link href="/shop-with-sidebar" aria-label="Clear category">×</Link>
              </span>
            )}
            {selectedPriceRange !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-2 text-dark rounded-full text-xs font-bold">
                Price: {selectedPriceRange}
                <button onClick={() => setSelectedPriceRange("all")}>×</button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                In-Stock Only
                <button onClick={() => setInStockOnly(false)}>×</button>
              </span>
            )}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
                ★ {minRating}+ Stars
                <button onClick={() => setMinRating(0)}>×</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-2 text-dark rounded-full text-xs font-bold">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery("")}>×</button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-red-500 font-bold hover:underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Grid + Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop Left Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <FilterPanel />
          </div>

          {/* Product Grid Area */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-3 p-12 text-center shadow-xs">
                <div className="w-16 h-16 rounded-full bg-gray-2 text-gray-400 flex items-center justify-center mx-auto mb-4 text-2xl">
                  🔍
                </div>
                <h3 className="text-lg font-bold text-dark mb-1">No Matching Products Found</h3>
                <p className="text-xs text-gray-500 mb-6 max-w-md mx-auto">
                  We couldn&apos;t find any products matching your current combination of filters. Try clearing some filters or searching for another term.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition-colors shadow-xs"
                >
                  Clear All Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="default"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="horizontal"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end lg:hidden">
          <div className="w-full max-w-xs bg-gray-1 h-full p-6 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-3">
              <h2 className="text-base font-bold text-dark">Filter Products</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="text-gray-400 hover:text-dark p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <FilterPanel />
            <div className="pt-6">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-blue text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Apply Filters ({filteredProducts.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
