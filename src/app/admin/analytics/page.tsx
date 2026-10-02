// Vanigam Commerce - Commercial Analytics Server Page
// Computes real-time sales, order velocity, tax liabilities, and product metrics

import React from 'react';
import db from '@/lib/db';
import { AuthEngine } from '@/lib/auth';
import { AnalyticsClient } from './AnalyticsClient';

export const revalidate = 0;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = 'all' } = await searchParams;
  const session = await AuthEngine.getSessionUserFromCookies();

  const now = new Date();
  let dateFilter: Date | undefined = undefined;

  if (period === 'today') {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === '7d') {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '30d') {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const whereOrder: Record<string, unknown> = {
    businessId: session?.businessId,
  };

  if (dateFilter) {
    whereOrder.createdAt = { gte: dateFilter };
  }

  const [orders, orderItems, totalCustomers, totalProducts] = await Promise.all([
    db.order.findMany({
      where: whereOrder,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        subtotal: true,
        discountTotal: true,
        taxTotal: true,
        cgstTotal: true,
        sgstTotal: true,
        igstTotal: true,
        shippingFee: true,
        grandTotal: true,
        customerId: true,
        createdAt: true,
      },
    }),
    db.orderItem.findMany({
      where: {
        order: whereOrder,
      },
      select: {
        id: true,
        title: true,
        quantity: true,
        totalPrice: true,
        variantId: true,
        orderId: true,
      },
    }),
    db.user.count({
      where: {
        businessId: session?.businessId,
        role: 'CUSTOMER',
      },
    }),
    db.product.count({
      where: {
        businessId: session?.businessId,
        status: 'PUBLISHED',
      },
    }),
  ]);

  // Aggregate Metrics
  const grossSales = orders.reduce((acc, o) => acc + o.grandTotal, 0);
  const netRevenue = orders.reduce((acc, o) => acc + (o.subtotal - o.discountTotal), 0);
  const totalTax = orders.reduce((acc, o) => acc + o.taxTotal, 0);
  const totalShipping = orders.reduce((acc, o) => acc + o.shippingFee, 0);
  const totalDiscount = orders.reduce((acc, o) => acc + o.discountTotal, 0);
  const totalOrders = orders.length;
  const aov = totalOrders > 0 ? Math.round(grossSales / totalOrders) : 0;

  // Status Breakdown
  const statusCounts: Record<string, number> = {};
  const paymentMethodCounts: Record<string, number> = {};

  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    paymentMethodCounts[o.paymentMethod] = (paymentMethodCounts[o.paymentMethod] || 0) + 1;
  });

  // Top Products Leaderboard
  const productSalesMap = new Map<string, { title: string; quantity: number; revenue: number }>();
  orderItems.forEach((it) => {
    const existing = productSalesMap.get(it.title) || { title: it.title, quantity: 0, revenue: 0 };
    existing.quantity += it.quantity;
    existing.revenue += it.totalPrice;
    productSalesMap.set(it.title, existing);
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const metrics = {
    period,
    grossSales,
    netRevenue,
    totalTax,
    totalShipping,
    totalDiscount,
    totalOrders,
    aov,
    totalCustomers,
    totalProducts,
    statusCounts,
    paymentMethodCounts,
    topProducts,
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl min-w-0">
      <AnalyticsClient metrics={metrics} />
    </div>
  );
}
