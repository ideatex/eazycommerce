import { WishlistItem } from '@/types/wishlistItem';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const WISHLIST_STORAGE_KEY = 'wishlistItems';

/** Saves the list; storage can be unavailable (private mode, quota), which must never break the UI. */
function persist(items: WishlistItem[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // Wishlist still works for this session.
  }
}

/** Reads and validates the saved list. Anything malformed is ignored. */
export function loadWishlistFromStorage(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is WishlistItem =>
        i && typeof i === 'object' && typeof i.id === 'string' && typeof i.title === 'string' && typeof i.price === 'number'
    );
  } catch {
    return [];
  }
}

// Reducers are pure: user feedback (toasts) is shown by the components that dispatch.
export const wishlist = createSlice({
  name: 'wishlist',
  initialState: { items: [] as WishlistItem[] },
  reducers: {
    setWishlistItems: (state, action: PayloadAction<WishlistItem[]>) => {
      state.items = action.payload;
    },
    /** Adds the product if it is not already saved; saving twice is a no-op. */
    addItemToWishlist: (state, action: PayloadAction<WishlistItem>) => {
      const { id, title, price, slug, image, quantity, color } = action.payload;
      if (state.items.some((item) => item.id === id)) return;
      state.items.push({ id, title, slug, image, price, quantity, color });
      persist(state.items);
    },
    removeItemFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      persist(state.items);
    },
    removeAllItemsFromWishlist: (state) => {
      state.items = [];
      persist(state.items);
    },
  },
});

export const {
  addItemToWishlist,
  removeItemFromWishlist,
  removeAllItemsFromWishlist,
  setWishlistItems,
} = wishlist.actions;
export default wishlist.reducer;
