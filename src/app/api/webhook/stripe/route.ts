import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { transitionOrder } from "@/lib/orderService";

/**
 * Stripe webhook. The signature is always verified: without STRIPE_WEBHOOK_SECRET
 * the endpoint refuses to act, so nobody can mark an order as paid by posting JSON.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !apiKey) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(apiKey);

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe] signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as { metadata?: Record<string, string> | null; payment_status?: string; payment_intent?: string | null };
      const orderNumber = session.metadata?.orderNumber;
      if (orderNumber && session.payment_status === "paid") {
        // Idempotent: only a still-PENDING payment is updated, so replays are no-ops.
        await prisma.order.updateMany({
          where: { orderNumber, paymentStatus: "PENDING" },
          data: { paymentStatus: "PAID", paymentReference: typeof session.payment_intent === "string" ? session.payment_intent : null },
        });
      }
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as { metadata?: Record<string, string> | null };
      const orderNumber = session.metadata?.orderNumber;
      if (orderNumber) {
        const order = await prisma.order.findUnique({ where: { orderNumber }, select: { status: true, paymentStatus: true, businessId: true, customerId: true } });
        if (order && order.paymentStatus === "PENDING" && order.status === "PENDING") {
          await prisma.order.update({ where: { orderNumber }, data: { paymentStatus: "FAILED" } });
          await transitionOrder({
            orderNumber,
            nextStatus: "CANCELLED",
            businessId: order.businessId,
            actorId: order.customerId ?? "system",
            note: "Payment expired or failed",
          });
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe] webhook handling failed:", err);
    // A non-2xx makes Stripe retry delivery.
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
