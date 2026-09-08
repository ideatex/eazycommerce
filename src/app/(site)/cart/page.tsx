import { Metadata } from "next";
import CartView from "@/components/Cart/CartView";

export const metadata: Metadata = {
  title: "Shopping Cart | VANIGAM",
  description: "Review and manage the items in your VANIGAM shopping cart.",
};

export default function CartPage() {
  return <CartView />;
}
