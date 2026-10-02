// Vanigam Commerce - Coupons Management Server Page

import React from 'react';
import db from '@/lib/db';
import { AuthEngine } from '@/lib/auth';
import { CouponsAdminClient } from './CouponsAdminClient';

export const revalidate = 0;

export default async function AdminCouponsPage() {
  const session = await AuthEngine.getSessionUserFromCookies();

  const coupons = await db.coupon.findMany({
    where: {
      businessId: session?.businessId,
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: c.discountValue,
    minOrderValue: c.minOrderValue,
    maxDiscount: c.maxDiscount,
    usageLimit: c.usageLimit,
    timesUsed: c.timesUsed,
    startDate: c.startDate ? c.startDate.toISOString() : null,
    endDate: c.endDate ? c.endDate.toISOString() : null,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl min-w-0">
      <CouponsAdminClient initialCoupons={serialized} />
    </div>
  );
}
