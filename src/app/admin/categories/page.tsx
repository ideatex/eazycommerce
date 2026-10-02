// Vanigam Commerce - Category Management Server Page

import React from 'react';
import db from '@/lib/db';
import { AuthEngine } from '@/lib/auth';
import { CategoriesAdminClient } from './CategoriesAdminClient';

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const session = await AuthEngine.getSessionUserFromCookies();

  const categories = await db.category.findMany({
    where: {
      businessId: session?.businessId,
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true, slug: true } },
      _count: { select: { products: true } },
    },
  });

  const serialized = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    parentId: c.parentId,
    parentName: c.parent?.name || null,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    productCount: c._count.products,
    subcategories: c.children,
  }));

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl min-w-0">
      <CategoriesAdminClient initialCategories={serialized} />
    </div>
  );
}
