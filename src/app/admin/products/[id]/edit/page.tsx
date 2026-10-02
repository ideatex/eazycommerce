// Vanigam Commerce - Admin Edit Product Page (Server Component)

import React from 'react';
import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { AuthEngine } from '@/lib/auth';
import { ProductEditorClient } from '../../new/ProductEditorClient';

export const revalidate = 0;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await AuthEngine.getSessionUserFromCookies();

  const [product, categories] = await Promise.all([
    db.product.findFirst({
      where: {
        id,
        businessId: session?.businessId,
      },
      include: {
        category: { select: { id: true, name: true } },
        variants: true,
        images: { orderBy: { sortOrder: 'asc' } },
        priceTiers: { orderBy: { minQuantity: 'asc' } },
      },
    }),
    db.category.findMany({
      where: { isActive: true, businessId: session?.businessId },
      select: { id: true, name: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductEditorClient
      categories={categories}
      initialProduct={product as any}
    />
  );
}
