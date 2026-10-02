"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadCartFromStorage as loadCartFromStorageAction } from "@/redux/features/cart-slice";
import { loadCartFromStorage } from "@/lib/cartStorage";

/**
 * CartHydration component loads cart from localStorage after initial render
 * This prevents SSR hydration mismatches
 */
export default function CartHydration() {
    const dispatch = useDispatch();

    useEffect(() => {
        // Load cart from localStorage only on client-side after hydration
        // Carts saved before the catalogue went live lack variant ids and cannot be ordered.
        const savedCart = loadCartFromStorage().filter((item) => !!item.variantId);
        if (savedCart.length > 0) {
            dispatch(loadCartFromStorageAction(savedCart));
        }
    }, [dispatch]);

    return null; // This component doesn't render anything
}
