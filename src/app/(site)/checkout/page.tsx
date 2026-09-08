import { Metadata } from "next";
import CheckoutView from "@/components/Checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout | VANIGAM",
  description: "Complete your order with secure shipping and payment options.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
