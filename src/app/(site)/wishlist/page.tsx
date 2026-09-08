import { Metadata } from "next";
import WishlistView from "@/components/Wishlist/WishlistView";

export const metadata: Metadata = {
  title: "My Wishlist | VANIGAM",
  description: "View and manage your saved favorite products.",
};

export default function WishlistPage() {
  return <WishlistView />;
}
