import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr, str } from "@/lib/api";
import { parseCartItems, quoteCart } from "@/lib/checkout";
import { placeOrder, type PaymentMethod, type ShippingAddress } from "@/lib/placeOrder";
import { transitionOrder } from "@/lib/orderService";
import { revalidateStorefront } from "@/lib/revalidate";

const PHONE_RE = /^[+0-9][0-9 ()-]{7,17}$/;
const PIN_RE = /^[1-9][0-9]{5}$/;

function parseAddress(raw: unknown): ShippingAddress {
  const a = (raw ?? {}) as Record<string, unknown>;
  const address: ShippingAddress = {
    name: reqStr(a.name, "Recipient name", 120),
    phone: reqStr(a.phone, "Phone number", 20),
    streetAddress: reqStr(a.streetAddress, "Street address", 200),
    apartment: str(a.apartment)?.slice(0, 120) || undefined,
    city: reqStr(a.city, "City", 80),
    state: reqStr(a.state, "State", 80),
    postalCode: reqStr(a.postalCode, "PIN code", 6),
    country: str(a.country) || "India",
  };
  if (!PHONE_RE.test(address.phone)) throw new ApiError(400, "VALIDATION", "Enter a valid phone number.");
  if (!PIN_RE.test(address.postalCode)) throw new ApiError(400, "VALIDATION", "Enter a valid 6-digit PIN code.");
  return address;
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireUser();
    const body = await readJson(req);

    const address = parseAddress(body.address);
    const paymentMethod = reqStr(body.paymentMethod, "Payment method", 10) as PaymentMethod;
    if (paymentMethod !== "COD" && paymentMethod !== "ONLINE")
      throw new ApiError(400, "VALIDATION", "Payment method must be COD or ONLINE.");
    if (paymentMethod === "ONLINE" && !process.env.STRIPE_SECRET_KEY)
      throw new ApiError(400, "PAYMENTS_UNAVAILABLE", "Online payments are not available. Please choose cash on delivery.");

    const profile = await prisma.b2BProfile.findUnique({ where: { userId: user.id }, select: { status: true } });
    const quote = await quoteCart({
      items: parseCartItems(body.items),
      couponCode: str(body.couponCode),
      shippingState: address.state,
      isApprovedB2B: profile?.status === "APPROVED",
    });

    const order = await placeOrder({
      user,
      quote,
      address,
      paymentMethod,
      customerPhone: address.phone,
      notes: str(body.notes)?.slice(0, 500),
    });

    let paymentUrl: string | null = null;
    if (paymentMethod === "ONLINE") {
      try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
      const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        client_reference_id: order.orderNumber,
        customer_email: user.email,
        metadata: { orderNumber: order.orderNumber },
        payment_intent_data: { metadata: { orderNumber: order.orderNumber } },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "inr",
              unit_amount: Math.round(order.grandTotal * 100),
              product_data: { name: `Order ${order.orderNumber}` },
            },
          },
        ],
        success_url: `${site}/order-confirmation?orderNo=${order.orderNumber}`,
        cancel_url: `${site}/orders`,
      });
      paymentUrl = session.url;
      } catch (err) {
        // Do not leave an unpayable order holding stock: cancel it and report the failure.
        console.error("[checkout] payment session failed", err);
        await transitionOrder({
          orderNumber: order.orderNumber,
          nextStatus: "CANCELLED",
          businessId: order.businessId,
          actorId: user.id,
          note: "Payment session could not be created",
        });
        throw new ApiError(502, "PAYMENT_PROVIDER", "We could not start the online payment. Your order was not placed; please try again or choose cash on delivery.");
      }
    }

    revalidateStorefront();
    return ok({ orderNumber: order.orderNumber, grandTotal: order.grandTotal, paymentUrl }, 201);
  });
}
