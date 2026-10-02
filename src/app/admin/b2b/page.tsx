import React from 'react';
import db from '@/lib/db';
import { requireAdminScope } from '@/lib/adminScope';
import { B2BAdminClient } from './B2BAdminClient';

export default async function AdminB2BPage() {
  const { businessId } = await requireAdminScope();
  const accounts = await db.b2BProfile.findMany({
    where: { user: { businessId } },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 min-w-0 max-w-7xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          B2B Accounts
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Review corporate accounts, credit limits, and payment terms.
        </p>
      </div>

      <B2BAdminClient initialAccounts={accounts} />
    </div>
  );
}
