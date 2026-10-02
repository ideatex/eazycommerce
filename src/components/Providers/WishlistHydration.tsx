"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadWishlistFromStorage, setWishlistItems } from "@/redux/features/wishlist-slice";

/** Restores the saved wishlist after hydration (same approach as CartHydration, avoids SSR mismatches). */
export default function WishlistHydration() {
  const dispatch = useDispatch();

  useEffect(() => {
    const saved = loadWishlistFromStorage();
    if (saved.length > 0) dispatch(setWishlistItems(saved));
  }, [dispatch]);

  return null;
}
