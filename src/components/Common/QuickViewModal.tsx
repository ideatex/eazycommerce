"use client";
import { usePreviewSlider } from "@/app/context/PreviewSliderContext";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import {
  CircleCheckIcon,
  CloseLine,
  FullScreenIcon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
} from "@/assets/icons";
import { updateproductDetails } from "@/redux/features/product-details";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { formatPrice } from "@/utils/formatePrice";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useCart } from "@/hooks/useCart";
import ReviewStar from "../Shop/ReviewStar";

const QuickViewModal = () => {
  const { isModalOpen, closeModal } = useModalContext();
  const { openPreviewModal } = usePreviewSlider();
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch<AppDispatch>();
  const { addItem } = useCart();
  const [avgRating, setAvgRating] = useState(0);
  const [totalRating, setTotalRating] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);

  // get the product data
  const product = useAppSelector((state) => state.quickViewReducer.value);
  const [activePreview, setActivePreview] = useState(0);

  const defaultVariant = product?.productVariants?.find(
    (variant) => variant.isDefault
  );

  // preview modal
  const handlePreviewSlider = () => {
    dispatch(
      updateproductDetails({
        ...product,
        updatedAt: product.updatedAt,
      })
    );
    openPreviewModal();
  };

  // add to cart
  const handleAddToCart = () => {
    const cartItem = {
      id: product.id,
      name: product.title,
      price: product.discountedPrice ? product.discountedPrice : product.price,
      currency: "usd",
      image: defaultVariant?.image ? defaultVariant.image : "",
      price_id: null,
      slug: product?.slug,
      availableQuantity: product.quantity,
      color: defaultVariant?.color ? defaultVariant.color : "",
      size: defaultVariant?.size ? defaultVariant.size : "",
    };
    if (product.quantity > 0) {
      // @ts-ignore
      addItem(cartItem);
      toast.success("Product added to cart!");
      closeModal();
    } else {
      toast.error("This product is out of stock!");
    }
  };

  const handleAddToWishlist = () => {
    dispatch(
      addItemToWishlist({
        id: product.id,
        title: product.title,
        slug: product.slug,
        image: defaultVariant?.image ? defaultVariant.image : "",
        price: product.discountedPrice
          ? product.discountedPrice
          : product.price,
        quantity: product.quantity,
        color: defaultVariant?.color ? defaultVariant.color : "",
      })
    );
  };
  const isAlreadyInWishlist = useAppSelector((state) =>
    state.wishlistReducer.items?.some((item) => item.id === product.id)
  );

  useEffect(() => {
    // closing modal while clicking outside
    function handleClickOutside(event: any) {
      if (!event.target.closest(".modal-content")) {
        closeModal();
      }
    }

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      setQuantity(1);
    };
  }, [isModalOpen, closeModal]);

  useEffect(() => {
    if (product?.slug) {
      fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productSlug: product.slug }),
      })
        .then((res) => res.json())
        .then((data) => {
          setTotalRating(data?.review?.length);
          setAvgRating(
            data?.review?.reduce(
              (acc: number, review: any) => acc + review?.ratings,
              0
            ) / data?.review?.length
          );
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching reviews:", error);
          setLoading(false);
        });
    }
  }, [product?.slug]);

  // Body scroll lock and Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };
    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isModalOpen, closeModal]);

  return (
    <>
      {product?.title && (
        <div
          className={`${
            isModalOpen ? "fixed" : "hidden"
          } inset-0 z-99999 overflow-y-auto momentum-scroll bg-dark/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-6 lg:p-8`}
        >
          <div className="w-full max-w-[1100px] rounded-2xl sm:rounded-3xl shadow-2xl bg-white p-4 sm:p-7.5 lg:p-10 relative modal-content my-auto max-h-[90dvh] overflow-y-auto momentum-scroll">
            <button
              onClick={() => closeModal()}
              className="absolute top-3 right-3 sm:top-5 sm:right-5 w-10 h-10 rounded-full flex items-center justify-center bg-gray-2 text-dark-5 hover:text-dark hover:bg-gray-3 transition-colors z-20"
              aria-label="Close modal"
            >
              <CloseLine />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
              {/* Gallery Left */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                {/* Thumbnails */}
                <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
                  {product?.productVariants?.map((thumb, key: number) => (
                    <button
                      onClick={() => setActivePreview(key)}
                      key={key}
                      className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-xl bg-gray-1 shrink-0 ease-out duration-200 border-2 ${
                        activePreview === key ? "border-blue ring-2 ring-blue/20" : "border-gray-3 hover:border-gray-4"
                      }`}
                    >
                      <Image
                        src={thumb.image}
                        alt="thumbnail"
                        width={61}
                        height={61}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>

                {/* Main Preview */}
                <div className="relative z-1 overflow-hidden flex items-center justify-center w-full min-h-[260px] sm:min-h-[420px] bg-gray-1 rounded-2xl border border-gray-3 p-4">
                  <button
                    onClick={handlePreviewSlider}
                    className="absolute z-10 flex items-center justify-center w-10 h-10 duration-200 ease-out bg-white rounded-xl shadow-sm border border-gray-2 text-dark hover:text-blue top-3 right-3"
                    title="Fullscreen"
                  >
                    <span className="sr-only">Fullscreen</span>
                    <FullScreenIcon />
                  </button>

                  <Image
                    src={
                      product?.productVariants?.[activePreview]?.image
                        ? product.productVariants[activePreview].image
                        : ""
                    }
                    alt="products-details"
                    width={400}
                    height={400}
                    className="max-h-[340px] w-auto object-contain"
                  />
                </div>
              </div>

              {/* Product Info Right */}
              <div className="w-full">
                {product.discountedPrice &&
                  product.discountedPrice < product.price && (
                    <span className="inline-block text-custom-xs uppercase rounded-full font-bold text-white py-1 px-3 bg-green mb-4">
                      sale {""}
                      {Math.round(
                        ((product.price - product.discountedPrice) /
                          product.price) *
                        100
                      )}
                      % OFF
                    </span>
                  )}

                  <h3 className="mb-4 text-xl font-semibold xl:text-heading-5 text-dark">
                    {product.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-5 mb-6">
                    {loading ? (
                      <p>Loading...</p>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {/* <!-- stars --> */}
                        <ReviewStar avgRating={avgRating} />
                        <span>
                          <span className="text-dark-2">
                            {" "}
                            ( {totalRating} reviews )
                          </span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {product.quantity > 0 ? (
                        <>
                          <CircleCheckIcon className="fill-green" />
                          <span className="text-dark"> In Stock </span>
                        </>
                      ) : (
                        <>
                          <CircleCheckIcon className="fill-red" />
                          <span className="text-body"> Out Of Stock </span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-base line-clamp-3 text-dark-3">
                    {product?.shortDescription}
                  </p>

                  <div className="flex flex-wrap justify-between gap-5 mt-6 mb-7.5">
                    <div>
                      <h4 className="font-medium text-base text-dark-2 mb-3.5">
                        Price
                      </h4>

                      <span className="flex items-center gap-2">
                        <span
                          className={`text-lg font-medium text-dark-4 xl:text-2xl ${product.discountedPrice ? "line-through" : ""
                            }`}
                        >
                          {formatPrice(product.price)}
                        </span>
                        {product.discountedPrice && (
                          <span className="text-xl font-semibold text-dark xl:text-heading-4">
                            {formatPrice(product.discountedPrice)}
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-medium text-base text-dark-3 mb-3.5">
                        Quantity
                      </h4>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="flex items-center justify-center w-10 h-10 duration-200 ease-out rounded-lg bg-gray-2 text-dark hover:text-blue"
                        >
                          <span className="sr-only">Increase quantity</span>
                          <PlusIcon />
                        </button>

                        <span
                          className="flex items-center justify-center w-20 h-10 font-medium bg-white border rounded-lg border-gray-4 text-dark"
                          x-text="quantity"
                        >
                          {quantity}
                        </span>

                        <button
                          onClick={() =>
                            quantity > 1 && setQuantity(quantity - 1)
                          }
                          className="flex items-center justify-center w-10 h-10 duration-200 ease-out rounded-lg bg-gray-2 text-dark hover:text-blue"
                          disabled={quantity <= 1}
                        >
                          <span className="sr-only">Decrease quantity</span>
                          <MinusIcon />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      disabled={quantity < 1 || product.quantity < 1}
                      onClick={() => handleAddToCart()}
                      className="inline-flex py-3 font-medium text-white duration-200 ease-out rounded-lg bg-blue px-7 hover:bg-blue-dark"
                    >
                      {product.quantity > 0 ? "Add to Cart" : "Out of Stock"}
                    </button>

                    <button
                      disabled={isAlreadyInWishlist}
                      onClick={() => handleAddToWishlist()}
                      className="inline-flex items-center gap-2 px-6 py-3 font-medium text-white duration-200 ease-out rounded-lg bg-dark hover:bg-opacity-95"
                    >
                      <HeartIcon />
                      {isAlreadyInWishlist
                        ? "Added to Wishlist"
                        : "Add to Wishlist"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

export default QuickViewModal;
