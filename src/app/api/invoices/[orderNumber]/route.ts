import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { RBAC } from "@/lib/rbac";
import { handle } from "@/lib/api";
import { buildInvoicePdf } from "@/lib/invoicePdf";

export const dynamic = "force-dynamic";

/**
 * Tax invoice PDF. Admin/staff may fetch any order in their store; a customer may
 * fetch only their own orders. The Invoice row is created on first request.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ orderNumber: string }> }) {
  return handle(async () => {
    const user = await AuthEngine.requireUser();
    const { orderNumber } = await ctx.params;
    const isStaff = RBAC.isAdminOrStaff(user.role);

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        ...(isStaff ? { businessId: user.businessId } : { customerId: user.id }),
      },
      include: { items: true, invoices: { orderBy: { issuedAt: "asc" }, take: 1 } },
    });
    // Same response for "does not exist" and "belongs to someone else".
    if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found.");

    let invoice = order.invoices[0];
    if (!invoice) {
      const invoiceNumber = `INV-${order.createdAt.getFullYear()}-${order.orderNumber}`;
      try {
        invoice = await prisma.invoice.create({
          data: { orderId: order.id, invoiceNumber, totalAmount: order.grandTotal },
        });
      } catch {
        // A concurrent first request created it (invoiceNumber is unique per order).
        const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } });
        if (!existing) throw new ApiError(500, "INTERNAL", "Could not generate the invoice.");
        invoice = existing;
      }
    }

    const business = order.businessId
      ? await prisma.business.findUnique({ where: { id: order.businessId } })
      : await prisma.business.findFirst();

    let ship: Record<string, string> = {};
    try {
      ship = order.shippingAddressJson ? JSON.parse(order.shippingAddressJson) : {};
    } catch {
      ship = {};
    }
    const shippingAddress = [
      [ship.streetAddress, ship.apartment].filter(Boolean).join(", "),
      [ship.city, ship.state, ship.postalCode].filter(Boolean).join(", "),
      ship.country || "",
    ].filter(Boolean);

    const pdf = buildInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      orderNumber: order.orderNumber,
      business: {
        name: business?.name ?? "Vanigam Commerce",
        legalName: business?.legalName,
        gstin: business?.gstin,
        address: business?.address,
        city: business?.city,
        state: business?.state,
        postalCode: business?.postalCode,
      },
      customer: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
      shippingAddress,
      items: order.items.map((i) => ({
        title: i.title,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRatePercent: i.taxRatePercent,
        totalPrice: i.totalPrice,
      })),
      totals: {
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        cgstTotal: order.cgstTotal,
        sgstTotal: order.sgstTotal,
        igstTotal: order.igstTotal,
        shippingFee: order.shippingFee,
        grandTotal: order.grandTotal,
      },
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      currencySymbol: business?.currencySymbol ?? "₹",
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${order.orderNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  });
}
