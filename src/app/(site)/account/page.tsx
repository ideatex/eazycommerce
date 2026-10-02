import { Metadata } from "next";
import { redirect } from "next/navigation";
import CustomerAccountHub, { type AccountOrder } from "@/components/Customer/CustomerAccountHub";
import { AuthEngine } from "@/lib/auth";
import { prisma } from "@/lib/prismaDB";

export const metadata: Metadata = {
  title: "My Account & Orders | VANIGAM",
  description: "Track your orders, download invoices, request returns and manage your details.",
};

export const dynamic = "force-dynamic";

export default async function CustomerAccountPage() {
  const user = await AuthEngine.getSessionUserFromCookies();
  if (!user) redirect("/signin?callbackUrl=/account");

  const [profile, addresses, orders] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { phone: true, createdAt: true } }),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }] }),
    prisma.order.findMany({
      where: { customerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true, history: { orderBy: { createdAt: "desc" } } },
    }),
  ]);

  const serialized: AccountOrder[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    grandTotal: o.grandTotal,
    subtotal: o.subtotal,
    discountTotal: o.discountTotal,
    taxTotal: o.taxTotal,
    shippingFee: o.shippingFee,
    trackingNumber: o.trackingNumber,
    trackingCarrier: o.trackingCarrier,
    createdAt: o.createdAt.toISOString(),
    returnRequested: o.history.some((h) => h.note?.startsWith("Return requested")),
    items: o.items.map((i) => ({ id: i.id, title: i.title, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice })),
    timeline: o.history.map((h) => ({ id: h.id, status: h.status, note: h.note, createdAt: h.createdAt.toISOString() })),
  }));

  return (
    <CustomerAccountHub
      user={{ name: user.fullName, email: user.email, phone: profile?.phone ?? null, memberSince: profile?.createdAt.toISOString() ?? null }}
      orders={serialized}
      addresses={addresses.map((a) => ({
        id: a.id,
        name: a.name,
        phone: a.phone,
        streetAddress: a.streetAddress,
        apartment: a.apartment,
        city: a.city,
        state: a.state,
        postalCode: a.postalCode,
        country: a.country,
        isDefaultShipping: a.isDefaultShipping,
      }))}
    />
  );
}
