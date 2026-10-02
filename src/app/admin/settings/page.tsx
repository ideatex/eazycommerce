import React from 'react';
import db from '@/lib/db';
import { requireAdminScope } from '@/lib/adminScope';
import { SettingsClient } from './SettingsClient';

export default async function AdminSettingsPage() {
  const { businessId } = await requireAdminScope();
  const business = await db.business.findUnique({ where: { id: businessId } });

  if (!business) {
    return <div className="p-8 text-xs text-neutral-500">Business record not found.</div>;
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 min-w-0 max-w-7xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Settings
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Configure store details, tax identifiers, and commerce mode.
        </p>
      </div>

      <SettingsClient business={business} />
    </div>
  );
}
