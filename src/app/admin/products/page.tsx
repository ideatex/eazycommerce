import React from 'react';
import db from '@/lib/db';
import { requireAdminScope } from '@/lib/adminScope';
import { ProductsAdminClient } from './ProductsAdminClient';

export default async function AdminProductsPage() {
  const { businessId } = await requireAdminScope();
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        variants: { select: { id: true, stock: true, reservedStock: true, price: true } },
        images: { select: { url: true }, take: 1, orderBy: { sortOrder: 'asc' } },
      },
    }),
    db.category.findMany({
      where: { isActive: true, businessId },
      select: { id: true, name: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return (
    <ProductsAdminClient
      initialProducts={products as any}
      categories={categories}
    />
  );
}
