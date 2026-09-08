"use client";
import { CloseLine } from "@/assets/icons";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import EmptyCart from "./EmptyCart";
import SingleItem from "./SingleItem";
import { formatPrice } from "@/utils/formatePrice";
import { useRouter } from "next/navigation";

const CartSidebarModal = () => {
  const {
    cartCount,
    shouldDisplayCart,
    handleCartClick,
    cartDetails,
    totalPrice,
  } = useCart();

  useEffect(() => {
    // closing modal while clicking outside
    function handleClickOutside(event: any) {
      if (!event.target.closest(".modal-content")) {
        handleCartClick();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && shouldDisplayCart) {
        handleCartClick();
      }
    };

    if (shouldDisplayCart) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [shouldDisplayCart, handleCartClick]);

  const router = useRouter();
  const handleCheckout = () => {
    router.push("/checkout");
    handleCartClick();
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 z-9999 w-full h-[100dvh] bg-dark/70 backdrop-blur-2xs ease-linear duration-300 ${shouldDisplayCart ? "block" : "hidden"
          }`}
        onClick={() => handleCartClick()}
      ></div>

      <div
        className={`${shouldDisplayCart ? "translate-x-0" : "translate-x-full"
          } fixed z-999999 w-full h-[100dvh] max-w-[470px] ease-linear duration-300 shadow-2xl bg-white px-4 sm:px-7.5 lg:px-10 top-0 right-0 modal-content flex flex-col pb-safe`}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between pb-5 pt-4 sm:pt-6 border-b border-gray-3 shrink-0">
          <h2 className="text-lg font-bold text-dark sm:text-2xl">
            Shopping Cart
          </h2>
          <button
            onClick={() => handleCartClick()}
            aria-label="Close cart modal"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-dark-5 hover:text-dark hover:bg-gray-2 transition-colors"
          >
            <CloseLine />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar momentum-scroll min-h-0 py-4">
          <div className="flex flex-col gap-5">
            {/* <!-- cart item --> */}
            {cartCount ? (
              <>
                {Object.values(cartDetails ?? {}).map((item, key) => (
                  <SingleItem key={key} item={item} />
                ))}
              </>
            ) : (
              <EmptyCart />
            )}
          </div>
        </div>

        <div className="border-t border-gray-3 bg-white pt-4 pb-4 sm:pb-6 sticky bottom-0 mt-auto shrink-0">
          <div className="flex items-center justify-between gap-5 mb-5">
            <p className="text-sm font-medium text-dark-3">Subtotal:</p>

            <p className="text-xl font-extrabold text-dark">
              {totalPrice && formatPrice(totalPrice)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              onClick={() => handleCartClick()}
              href="/cart"
              className="flex justify-center items-center w-full px-4 py-3 text-xs sm:text-sm font-bold text-dark bg-gray-2 hover:bg-gray-3 duration-150 rounded-xl"
            >
              View Cart
            </Link>

            <button
              onClick={() => handleCheckout()}
              className="flex justify-center items-center w-full px-4 py-3 text-xs sm:text-sm font-bold text-white bg-blue hover:bg-blue-dark duration-150 rounded-xl shadow-xs"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartSidebarModal;
