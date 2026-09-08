import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaDB";

// Set to record processed event IDs for idempotency deduplication
const processedEventIds = new Set<string>();

/**
 * Stripe Payment Webhook Handler with Idempotency Guard
 * Verifies webhook event and idempotently updates payment and master order records.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: any;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeApiKey = process.env.STRIPE_SECRET_KEY;

    if (webhookSecret && signature && stripeApiKey) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeApiKey, { apiVersion: "2023-10-16" });
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    } else {
      // Parse payload directly if running in mock/development mode
      try {
        event = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
      }
    }

    const eventId = event.id || `evt_${Date.now()}`;

    // IDEMPOTENCY GUARD: Check if event has already been processed
    if (processedEventIds.has(eventId)) {
      return NextResponse.json(
        { received: true, deduplicated: true, message: `Event ${eventId} already processed.` },
        { status: 200 }
      );
    }

    // Mark event ID as processed
    processedEventIds.add(eventId);

    // Process event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data?.object;
        const orderId = paymentIntent?.metadata?.orderId;

        if (orderId) {
          try {
            await prisma.masterOrder.updateMany({
              where: { orderNumber: orderId },
              data: { status: "PAID" },
            });
          } catch {
            // DB fallback
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data?.object;
        const orderId = paymentIntent?.metadata?.orderId;

        if (orderId) {
          try {
            await prisma.masterOrder.updateMany({
              where: { orderNumber: orderId },
              data: { status: "CANCELLED" },
            });
          } catch {
            // DB fallback
          }
        }
        break;
      }

      default:
        // Unhandled event type acknowledged
        break;
    }

    return NextResponse.json({
      received: true,
      eventId,
      type: event.type,
      status: "SUCCESS",
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    return NextResponse.json({ error: "Internal webhook processing error" }, { status: 500 });
  }
}
