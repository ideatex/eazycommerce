import { Metadata } from "next";
import FAQView from "@/components/FAQ/FAQView";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | VANIGAM",
  description: "Answers about orders, shipping, returns, payments and wholesale accounts.",
};

export default function FAQPage() {
  return <FAQView />;
}
