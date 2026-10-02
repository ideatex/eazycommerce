"use client";
import { usePreviewSlider } from "@/app/context/PreviewSliderContext";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { CircleCheckIcon, CloseLine, FullScreenIcon, HeartIcon, MinusIcon, PlusIcon } from "@/assets/icons";
import { updateproductDetails } from "@/redux/features/product-details";
import { addItemToWishlist, removeItemFromWishlist } from "@/redux/features/wishlist-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { formatPrice } from "@/utils/formatePrice";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useCart } from "@/hooks/useCart";
import ReviewStar from "../Shop/ReviewStar";
import type { StoreProduct } from "@/types/storefront";

const isLocal = (src: string) => src.startsWith("/");
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const QuickViewModal = () => {
  const { isModalOpen, closeModal } = useModalContext();
  const { openPreviewModal } = usePreviewSlider();
  const dispatch = useDispatch<AppDispatch>();
  const { addItem } = useCart();

  // The card stores the full storefront product in redux when opening the quick view.
  const product = useAppSelector((state) => state.quickViewReducer.value) as unknown as StoreProduct;
  const isInWishlist = useAppSelector((state) => state.wishlistReducer.items?.some((item) => item.id === product?.id));

  const [activePreview, setActivePreview] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  const variants = product?.productVariants ?? [];
  const variant = variants[variantIndex] ?? variants[0];
  const previews = product?.previews?.length ? product.previews : variant?.image ? [variant.image] : [];
  const available = variant?.available ?? 0;
  const moq = product?.moq ?? 1;
  const minQty = Math.min(moq, Math.max(available, 1));
  const unitPrice = variant ? variant.price : product?.sellingPrice ?? 0;
  const listPrice = product?.discountedPrice != null ? product.price : null;
  const outOfStock = !variant || available < 1;

  // Start every opening from the default option, first picture and minimum quantity.
  useEffect(() => {
    if (!product?.id) return;
    const defaultIdx = Math.max(0, (product.productVariants ?? []).findIndex((v) => v.isDefault));
    setVariantIndex(defaultIdx);
    setActivePreview(0);
    setQuantity(Math.min(product.moq ?? 1, Math.max(product.productVariants?.[defaultIdx]?.available ?? 1, 1)));
  }, [product?.id]);

  const handleClose = useCallback(() => closeModal(), [closeModal]);

  // Focus management, Escape and a simple Tab trap while the dialog is open.
  useEffect(() => {
    if (!isModalOpen) return;
    returnFocusTo.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      returnFocusTo.current?.focus?.();
    };
  }, [isModalOpen, handleClose]);

  const handlePreviewSlider = () => {
    dispatch(updateproductDetails({ ...product, updatedAt: product.updatedAt } as never));
    openPreviewModal();
  };

  const handleAddToCart = () => {
    if (!variant || outOfStock) {
      toast.error("This product is out of stock!");
      return;
    }
    if (quantity < moq) {
      toast.error(`Minimum order quantity is ${moq}.`);
      return;
    }
    addItem({
      id: variant.id,
      productId: product.id,
      variantId: variant.id,
      name: product.title,
      price: unitPrice,
      currency: "inr",
      image: variant.image || previews[0] || "",
      slug: product.slug,
      availableQuantity: available,
      moq,
      color: variant.color,
      size: variant.size,
      quantity,
    });
    toast.success(`Added ${quantity} × ${product.title} to cart`);
    handleClose();
  };

  const handleToggleWishlist = () => {
    if (isInWishlist) {
      dispatch(removeItemFromWishlist(product.id));
      toast.success("Removed from wishlist");
    } else {
      dispatch(
        addItemToWishlist({
          id: product.id,
          title: product.title,
          slug: product.slug,
          image: previews[0] || "",
          price: product.sellingPrice,
          quantity: product.quantity,
          color: variant?.color || "",
        })
      );
      toast.success("Saved to wishlist");
    }
  };

  if (!isModalOpen || !product?.title) return null;

  const mainImage = previews[activePreview] ?? previews[0];

  return (
    <div
      className="fixed inset-0 z-99999 overflow-y-auto momentum-scroll bg-dark/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-6 lg:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view: ${product.title}`}
        className="w-full max-w-[1100px] rounded-2xl sm:rounded-3xl shadow-2xl bg-white p-4 sm:p-7.5 lg:p-10 relative modal-content my-auto max-h-[90dvh] overflow-y-auto momentum-scroll"
      >
        <button
          ref={closeRef}
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 w-10 h-10 rounded-full flex items-center justify-center bg-gray-2 text-dark-5 hover:text-dark hover:bg-gray-3 transition-colors z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40"
          aria-label="Close quick view"
        >
          <CloseLine />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Gallery Left */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
            {previews.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
                {previews.map((src, key) => (
                  <button
                    onClick={() => setActivePreview(key)}
                    key={`${src}-${key}`}
                    aria-label={`Show image ${key + 1}`}
                    aria-current={activePreview === key}
                    className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-xl bg-gray-1 shrink-0 ease-out duration-200 border-2 ${
                      activePreview === key ? "border-blue ring-2 ring-blue/20" : "border-gray-3 hover:border-gray-4"
                    }`}
                  >
                    <Image src={src} alt="" width={61} height={61} unoptimized={!isLocal(src)} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}

            <div className="relative z-1 overflow-hidden flex items-center justify-center w-full min-h-[260px] sm:min-h-[420px] bg-gray-1 rounded-2xl border border-gray-3 p-4">
              <button
                onClick={handlePreviewSlider}
                className="absolute z-10 flex items-center justify-center w-10 h-10 duration-200 ease-out bg-white rounded-xl shadow-sm border border-gray-2 text-dark hover:text-blue top-3 right-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40"
                title="Fullscreen"
              >
                <span className="sr-only">View images fullscreen</span>
                <FullScreenIcon />
              </button>

              {mainImage && (
                <Image
                  src={mainImage}
                  alt={product.title}
                  width={400}
                  height={400}
                  unoptimized={!isLocal(mainImage)}
                  className="max-h-[340px] w-auto object-contain"
                />
              )}
            </div>
          </div>

          {/* Product Info Right */}
          <div className="w-full">
            {listPrice !== null && listPrice > unitPrice && (
              <span className="inline-block text-custom-xs uppercase rounded-full font-bold text-white py-1 px-3 bg-green mb-4">
                sale {Math.round(((listPrice - unitPrice) / listPrice) * 100)}% OFF
              </span>
            )}

            <h3 className="mb-4 text-xl font-semibold xl:text-heading-5 text-dark">{product.title}</h3>

            <div className="flex flex-wrap items-center gap-5 mb-6">
              {product.reviews > 0 ? (
                <div className="flex items-center gap-1.5">
                  <ReviewStar avgRating={product.rating} />
                  <span className="text-dark-2"> ( {product.reviews} {product.reviews === 1 ? "review" : "reviews"} )</span>
                </div>
              ) : (
                <span className="text-dark-4 text-sm">No reviews yet</span>
              )}

              <div className="flex items-center gap-2">
                {!outOfStock ? (
                  <>
                    <CircleCheckIcon className="fill-green" />
                    <span className="text-dark">{available <= 5 ? `Only ${available} left` : "In Stock"}</span>
                  </>
                ) : (
                  <>
                    <CircleCheckIcon className="fill-red" />
                    <span className="text-body"> Out Of Stock </span>
                  </>
                )}
              </div>
            </div>

            <p className="text-base line-clamp-3 text-dark-3">{product.shortDescription}</p>

            {variants.length > 1 && (
              <div className="mt-6 space-y-2">
                <span className="text-xs font-bold text-dark block">
                  Option: <span className="font-semibold text-blue">{variant?.title}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v, idx) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setVariantIndex(idx);
                        setQuantity((q) => Math.min(Math.max(q, moq), Math.max(v.available, 1)));
                        const at = previews.indexOf(v.image);
                        if (at >= 0) setActivePreview(at);
                      }}
                      disabled={v.available < 1}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:line-through ${
                        variantIndex === idx ? "border-blue bg-blue text-white shadow-xs" : "border-gray-3 bg-gray-1 text-dark hover:border-gray-4"
                      }`}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-between gap-5 mt-6 mb-7.5">
              <div>
                <h4 className="font-medium text-base text-dark-2 mb-3.5">Price</h4>
                <span className="flex items-center gap-2">
                  <span className={`text-lg font-medium text-dark-4 xl:text-2xl ${listPrice !== null ? "line-through" : "hidden"}`}>
                    {listPrice !== null ? formatPrice(listPrice) : ""}
                  </span>
                  <span className="text-xl font-semibold text-dark xl:text-heading-4">{formatPrice(unitPrice)}</span>
                </span>
                <span className="text-[11px] text-dark-4 mt-1 block">Excludes GST</span>
              </div>

              <div>
                <h4 className="font-medium text-base text-dark-3 mb-3.5">Quantity</h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
                    disabled={quantity <= minQty}
                    className="flex items-center justify-center w-10 h-10 duration-200 ease-out rounded-lg bg-gray-2 text-dark hover:text-blue disabled:opacity-40"
                  >
                    <span className="sr-only">Decrease quantity</span>
                    <MinusIcon />
                  </button>

                  <span aria-live="polite" className="flex items-center justify-center w-20 h-10 font-medium bg-white border rounded-lg border-gray-4 text-dark">
                    {quantity}
                  </span>

                  <button
                    onClick={() => setQuantity((q) => Math.min(available, q + 1))}
                    disabled={quantity >= available}
                    className="flex items-center justify-center w-10 h-10 duration-200 ease-out rounded-lg bg-gray-2 text-dark hover:text-blue disabled:opacity-40"
                  >
                    <span className="sr-only">Increase quantity</span>
                    <PlusIcon />
                  </button>
                </div>
                {moq > 1 && <span className="text-[11px] text-dark-4 mt-1 block">Minimum order: {moq}</span>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                disabled={outOfStock}
                onClick={handleAddToCart}
                className="inline-flex py-3 font-medium text-white duration-200 ease-out rounded-lg bg-blue px-7 hover:bg-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {outOfStock ? "Out of Stock" : "Add to Cart"}
              </button>

              <button
                onClick={handleToggleWishlist}
                aria-pressed={!!isInWishlist}
                className="inline-flex items-center gap-2 px-6 py-3 font-medium text-white duration-200 ease-out rounded-lg bg-dark hover:bg-opacity-95"
              >
                <HeartIcon />
                {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            <Link
              href={`/products/${product.slug}`}
              onClick={handleClose}
              className="inline-block mt-5 text-sm font-semibold text-blue hover:underline"
            >
              View full details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
