"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { formatPrice } from "@/utils/formatePrice";
import { calculateDiscountPercentage } from "@/utils/calculateDiscountPercentage";
import { useCart } from "@/hooks/useCart";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addItemToWishlist, removeItemFromWishlist } from "@/redux/features/wishlist-slice";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import toast from "react-hot-toast";

export interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact" | "horizontal" | "featured";
  sellerName?: string;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = "default",
  sellerName = "Velocity Tech Store",
  className = "",
}) => {
  const { addItem, cartDetails } = useCart();
  const { openModal } = useModalContext();
  const dispatch = useDispatch<AppDispatch>();

  const wishlistItems = useAppSelector((state) => state.wishlistReducer.items);
  const isWishlisted = Object.values(wishlistItems ?? {}).some((w) => w.id === product.id);
  const isAlreadyInCart = Object.values(cartDetails ?? {}).some((item) => item.id === product.id);

  const defaultVariant = product.productVariants?.find((v) => v.isDefault) || product.productVariants?.[0];
  const displayImage = defaultVariant?.image || (product as any).previews?.[0] || (product as any).thumbnails?.[0] || "/images/products/product-1-bg-1.png";

  const effectivePrice = product.discountedPrice && product.discountedPrice > 0 ? product.discountedPrice : product.price;
  const isOutOfStock = product.quantity < 1;
  const discountPercent = product.discountedPrice && product.discountedPrice > 0
    ? calculateDiscountPercentage(product.discountedPrice, product.price)
    : 0;

  const handleQuickView = () => {
    const serializable = {
      ...product,
      updatedAt: product.updatedAt instanceof Date ? product.updatedAt.toISOString() : product.updatedAt,
    };
    dispatch(updateQuickView(serializable as any));
    openModal();
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error("This item is currently out of stock");
      return;
    }
    addItem({
      id: product.id,
      name: product.title,
      price: effectivePrice,
      currency: "usd",
      image: displayImage,
      slug: product.slug,
      availableQuantity: product.quantity,
      color: defaultVariant?.color || "",
      size: defaultVariant?.size || "",
      organizationId: "org-seller-velocity",
      organizationName: sellerName,
    } as any);
    toast.success(`Added ${product.title} to cart`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      dispatch(removeItemFromWishlist(product.id));
      toast.success("Removed from wishlist");
    } else {
      dispatch(
        addItemToWishlist({
          id: product.id,
          title: product.title,
          slug: product.slug,
          image: displayImage,
          price: effectivePrice,
          quantity: product.quantity,
          color: defaultVariant?.color || "",
        })
      );
      toast.success("Saved to wishlist");
    }
  };

  // 1. Horizontal Variant (Listings / Search)
  if (variant === "horizontal") {
    return (
      <div className={`bg-white rounded-2xl border border-gray-3 p-4 flex flex-col sm:flex-row gap-5 hover:border-blue/40 hover:shadow-sm transition-all duration-200 group ${className}`}>
        <div className="relative w-full sm:w-44 h-44 rounded-xl bg-gray-2 border border-gray-3 flex items-center justify-center p-3 shrink-0 overflow-hidden">
          <Link href={`/products/${product.slug}`} className="w-full h-full flex items-center justify-center">
            <Image
              src={displayImage}
              alt={product.title}
              width={160}
              height={160}
              className="max-h-36 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          {discountPercent > 0 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold text-white bg-blue rounded-md shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {(product as any).category?.title || "Electronics"}
              </span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {sellerName}
              </span>
            </div>

            <h3 className="font-bold text-dark text-base hover:text-blue transition-colors line-clamp-1 mb-1.5">
              <Link href={`/products/${product.slug}`}>{product.title}</Link>
            </h3>

            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
              {(product as any).shortDescription || (product as any).description || "High-performance gear engineered for reliability and daily durability."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-dark">
                {formatPrice(effectivePrice)}
              </span>
              {product.discountedPrice && product.discountedPrice > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickView}
                title="Quick View"
                className="p-2 rounded-xl border border-gray-3 text-gray-500 hover:text-blue hover:border-blue hover:bg-blue/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue hover:bg-blue-dark transition-colors disabled:opacity-50 shadow-xs"
              >
                {isOutOfStock ? "Out of Stock" : isAlreadyInCart ? "In Cart (Add +1)" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Compact Variant (Widgets / Carousels / Mini Recommendations)
  if (variant === "compact") {
    return (
      <div className={`bg-white rounded-xl border border-gray-3 p-3 hover:border-blue/40 transition-all duration-200 group ${className}`}>
        <div className="relative w-full h-36 rounded-lg bg-gray-2 flex items-center justify-center p-2 mb-2.5 overflow-hidden">
          <Link href={`/products/${product.slug}`} className="w-full h-full flex items-center justify-center">
            <Image
              src={displayImage}
              alt={product.title}
              width={120}
              height={120}
              className="max-h-28 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        </div>
        <h4 className="text-xs font-bold text-dark line-clamp-1 mb-1 hover:text-blue transition-colors">
          <Link href={`/products/${product.slug}`}>{product.title}</Link>
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-dark">{formatPrice(effectivePrice)}</span>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="text-[11px] font-bold text-blue hover:underline"
          >
            {isOutOfStock ? "Sold Out" : "+ Cart"}
          </button>
        </div>
      </div>
    );
  }

  // 3. Default & Featured Grid Variant
  return (
    <div className={`group bg-white rounded-2xl border border-gray-3 p-4 flex flex-col justify-between hover:border-blue/40 hover:shadow-md transition-all duration-200 relative ${className}`}>
      {/* Top Image Container */}
      <div className="relative w-full aspect-square rounded-xl bg-gray-2 border border-gray-2 flex items-center justify-center p-4 mb-4 overflow-hidden">
        <Link href={`/products/${product.slug}`} className="w-full h-full flex items-center justify-center">
          <Image
            src={displayImage}
            alt={product.title}
            width={240}
            height={240}
            className="max-h-52 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white bg-red rounded-lg shadow-xs">
              Out of Stock
            </span>
          ) : discountPercent > 0 ? (
            <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white bg-blue rounded-lg shadow-xs">
              {discountPercent}% OFF
            </span>
          ) : null}
        </div>

        {/* Wishlist Floating Button */}
        <button
          onClick={handleToggleWishlist}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-xs z-10 ${
            isWishlisted
              ? "bg-red text-white"
              : "bg-white/90 text-gray-500 hover:text-red hover:bg-white"
          }`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Quick View Hover Trigger */}
        <button
          onClick={handleQuickView}
          className="absolute bottom-2.5 inset-x-4 py-2 rounded-xl text-xs font-bold bg-white/95 text-dark shadow-sm border border-gray-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:bg-blue hover:text-white flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Quick Preview
        </button>
      </div>

      {/* Content Meta */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* Seller / Verified Partner Context */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider line-clamp-1">
              {(product as any).category?.title || "Electronics"}
            </span>
            <span className="text-[10px] font-semibold text-blue flex items-center gap-0.5 line-clamp-1">
              ✓ {sellerName}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-dark text-sm leading-snug line-clamp-2 hover:text-blue transition-colors mb-2">
            <Link href={`/products/${product.slug}`}>{product.title}</Link>
          </h3>
        </div>

        <div>
          {/* Price & Stock Row */}
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-dark">
                {formatPrice(effectivePrice)}
              </span>
              {product.discountedPrice && product.discountedPrice > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <span className={`text-[11px] font-medium ${isOutOfStock ? "text-red-600" : "text-emerald-600"}`}>
              {isOutOfStock ? "Out of stock" : "In stock"}
            </span>
          </div>

          {/* Primary CTA */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
              isOutOfStock
                ? "bg-gray-2 text-gray-400 cursor-not-allowed"
                : isAlreadyInCart
                ? "bg-blue/10 text-blue border border-blue/30 hover:bg-blue hover:text-white"
                : "bg-blue text-white hover:bg-blue-dark shadow-xs"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {isOutOfStock ? "Unavailable" : isAlreadyInCart ? "Added (Add +1)" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
