import { Metadata } from "next";
import BusinessOnboardingWizard from "@/components/Onboarding/BusinessOnboardingWizard";

export const metadata: Metadata = {
  title: "Enterprise Onboarding | VANIGAM B2B2C Platform",
  description: "Register your manufacturer, distributor, or seller organization on the VANIGAM network.",
};

export default function OnboardingPage() {
  return <BusinessOnboardingWizard />;
}
