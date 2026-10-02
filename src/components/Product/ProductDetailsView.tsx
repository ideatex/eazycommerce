"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { addItemToWishlist, removeItemFromWishlist } from "@/redux/features/wishlist-slice";
import ProductCard from "@/components/Common/ProductCard";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { formatPrice } from "@/utils/formatePrice";
import { apiRequest } from "@/lib/clientApi";
import type { StoreProduct, StoreReview } from "@/types/storefront";
import toast from "react-hot-toast";

interface Props {
  product: StoreProduct;
  relatedProducts: StoreProduct[];
  reviews: StoreReview[];
}

const isLocal = (src: string) => src.startsWith("/");

export default function ProductDetailsView({ product, relatedProducts, reviews }: Props) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(product.previews[0] || "/images/placeholder.svg");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(
    Math.max(0, product.productVariants.findIndex((v) => v.isDefault))
  );
  const [quantity, setQuantity] = useState(product.moq);
  const [activeTab, setActiveTab] = useState<"desc" | "spec" | "reviews" | "shipping">("desc");

  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewerTitle, setReviewerTitle] = useState("");
  const [reviewerComment, setReviewerComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const { addItem } = useCart();
  const dispatch = useDispatch<AppDispatch>();

  const wishlistItems = useAppSelector((state) => state.wishlistReducer.items);
  const isWishlisted = Object.values(wishlistItems ?? {}).some((w) => w.id === product.id);

  const currentVariant = product.productVariants[selectedVariantIndex] ?? product.productVariants[0];
  const unitPrice = currentVariant ? currentVariant.price : product.sellingPrice;
  const stockAvailable = currentVariant?.available ?? 0;
  const isOutOfStock = stockAvailable < 1;
  const minQty = Math.min(product.moq, Math.max(stockAvailable, 1));
  const listPrice = product.discountedPrice !== null ? product.price : null;

  const handleAddToCart = (): boolean => {
    if (!currentVariant || isOutOfStock) {
      toast.error("This item is currently out of stock.");
      return false;
    }
    if (quantity < product.moq) {
      toast.error(`Minimum order quantity is ${product.moq}.`);
      return false;
    }
    if (quantity > stockAvailable) {
      toast.error(`Only ${stockAvailable} units are available.`);
      return false;
    }
    addItem({
      id: currentVariant.id,
      productId: product.id,
      variantId: currentVariant.id,
      name: product.title,
      price: unitPrice,
      currency: "inr",
      image: currentVariant.image || selectedImage,
      slug: product.slug,
      availableQuantity: stockAvailable,
      moq: product.moq,
      color: currentVariant.color,
      size: currentVariant.size,
      quantity,
    });
    toast.success(`Added ${quantity} × ${product.title} to cart`);
    return true;
  };

  const handleBuyNow = () => {
    if (handleAddToCart()) router.push("/checkout");
  };

  const handleToggleWishlist = () => {
    if (isWishlisted) {
      dispatch(removeItemFromWishlist(product.id));
      toast.success("Removed from wishlist");
    } else {
      dispatch(
        addItemToWishlist({
          id: product.id,
          title: product.title,
          price: unitPrice,
          slug: product.slug,
          image: currentVariant?.image || selectedImage,
          quantity: product.quantity,
          color: currentVariant?.color || "",
        })
      );
      toast.success("Saved to wishlist");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerComment.trim()) {
      toast.error("Please write your review.");
      return;
    }
    setSubmittingReview(true);
    const res = await apiRequest("/api/reviews", {
      body: { productId: product.id, rating: reviewerRating, title: reviewerTitle, comment: reviewerComment },
    });
    setSubmittingReview(false);

    if (res.ok) {
      setReviewSubmitted(true);
      setReviewerTitle("");
      setReviewerComment("");
      toast.success("Thanks! Your review will appear once it has been approved.");
    } else if (res.status === 401) {
      toast.error("Please sign in to write a review.");
      router.push(`/signin?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="pb-32 sm:pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-10 shadow-xs mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            {/* Gallery */}
            <div className="flex flex-col-reverse sm:flex-row gap-4">
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
                {product.previews.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setSelectedImage(img)}
                    aria-label={`Show image ${idx + 1}`}
                    className={`w-20 h-20 rounded-2xl border-2 overflow-hidden bg-gray-2 shrink-0 transition-all ${
                      selectedImage === img ? "border-blue ring-2 ring-blue/20" : "border-gray-3 hover:border-gray-4"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} view ${idx + 1}`}
                      width={80}
                      height={80}
                      unoptimized={!isLocal(img)}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>

              <div className="flex-1 bg-gray-2 rounded-2xl flex items-center justify-center p-6 sm:p-10 border border-gray-3 min-h-[340px] sm:min-h-[460px] relative overflow-hidden group">
                <Image
                  src={selectedImage}
                  alt={product.title}
                  width={440}
                  height={440}
                  priority
                  unoptimized={!isLocal(selectedImage)}
                  className="max-h-[380px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute top-4 left-4">
                  <VerifiedBadge type="BUYER_PROTECTION" size="sm" />
                </span>
              </div>
            </div>

            {/* Purchase panel */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  {product.category ? (
                    <Link
                      href={`/categories/${product.category.slug}`}
                      className="inline-block px-3 py-1 bg-blue/10 text-blue font-bold text-xs rounded-full uppercase tracking-wider hover:bg-blue/20 transition-colors"
                    >
                      {product.category.title}
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400 font-mono">SKU: {currentVariant?.sku ?? product.sku}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-dark leading-tight mb-3">{product.title}</h1>

                <div className="flex items-center gap-4 pb-4 border-b border-gray-2 mb-5">
                  {product.reviews > 0 ? (
                    <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                      <span>★</span>
                      <span>{product.rating}</span>
                      <span className="text-gray-400 font-normal">
                        ({product.reviews} review{product.reviews === 1 ? "" : "s"})
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No reviews yet</span>
                  )}
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <span className={`w-2 h-2 rounded-full ${isOutOfStock ? "bg-red" : "bg-emerald-500"}`}></span>
                    <span className={isOutOfStock ? "text-red-600" : "text-emerald-600"}>
                      {isOutOfStock ? "Currently Out of Stock" : `In Stock (${stockAvailable} available)`}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-dark">{formatPrice(unitPrice)}</span>
                  {listPrice !== null && listPrice > unitPrice && (
                    <>
                      <span className="text-lg text-gray-400 line-through font-medium">{formatPrice(listPrice)}</span>
                      <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-xs font-extrabold rounded-lg border border-red-200">
                        Save {Math.round(((listPrice - unitPrice) / listPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 -mt-4 mb-6">Prices exclude GST; tax is calculated at checkout.</p>

                {product.priceTiers.length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl border border-blue/20 bg-blue/5">
                    <span className="font-bold text-dark uppercase tracking-wider text-xs block mb-2">
                      Wholesale pricing (approved B2B accounts)
                    </span>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {product.priceTiers.map((t) => (
                        <li key={t.minQuantity} className="flex justify-between">
                          <span>{t.minQuantity}+ units</span>
                          <span className="font-bold">{formatPrice(t.price)} each</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.productVariants.length > 1 && (
                  <div className="mb-6 space-y-2">
                    <span className="text-xs font-bold text-dark block">
                      Option: <span className="font-semibold text-blue">{currentVariant?.title}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.productVariants.map((v, idx) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVariantIndex(idx);
                            setQuantity(Math.min(Math.max(quantity, product.moq), Math.max(v.available, product.moq)));
                            if (v.image) setSelectedImage(v.image);
                          }}
                          disabled={v.available < 1}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:line-through ${
                            selectedVariantIndex === idx
                              ? "border-blue bg-blue text-white shadow-xs"
                              : "border-gray-3 bg-gray-1 text-dark hover:border-gray-4"
                          }`}
                        >
                          {v.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-xs font-bold text-dark">Quantity:</span>
                  <div className="inline-flex items-center border border-gray-3 rounded-xl bg-gray-1 overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
                      disabled={quantity <= minQty}
                      aria-label="Decrease quantity"
                      className="px-3 py-1.5 text-gray-600 hover:text-dark font-bold text-sm disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-bold text-dark min-w-10 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(stockAvailable, quantity + 1))}
                      disabled={quantity >= stockAvailable}
                      aria-label="Increase quantity"
                      className="px-3 py-1.5 text-gray-600 hover:text-dark font-bold text-sm disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    {product.moq > 1 ? `Min ${product.moq} • ` : ""}Max: {stockAvailable} units
                  </span>
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-2 mb-6">
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex-1 py-3.5 px-6 rounded-2xl font-extrabold text-sm text-white bg-blue hover:bg-blue-dark active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                  >
                    <span>⚡</span>
                    <span>{isOutOfStock ? "Out of Stock" : "Buy Now"}</span>
                  </button>
                  <button
                    onClick={() => handleAddToCart()}
                    disabled={isOutOfStock}
                    className="flex-1 py-3.5 px-6 rounded-2xl font-extrabold text-sm text-dark bg-gray-2 border border-gray-3 hover:bg-gray-3 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Add to Cart</span>
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    className={`p-3.5 rounded-2xl border transition-colors flex items-center justify-center ${
                      isWishlisted
                        ? "border-red bg-red-50 text-red"
                        : "border-gray-3 bg-white text-gray-500 hover:text-red hover:border-red/40"
                    }`}
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-10 shadow-xs mb-14">
          <div role="tablist" className="flex border-b border-gray-2 gap-6 overflow-x-auto">
            {[
              { id: "desc", label: "Product Overview" },
              { id: "spec", label: "Specifications" },
              { id: "shipping", label: "Shipping & Returns" },
              { id: "reviews", label: `Customer Reviews (${reviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`pb-4 text-sm font-bold transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id ? "text-blue border-b-2 border-blue" : "text-gray-400 hover:text-dark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pt-6">
            {activeTab === "desc" && (
              <div className="max-w-none text-gray-600 text-sm leading-relaxed space-y-4 whitespace-pre-line">
                {product.shortDescription && <p className="font-semibold text-dark">{product.shortDescription}</p>}
                {product.description && <p>{product.description}</p>}
              </div>
            )}

            {activeTab === "spec" && (
              <div className="divide-y divide-gray-2 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400 font-medium">SKU</span>
                  <span className="font-mono font-bold text-dark">{product.sku}</span>
                </div>
                {product.category && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 font-medium">Category</span>
                    <span className="font-bold text-dark">{product.category.title}</span>
                  </div>
                )}
                {product.moq > 1 && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 font-medium">Minimum order</span>
                    <span className="font-bold text-dark">{product.moq} units</span>
                  </div>
                )}
                {product.additionalInfo.map((info) => (
                  <div key={info.name} className="py-2.5 flex justify-between">
                    <span className="text-gray-400 font-medium">{info.name}</span>
                    <span className="font-bold text-dark">{info.description}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                <div className="p-4 bg-blue/5 rounded-xl border border-blue/20">
                  <h4 className="font-bold text-dark text-sm mb-1">Returns</h4>
                  <p>
                    If you receive an item that is defective, damaged in transit or not as described, you can request a
                    return from the order page under My Orders once it has been delivered.
                  </p>
                </div>
                <div className="p-4 bg-gray-1 rounded-xl border border-gray-3">
                  <h5 className="font-bold text-dark text-xs mb-1">Delivery</h5>
                  <p>Shipping is calculated at checkout. Orders over ₹999 (before tax) ship free.</p>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-8">
                {reviewSubmitted ? (
                  <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800">
                    Thank you. Your review has been submitted and will be published after moderation.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="p-5 bg-gray-1 rounded-2xl border border-gray-3 space-y-4">
                    <h4 className="font-bold text-dark text-sm">Write a review</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="review-title" className="block text-xs font-semibold text-gray-600 mb-1">Headline (optional)</label>
                        <input
                          id="review-title"
                          type="text"
                          maxLength={150}
                          value={reviewerTitle}
                          onChange={(e) => setReviewerTitle(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-3 bg-white text-dark text-xs focus:outline-none focus:border-blue"
                        />
                      </div>
                      <div>
                        <label htmlFor="review-rating" className="block text-xs font-semibold text-gray-600 mb-1">Rating</label>
                        <select
                          id="review-rating"
                          value={reviewerRating}
                          onChange={(e) => setReviewerRating(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-3 bg-white text-dark text-xs focus:outline-none focus:border-blue"
                        >
                          <option value={5}>★★★★★ (5/5) Excellent</option>
                          <option value={4}>★★★★☆ (4/5) Very Good</option>
                          <option value={3}>★★★☆☆ (3/5) Average</option>
                          <option value={2}>★★☆☆☆ (2/5) Below Average</option>
                          <option value={1}>★☆☆☆☆ (1/5) Poor</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="review-comment" className="block text-xs font-semibold text-gray-600 mb-1">Your review</label>
                      <textarea
                        id="review-comment"
                        rows={3}
                        maxLength={2000}
                        value={reviewerComment}
                        onChange={(e) => setReviewerComment(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-3 bg-white text-dark text-xs focus:outline-none focus:border-blue"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="py-2.5 px-6 rounded-xl bg-dark text-white text-xs font-bold hover:bg-dark-2 transition-colors disabled:opacity-50"
                    >
                      {submittingReview ? "Submitting…" : "Submit review"}
                    </button>
                    <p className="text-[11px] text-gray-400">You need to be signed in. Reviews are published after approval.</p>
                  </form>
                )}

                {reviews.length === 0 ? (
                  <p className="text-xs text-gray-500">No reviews yet. Be the first to review this product.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-xl border border-gray-2 bg-white space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-dark text-xs">
                            {rev.name}
                            {rev.isVerifiedPurchase && (
                              <span className="ml-2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                Verified purchase
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(rev.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                          </span>
                        </div>
                        <div className="text-amber-500 text-xs" aria-label={`${rev.rating} out of 5`}>
                          {"★".repeat(rev.rating)}
                          {"☆".repeat(5 - rev.rating)}
                        </div>
                        {rev.title && <p className="text-xs font-semibold text-dark">{rev.title}</p>}
                        <p className="text-xs text-gray-600">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-dark mb-6">You may also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky purchase bar */}
      <aside
        aria-label="Quick purchase actions"
        className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-3 px-4 py-3 pb-safe z-40 md:hidden shadow-lg flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-11 h-11 rounded-xl bg-gray-2 border border-gray-3 shrink-0 flex items-center justify-center p-1 overflow-hidden">
            <Image
              src={selectedImage}
              alt={product.title}
              width={40}
              height={40}
              unoptimized={!isLocal(selectedImage)}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="overflow-hidden">
            <span className="font-bold text-xs text-dark truncate block max-w-[130px] sm:max-w-[200px]">{product.title}</span>
            <span className="font-black text-sm text-blue block">{formatPrice(unitPrice)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleAddToCart()}
            disabled={isOutOfStock}
            className="px-4 py-2.5 rounded-xl bg-gray-2 border border-gray-3 text-dark text-xs font-bold disabled:opacity-50 active:scale-95 transition"
          >
            Add
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-white bg-blue hover:bg-blue-dark active:scale-[0.98] transition disabled:opacity-50 shadow-xs"
          >
            {isOutOfStock ? "Sold Out" : "Buy Now"}
          </button>
        </div>
      </aside>
    </div>
  );
}
