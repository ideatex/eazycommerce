import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthEngine } from "@/lib/auth";
import { prisma } from "@/lib/prismaDB";
import { formatPrice } from "@/utils/formatePrice";

export const metadata: Metadata = {
  title: "Order Confirmation | VANIGAM",
  description: "Your order details.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ orderNo?: string }>;
}

export default async function OrderConfirmationPage({ searchParams }: PageProps) {
  const { orderNo } = await searchParams;
  const user = await AuthEngine.getSessionUserFromCookies();
  if (!user) redirect("/signin?callbackUrl=/account");
  if (!orderNo) notFound();

  // Only the customer who placed the order can see its confirmation.
  const order = await prisma.order.findFirst({
    where: { orderNumber: orderNo, customerId: user.id },
    include: { items: true },
  });
  if (!order) notFound();

  const paid = order.paymentStatus === "PAID";

  return (
    <div className="pb-24 pt-10 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-3xl sm:px-8 xl:px-0">
        <div className="bg-white rounded-3xl border border-gray-3 p-8 sm:p-12 shadow-xs text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-dark mb-3">Thank you for your order!</h1>
          <p className="text-sm text-gray-500 mb-8">
            Your order has been received. You can follow its progress in your account.
          </p>

          <div className="bg-gray-1 p-5 rounded-2xl border border-gray-3 text-left text-xs space-y-3 mb-8">
            <div className="flex justify-between"><span className="text-gray-500">Order number</span><span className="font-mono font-bold text-dark text-sm">{order.orderNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-bold text-dark">{order.status}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment</span>
              <span className="font-bold text-dark">{order.paymentMethod === "COD" ? "Cash on delivery" : paid ? "Paid" : "Awaiting payment confirmation"}</span>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-black text-dark text-sm">{formatPrice(order.grandTotal)}</span></div>
          </div>

          <ul className="text-left text-xs divide-y divide-gray-2 mb-8">
            {order.items.map((i) => (
              <li key={i.id} className="py-2 flex justify-between gap-4">
                <span className="text-dark">{i.title} <span className="text-gray-400">× {i.quantity}</span></span>
                <span className="font-semibold">{formatPrice(i.totalPrice)}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/account?tab=orders" className="py-3 px-6 bg-blue text-white text-sm font-bold rounded-xl hover:bg-blue-dark">View my orders</Link>
            <Link href="/shop-with-sidebar" className="py-3 px-6 border border-gray-3 text-dark text-sm font-bold rounded-xl hover:bg-gray-1">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
