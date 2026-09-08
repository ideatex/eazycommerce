import { Metadata } from "next";
import ContactView from "@/components/Contact/ContactView";

export const metadata: Metadata = {
  title: "Contact Us | VANIGAM",
  description: "Get in touch with the VANIGAM team for support, questions, and order inquiries.",
};

export default function ContactPage() {
  return <ContactView />;
}
