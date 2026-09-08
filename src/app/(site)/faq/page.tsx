import { Metadata } from "next";
import FAQView from "@/components/FAQ/FAQView";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | VANIGAM",
  description: "Learn how the VANIGAM B2B2C marketplace, wholesale B2B purchase orders, and settlements operate.",
};

export default function FAQPage() {
  return <FAQView />;
}
