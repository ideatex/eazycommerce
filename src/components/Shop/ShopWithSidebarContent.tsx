"use client";

import { useState, useMemo } from "react";
import ProductCard from "@/components/Common/ProductCard";
import { mockProducts, mockCategories } from "@/data/mockProducts";
import { initialOrganizations } from "@/lib/b2b2c/mockVanigamData";
import { Product } from "@/types/product";

interface Props {
  initialProducts?: Product[];
  initialCategory?: string;
  initialSort?: string;
}

export default function ShopWithSidebarContent({
  initialCategory = "all",
  initialSort = "default",
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSeller, setSelectedSeller] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState(initialSort);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sellers available in B2B2C marketplace
  const sellers = initialOrganizations.filter((o) => o.organizationType !== "PLATFORM");

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((p) => {
      // Search filter
      if (
        searchQuery &&
        !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "all" && p.category.slug !== selectedCategory) {
        return false;
      }

      // In stock filter
      if (inStockOnly && p.quantity < 1) {
        return false;
      }

      // Price filter
      const price = p.discountedPrice || p.price;
      if (selectedPriceRange === "under-50" && price >= 50) return false;
      if (selectedPriceRange === "50-100" && (price < 50 || price > 100)) return false;
      if (selectedPriceRange === "100-500" && (price < 100 || price > 500)) return false;
      if (selectedPriceRange === "above-500" && price <= 500) return false;

      // Rating filter
      if (minRating > 0 && p.rating < minRating) return false;

      return true;
    }).sort((a, b) => {
      const priceA = a.discountedPrice || a.price;
      const priceB = b.discountedPrice || b.price;

      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "popular") return b.reviews - a.reviews;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [selectedCategory, selectedPriceRange, minRating, inStockOnly, sortBy, searchQuery]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedSeller("all");
    setSelectedPriceRange("all");
    setMinRating(0);
    setInStockOnly(false);
    setSortBy("default");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedSeller !== "all" ||
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
            <button
              onClick={() => setSelectedCategory("all")}
              className={`w-full text-left py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                selectedCategory === "all" ? "bg-blue text-white" : "text-gray-600 hover:bg-gray-2"
              }`}
            >
              <span>All Categories</span>
              <span className="text-[11px] opacity-80">{mockProducts.length}</span>
            </button>
          </li>
          {mockCategories.map((cat) => {
            const count = mockProducts.filter((p) => p.category.slug === cat.slug).length;
            const isSelected = selectedCategory === cat.slug;
            return (
              <li key={cat.slug}>
                <button
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full text-left py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                    isSelected ? "bg-blue text-white" : "text-gray-600 hover:bg-gray-2"
                  }`}
                >
                  <span>{cat.title}</span>
                  <span className="text-[11px] opacity-80">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Verified Sellers & Stores */}
      <div className="bg-white p-5 rounded-2xl border border-gray-3 shadow-xs">
        <h3 className="font-bold text-dark text-sm mb-3.5 pb-2 border-b border-gray-2 uppercase tracking-wider text-[11px] text-gray-500">
          Verified Stores
        </h3>
        <ul className="space-y-1.5 text-xs font-medium">
          <li>
            <button
              onClick={() => setSelectedSeller("all")}
              className={`w-full text-left py-1.5 px-3 rounded-lg transition-colors flex items-center justify-between ${
                selectedSeller === "all" ? "bg-blue text-white font-bold" : "text-gray-600 hover:bg-gray-2"
              }`}
            >
              <span>All Partner Stores</span>
            </button>
          </li>
          {sellers.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => setSelectedSeller(s.name)}
                className={`w-full text-left py-1.5 px-3 rounded-lg transition-colors flex items-center justify-between ${
                  selectedSeller === s.name ? "bg-blue text-white font-bold" : "text-gray-600 hover:bg-gray-2"
                }`}
              >
                <span>{s.name}</span>
                <span className="text-[10px] uppercase opacity-75">{s.organizationType === "MANUFACTURER" ? "Brand" : "Store"}</span>
              </button>
            </li>
          ))}
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
            { id: "under-50", label: "Under $50" },
            { id: "50-100", label: "$50 to $100" },
            { id: "100-500", label: "$100 to $500" },
            { id: "above-500", label: "Above $500" },
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
                Marketplace Catalog
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-emerald-600 font-semibold">100% Authentic Guaranteed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark">
              {selectedCategory === "all"
                ? "All Products & Equipment"
                : mockCategories.find((c) => c.slug === selectedCategory)?.title || "Products"}
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
                {mockCategories.find((c) => c.slug === selectedCategory)?.title || selectedCategory}
                <button onClick={() => setSelectedCategory("all")}>×</button>
              </span>
            )}
            {selectedSeller !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                Store: {selectedSeller}
                <button onClick={() => setSelectedSeller("all")}>×</button>
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
                    sellerName="Velocity Tech Store"
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
                    sellerName="Velocity Tech Store"
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
