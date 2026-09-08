"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { addItemToWishlist, removeItemFromWishlist } from "@/redux/features/wishlist-slice";
import { MockProductItem } from "@/data/mockProducts";
import ProductCard from "@/components/Common/ProductCard";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { formatPrice } from "@/utils/formatePrice";
import toast from "react-hot-toast";

import { actionSubmitReview } from "@/actions/vanigamActions";
import { initialProductOffers, VanigamProductOffer } from "@/lib/b2b2c/mockVanigamData";

interface Props {
  product: MockProductItem;
  relatedProducts: MockProductItem[];
}

export default function ProductDetailsView({ product, relatedProducts }: Props) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(
    product.previews[0] || product.thumbnails[0] || "/images/products/product-1-bg-1.png"
  );
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "spec" | "reviews" | "shipping">("desc");

  // Multi-seller offers for this product
  const productOffers = initialProductOffers.filter(
    (o) => o.productId === product.id || o.productTitle.toLowerCase().includes(product.title.toLowerCase().slice(0, 5))
  );

  const [selectedOffer, setSelectedOffer] = useState<VanigamProductOffer | null>(
    productOffers.length > 0 ? productOffers[0] : null
  );

  // Review state
  const [reviewsList, setReviewsList] = useState([
    {
      name: "Marcus Johnson",
      rating: 5,
      date: "February 18, 2026",
      comment: "Exceptional build quality and finish. Exceeded all my expectations for this price range!",
    },
    {
      name: "Emily Davies",
      rating: 4,
      date: "January 30, 2026",
      comment: "Super fast shipping from the verified partner and works right out of the box.",
    },
  ]);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewerComment, setReviewerComment] = useState("");

  const { addItem } = useCart();
  const dispatch = useDispatch<AppDispatch>();

  const wishlistItems = useAppSelector((state) => state.wishlistReducer.items);
  const isWishlisted = Object.values(wishlistItems ?? {}).some((w) => w.id === product.id);

  const currentVariant = product.productVariants[selectedVariantIndex] || product.productVariants[0];
  const effectivePrice = selectedOffer ? selectedOffer.sellingPrice : (product.discountedPrice || product.price);
  const effectiveSeller = selectedOffer ? selectedOffer.organizationName : "Velocity Tech Store";
  const stockAvailable = selectedOffer ? selectedOffer.stockQuantity : product.quantity;
  const isOutOfStock = stockAvailable < 1;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This item is currently out of stock.");
      return;
    }
    addItem({
      id: product.id,
      name: product.title,
      price: effectivePrice,
      currency: "usd",
      image: currentVariant?.image || selectedImage,
      slug: product.slug,
      availableQuantity: stockAvailable,
      color: currentVariant?.color || "",
      size: currentVariant?.size || "",
      quantity: quantity,
      organizationId: selectedOffer?.organizationId || "org-seller-velocity",
      organizationName: effectiveSeller,
    } as any);
    toast.success(`Added ${quantity}x to cart (Fulfilled by ${effectiveSeller})`);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      toast.error("This item is currently out of stock.");
      return;
    }
    handleAddToCart();
    router.push("/checkout");
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
          price: effectivePrice,
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
    if (!reviewerName || !reviewerComment) {
      toast.error("Please fill in your name and comment.");
      return;
    }

    try {
      await actionSubmitReview({
        productId: product.id,
        authorName: reviewerName,
        comment: reviewerComment,
        rating: reviewerRating,
      });

      setReviewsList([
        {
          name: reviewerName,
          rating: reviewerRating,
          date: "Just now",
          comment: reviewerComment,
        },
        ...reviewsList,
      ]);
      setReviewerName("");
      setReviewerComment("");
      toast.success("Verified customer review submitted!");
    } catch {
      toast.success("Review received.");
    }
  };

  return (
    <div className="pb-32 sm:pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        {/* Main Product Showcase Box */}
        <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-10 shadow-xs mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            {/* Gallery Left Column */}
            <div className="flex flex-col-reverse sm:flex-row gap-4">
              {/* Thumbnails */}
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
                {product.previews.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-20 rounded-2xl border-2 overflow-hidden bg-gray-2 shrink-0 transition-all ${
                      selectedImage === img
                        ? "border-blue ring-2 ring-blue/20"
                        : "border-gray-3 hover:border-gray-4"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} view ${idx + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>

              {/* Main Image Display */}
              <div className="flex-1 bg-gray-2 rounded-2xl flex items-center justify-center p-6 sm:p-10 border border-gray-3 min-h-[340px] sm:min-h-[460px] relative overflow-hidden group">
                <Image
                  src={selectedImage}
                  alt={product.title}
                  width={440}
                  height={440}
                  priority
                  className="max-h-[380px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute top-4 left-4">
                  <VerifiedBadge type="BUYER_PROTECTION" size="sm" />
                </span>
              </div>
            </div>

            {/* Product Purchase Information Right Column */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Category & Verified Partner Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <Link
                    href={`/categories/${product.category.slug}`}
                    className="inline-block px-3 py-1 bg-blue/10 text-blue font-bold text-xs rounded-full uppercase tracking-wider hover:bg-blue/20 transition-colors"
                  >
                    {product.category.title}
                  </Link>
                  <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-dark leading-tight mb-3">
                  {product.title}
                </h1>

                {/* Rating & Stock Status */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-2 mb-5">
                  <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                    <span>★</span>
                    <span>{product.rating}</span>
                    <span className="text-gray-400 font-normal">
                      ({product.reviews + reviewsList.length - 2} verified reviews)
                    </span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <span
                      className={`w-2 h-2 rounded-full ${isOutOfStock ? "bg-red" : "bg-emerald-500"}`}
                    ></span>
                    <span className={isOutOfStock ? "text-red-600" : "text-emerald-600"}>
                      {isOutOfStock ? "Currently Out of Stock" : `In Stock (${stockAvailable} available)`}
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-dark">
                    {formatPrice(effectivePrice)}
                  </span>
                  {product.discountedPrice && (
                    <>
                      <span className="text-lg text-gray-400 line-through font-medium">
                        {formatPrice(product.price)}
                      </span>
                      <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-xs font-extrabold rounded-lg border border-red-200">
                        Save {Math.round(((product.price - effectivePrice) / product.price) * 100)}%
                      </span>
                    </>
                  )}
                </div>

                {/* Available Marketplace Sellers / Offers Selection */}
                <div className="mb-6 p-4 rounded-2xl border border-blue/20 bg-blue/5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-dark uppercase tracking-wider">
                      Marketplace Seller Offers ({productOffers.length || 1})
                    </span>
                    <span className="text-xs text-blue font-semibold">
                      Fulfilled by {effectiveSeller}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {productOffers.length > 0 ? (
                      productOffers.map((offer) => (
                        <div
                          key={offer.id}
                          onClick={() => setSelectedOffer(offer)}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            selectedOffer?.id === offer.id
                              ? "border-blue bg-white shadow-xs ring-2 ring-blue/20"
                              : "border-gray-3 bg-white/70 hover:bg-white"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-dark">{offer.organizationName}</span>
                              <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                                ✓ Verified Partner
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1 flex gap-3">
                              <span>Dispatch: {offer.leadTimeDays === 1 ? "Within 24 Hours" : `${offer.leadTimeDays} Business Days`}</span>
                              <span>•</span>
                              <span>In Stock: {offer.stockQuantity} units</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-extrabold text-dark block">
                              {formatPrice(offer.sellingPrice)}
                            </span>
                            <span className="text-[10px] text-blue font-bold">
                              {selectedOffer?.id === offer.id ? "Selected Offer" : "Select Offer"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl border border-gray-3 bg-white text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-dark">Velocity Tech Store</span>
                          <span className="block text-[11px] text-gray-500">Authorized Partner Direct</span>
                        </div>
                        <span className="font-extrabold text-dark text-sm">{formatPrice(effectivePrice)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Variants Selection */}
                {product.productVariants && product.productVariants.length > 1 && (
                  <div className="mb-6 space-y-2">
                    <span className="text-xs font-bold text-dark block">
                      Color / Option: <span className="font-semibold text-blue">{currentVariant?.color}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.productVariants.map((v, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedVariantIndex(idx);
                            if (v.image) setSelectedImage(v.image);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            selectedVariantIndex === idx
                              ? "border-blue bg-blue text-white shadow-xs"
                              : "border-gray-3 bg-gray-1 text-dark hover:border-gray-4"
                          }`}
                        >
                          {v.color || `Option ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-xs font-bold text-dark">Quantity:</span>
                  <div className="inline-flex items-center border border-gray-3 rounded-xl bg-gray-1 overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-1.5 text-gray-600 hover:text-dark font-bold text-sm disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-bold text-dark min-w-10 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(stockAvailable, quantity + 1))}
                      disabled={quantity >= stockAvailable}
                      className="px-3 py-1.5 text-gray-600 hover:text-dark font-bold text-sm disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    Max: {stockAvailable} units
                  </span>
                </div>
              </div>

              {/* Conversion CTA Hierarchy: BUY NOW (Primary) + ADD TO CART (Secondary) + WISHLIST */}
              <div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-2 mb-6">
                  {/* BUY NOW (Primary High Emphasis) */}
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex-1 py-3.5 px-6 rounded-2xl font-extrabold text-sm text-white bg-blue hover:bg-blue-dark active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                  >
                    <span>⚡</span>
                    <span>{isOutOfStock ? "Out of Stock" : "Buy Now"}</span>
                  </button>

                  {/* ADD TO CART (Secondary Distinct) */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex-1 py-3.5 px-6 rounded-2xl font-extrabold text-sm text-dark bg-gray-2 border border-gray-3 hover:bg-gray-3 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Add to Cart</span>
                  </button>

                  {/* WISHLIST BUTTON */}
                  <button
                    onClick={handleToggleWishlist}
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
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

                {/* Trust Badges Bar */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-1 rounded-2xl border border-gray-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Direct Partner Warranty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue font-bold">✓</span>
                    <span>30-Day Money Back Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600 font-bold">✓</span>
                    <span>Escrow Protected Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 font-bold">✓</span>
                    <span>Tracked & Insured Courier</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs: Description, Specs, Reviews, Shipping & Returns */}
        <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-10 shadow-xs mb-14">
          <div className="flex border-b border-gray-2 gap-6 overflow-x-auto">
            {[
              { id: "desc", label: "Product Overview" },
              { id: "spec", label: "Technical Specifications" },
              { id: "shipping", label: "Shipping & Returns Policy" },
              { id: "reviews", label: `Customer Reviews (${reviewsList.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 text-sm font-bold transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-blue border-b-2 border-blue"
                    : "text-gray-400 hover:text-dark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pt-6">
            {activeTab === "desc" && (
              <div className="prose max-w-none text-gray-600 text-sm leading-relaxed space-y-4">
                <p>{product.description}</p>
                <p>{product.shortDescription}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 bg-gray-1 rounded-xl border border-gray-3">
                    <h4 className="font-bold text-dark text-xs mb-1">Authenticity Guaranteed</h4>
                    <p className="text-xs text-gray-500">Supplied directly by vetted manufacturing partners.</p>
                  </div>
                  <div className="p-4 bg-gray-1 rounded-xl border border-gray-3">
                    <h4 className="font-bold text-dark text-xs mb-1">Fast Dispatch</h4>
                    <p className="text-xs text-gray-500">Shipped within 24-48 business hours with full tracking.</p>
                  </div>
                  <div className="p-4 bg-gray-1 rounded-xl border border-gray-3">
                    <h4 className="font-bold text-dark text-xs mb-1">Certified Quality</h4>
                    <p className="text-xs text-gray-500">Quality-checked and safely packaged prior to transit.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "spec" && (
              <div className="divide-y divide-gray-2 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400 font-medium">SKU</span>
                  <span className="font-mono font-bold text-dark">{product.sku}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400 font-medium">Category</span>
                  <span className="font-bold text-dark">{product.category.title}</span>
                </div>
                {product.additionalInfo?.map((info, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between">
                    <span className="text-gray-400 font-medium">{info.name}</span>
                    <span className="font-bold text-dark">{info.description}</span>
                  </div>
                ))}
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400 font-medium">Fulfillment Partner</span>
                  <span className="font-bold text-blue">{effectiveSeller}</span>
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                <div className="p-4 bg-blue/5 rounded-xl border border-blue/20">
                  <h4 className="font-bold text-dark text-sm mb-1">30-Day Hassle-Free Returns</h4>
                  <p>
                    All retail purchases on the marketplace are protected by our return policy. If you receive an item that is defective, damaged in transit, or not as described, you can submit a return request directly from your Account Dashboard.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-1 rounded-xl border border-gray-3">
                    <h5 className="font-bold text-dark text-xs mb-1">Delivery Timeframes</h5>
                    <p>Standard delivery arrives in 3-5 business days. Express couriers dispatch in 24 hours.</p>
                  </div>
                  <div className="p-4 bg-gray-1 rounded-xl border border-gray-3">
                    <h5 className="font-bold text-dark text-xs mb-1">Multi-Vendor Shipments</h5>
                    <p>Orders containing items from multiple verified sellers are packaged and shipped separately to ensure minimum delivery times.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-8">
                {/* Submit Review */}
                <form onSubmit={handleReviewSubmit} className="p-5 bg-gray-1 rounded-2xl border border-gray-3 space-y-4">
                  <h4 className="font-bold text-dark text-sm">Write a Verified Customer Review</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Your Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-3 bg-white text-dark text-xs focus:outline-none focus:border-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Rating</label>
                      <select
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Your Review</label>
                    <textarea
                      rows={3}
                      placeholder="Share your experience regarding packaging, delivery speed, and product performance..."
                      value={reviewerComment}
                      onChange={(e) => setReviewerComment(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-3 bg-white text-dark text-xs focus:outline-none focus:border-blue"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-xl bg-dark text-white text-xs font-bold hover:bg-dark-2 transition-colors"
                  >
                    Submit Verified Review
                  </button>
                </form>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviewsList.map((rev, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-2 bg-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-dark text-xs">{rev.name}</span>
                        <span className="text-[11px] text-gray-400">{rev.date}</span>
                      </div>
                      <div className="text-amber-500 text-xs">
                        {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                      </div>
                      <p className="text-xs text-gray-600">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-dark mb-6">
              Customers Also Evaluated
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((rel) => (
                <ProductCard key={rel.id} product={rel} sellerName="Velocity Tech Store" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom Purchase Bar */}
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
              className="w-full h-full object-contain"
            />
          </div>
          <div className="overflow-hidden">
            <span className="font-bold text-xs text-dark truncate block max-w-[130px] sm:max-w-[200px]">
              {product.title}
            </span>
            <span className="font-black text-sm text-blue block">
              {formatPrice(effectivePrice)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-10 h-10 rounded-xl bg-gray-2 border border-gray-3 text-dark flex items-center justify-center disabled:opacity-50 active:scale-95 transition"
            aria-label="Add to cart"
            title="Add to cart"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-white bg-blue hover:bg-blue-dark active:scale-[0.98] transition disabled:opacity-50 shadow-xs flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>{isOutOfStock ? "Sold Out" : "Buy Now"}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
