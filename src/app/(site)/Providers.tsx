"use client";
import { SessionProvider } from "next-auth/react";
import { ModalProvider } from "../context/QuickViewModalContext";
import { ReduxProvider } from "@/redux/provider";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import { PreviewSliderProvider } from "../context/PreviewSliderContext";
import PreviewSliderModal from "@/components/Common/PreviewSlider";
import CartProvider from "@/components/Providers/CartProvider";
import CartHydration from "@/components/Providers/CartHydration";
import WishlistHydration from "@/components/Providers/WishlistHydration";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <ReduxProvider>
        <CartHydration />
        <WishlistHydration />
        <CartProvider>
          <ModalProvider>
            <PreviewSliderProvider>
              {children}
              <QuickViewModal />
              <CartSidebarModal />
              <PreviewSliderModal />
            </PreviewSliderProvider>
          </ModalProvider>
        </CartProvider>
      </ReduxProvider>
    </SessionProvider>
  );
};

export default Providers;
