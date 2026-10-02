import { Metadata } from "next";
import { redirect } from "next/navigation";
import CheckoutView from "@/components/Checkout/CheckoutView";
import { AuthEngine } from "@/lib/auth";
import { prisma } from "@/lib/prismaDB";
import { getDefaultBusiness } from "@/lib/business";

export const metadata: Metadata = {
  title: "Checkout | VANIGAM",
  description: "Complete your order with secure shipping and payment options.",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await AuthEngine.getSessionUserFromCookies();
  // Orders belong to an account so customers can track them later.
  if (!user) redirect("/signin?callbackUrl=/checkout");

  const [address, dbUser, business] = await Promise.all([
    prisma.address.findFirst({ where: { userId: user.id }, orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }] }),
    prisma.user.findUnique({ where: { id: user.id }, select: { phone: true } }),
    getDefaultBusiness(),
  ]);

  return (
    <CheckoutView
      user={{ name: user.fullName, email: user.email, phone: dbUser?.phone ?? "" }}
      defaultAddress={
        address
          ? {
              name: address.name,
              phone: address.phone,
              streetAddress: address.streetAddress,
              apartment: address.apartment ?? "",
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
            }
          : null
      }
      businessState={business.state}
    />
  );
}
