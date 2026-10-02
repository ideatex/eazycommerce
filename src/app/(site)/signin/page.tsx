import { Metadata } from "next";
import { Suspense } from "react";
import SignInView from "@/components/Auth/SignInView";

export const metadata: Metadata = {
  title: "Sign In | VANIGAM",
  description: "Sign in to access your orders, profile, and wishlist.",
};

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInView />
    </Suspense>
  );
}
