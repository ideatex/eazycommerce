"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { menuData } from "./menuData";
import MobileMenu from "./MobileMenu";
import DesktopMenu from "./DesktopMenu";
import {
  SearchIcon,
  UserIcon,
  HeartIcon,
  CartIcon,
  MenuIcon,
  CloseIcon,
} from "./icons";
import SearchModal from "./SearchModal";
import { HeaderSetting } from "@prisma/client";
import { useAppSelector } from "@/redux/store";

type IProps = {
  headerData?: HeaderSetting | null;
};

const MainHeader = ({ headerData }: IProps) => {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { handleCartClick, cartCount, totalPrice } = useCart();
  const wishlistCount = useAppSelector((state) => state.wishlistReducer).items
    ?.length;

  const handleOpenCartModal = () => {
    handleCartClick();
  };

  // Sticky menu
  const handleStickyMenu = () => {
    if (window.scrollY >= 80) {
      setStickyMenu(true);
    } else {
      setStickyMenu(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleStickyMenu);
    return () => {
      window.removeEventListener("scroll", handleStickyMenu);
    };
  }, []);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setNavigationOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (navigationOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [navigationOpen]);

  return (
    <>
      <header
        className={`fixed left-0 top-0 w-full z-50 bg-white transition-all ease-in-out duration-300 ${stickyMenu && "shadow-sm"
          }`}
      >
        {/* Topbar */}
        <div className="bg-dark py-2.5">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 xl:px-0">
            <div className="flex justify-between items-center">
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-white">
                  {headerData?.headerText ||
                    "Get free delivery on orders over $100"}
                </p>
              </div>
              <div className="flex divide-x divide-white/20 ml-auto">
                <Link
                  href="/signup"
                  className="pr-3 text-xs sm:text-sm font-medium text-white transition hover:text-blue-300"
                >
                  Create an account
                </Link>
                <Link
                  href="/signin"
                  className="pl-3 text-xs sm:text-sm font-medium text-white transition hover:text-blue-300"
                >
                  {"Sign In"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="px-4 mx-auto max-w-7xl sm:px-6 xl:px-0">
          <div className="flex items-center justify-between py-3 sm:py-4 xl:py-0">
            {/* Logo */}
            <div>
              <Link className="block py-1 shrink-0" href="/">
                <div className="flex items-center gap-2.5">
                  <Image
                    src={headerData?.headerLogo || "/images/logo/logo.svg"}
                    alt="Vanigam Commerce"
                    width={210}
                    height={52}
                    className="h-10 sm:h-12 xl:h-13 w-auto object-contain transition-transform duration-200 hover:scale-[1.02]"
                    priority
                  />
                  <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-blue/10 text-blue text-xs font-bold tracking-wide uppercase border border-blue/20">
                    Marketplace
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Menu - Hidden on mobile */}
            <div className="hidden xl:block">
              <DesktopMenu menuData={menuData} stickyMenu={stickyMenu} />
            </div>

            {/* Action Buttons with 40px minimum touch targets */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className="transition hover:text-blue focus:outline-none w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-2 text-dark"
                onClick={() => setSearchModalOpen(true)}
                aria-label="Search"
                title="Search products and stores"
              >
                <SearchIcon />
              </button>

              <Link
                href="/account"
                className="transition hover:text-blue focus:outline-none w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-2 text-dark"
                aria-label="Account"
                title="My Account & Orders"
              >
                <UserIcon />
              </Link>

              <Link
                href="/wishlist"
                className="relative text-gray-700 transition hover:text-blue focus:outline-none w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-2"
                aria-label="Wishlist"
                title="Wishlist"
              >
                <HeartIcon />
                {wishlistCount !== undefined && wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-[18px] h-[18px] text-white bg-red-600 text-[10px] font-bold rounded-full inline-flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <button
                className="relative text-gray-700 transition hover:text-blue focus:outline-none w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-2"
                onClick={handleOpenCartModal}
                aria-label="Cart"
                title="Shopping Cart"
              >
                <CartIcon />
                <span className="absolute top-1 right-1 w-[18px] h-[18px] text-white bg-red-600 text-[10px] font-bold rounded-full inline-flex items-center justify-center shadow-xs">
                  {cartCount || 0}
                </span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                className="transition xl:hidden focus:outline-none w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-2 text-dark"
                onClick={() => setNavigationOpen(!navigationOpen)}
                aria-label={navigationOpen ? "Close menu" : "Open menu"}
              >
                {navigationOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Offcanvas */}

      <MobileMenu
        headerLogo={headerData?.headerLogo || null}
        isOpen={navigationOpen}
        onClose={() => setNavigationOpen(false)}
        menuData={menuData}
      />

      {/* Global Interactive Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
};

export default MainHeader;
