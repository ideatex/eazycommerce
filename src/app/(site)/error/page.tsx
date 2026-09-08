import { Metadata } from "next";
import ErrorComponent from "@/components/Error";

export const metadata: Metadata = {
  title: "Error 404 | VANIGAM",
  description: "Sorry, the page you are looking for does not exist.",
};

export default function ErrorPage() {
  return <ErrorComponent />;
}
