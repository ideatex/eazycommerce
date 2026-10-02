import React from 'react';
import db from '@/lib/db';
import { requireAdminScope } from '@/lib/adminScope';
import { OrdersManagerClient } from './OrdersManagerClient';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { status, search } = await searchParams;
  const { businessId } = await requireAdminScope();

  const orders = await db.order.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      invoices: true,
      history: { orderBy: { createdAt: 'desc' } },
    },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Orders
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Manage customer and wholesale orders across fulfillment stages.
        </p>
      </div>

      <OrdersManagerClient
        initialOrders={orders}
        initialStatus={status}
        initialSearch={search}
      />
    </div>
  );
}
