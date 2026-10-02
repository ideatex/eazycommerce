// Vanigam Commerce - Customer Detail Server Page

import React from 'react';
import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { AuthEngine } from '@/lib/auth';
import { CustomerDetailClient } from './CustomerDetailClient';

export const revalidate = 0;

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await AuthEngine.getSessionUserFromCookies();

  const user = await db.user.findFirst({
    where: {
      id,
      businessId: session?.businessId,
    },
    include: {
      customerProfile: true,
      b2bProfile: true,
      addresses: {
        orderBy: [{ isDefaultShipping: 'desc' }, { createdAt: 'desc' }],
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          invoices: { select: { invoiceNumber: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, title: true, slug: true } },
        },
      },
      wishlistItems: {
        include: {
          product: { select: { id: true, title: true, slug: true, basePrice: true } },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const serialized = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    orders: user.orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })),
    reviews: user.reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    wishlistItems: user.wishlistItems.map((w) => ({
      ...w,
      createdAt: w.createdAt.toISOString(),
    })),
    addresses: user.addresses.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    computedTotalSpent: user.orders.reduce((acc, o) => acc + o.grandTotal, 0),
    computedOrderCount: user.orders.length,
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl min-w-0">
      <CustomerDetailClient customer={serialized as any} />
    </div>
  );
}
