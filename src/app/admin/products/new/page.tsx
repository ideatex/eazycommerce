import React from 'react';
import db from '@/lib/db';
import { requireAdminScope } from '@/lib/adminScope';
import { ProductEditorClient } from './ProductEditorClient';

export default async function NewProductPage() {
  const { businessId } = await requireAdminScope();
  const [categories] = await Promise.all([
    db.category.findMany({
      where: { isActive: true, businessId },
      select: { id: true, name: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return (
    <ProductEditorClient
      categories={categories}
    />
  );
}
