import { Metadata } from "next";
import SignUpView from "@/components/Auth/SignUpView";

export const metadata: Metadata = {
  title: "Sign Up | VANIGAM",
  description: "Create an account to start shopping and track orders on VANIGAM.",
};

export default function SignUpPage() {
  return <SignUpView />;
}
