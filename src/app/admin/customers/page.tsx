// Vanigam Commerce - Admin Customers Page (Server Component)

import React from 'react';
import db from '@/lib/db';
import { AuthEngine } from '@/lib/auth';
import { Roles } from '@/lib/types';
import { CustomersClient } from './CustomersClient';

export const revalidate = 0;

export default async function AdminCustomersPage() {
  const session = await AuthEngine.getSessionUserFromCookies();

  const [total, users] = await Promise.all([
    db.user.count({
      where: {
        businessId: session?.businessId,
        role: { in: [Roles.CUSTOMER, 'B2B'] },
      },
    }),
    db.user.findMany({
      where: {
        businessId: session?.businessId,
        role: { in: [Roles.CUSTOMER, 'B2B'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        customerProfile: {
          select: {
            totalSpent: true,
            orderCount: true,
            notes: true,
          },
        },
        b2bProfile: {
          select: {
            companyName: true,
            creditLimit: true,
            availableCredit: true,
            status: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true,
          },
        },
      },
    }),
  ]);

  const initialCustomers = users.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    orderCount: u._count.orders || u.customerProfile?.orderCount || 0,
    totalSpent: u.customerProfile?.totalSpent || 0,
    notes: u.customerProfile?.notes || null,
    b2b: u.b2bProfile || null,
    addressCount: u._count.addresses,
    reviewCount: u._count.reviews,
  }));

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl min-w-0">
      <CustomersClient initialCustomers={initialCustomers} totalCount={total} />
    </div>
  );
}
