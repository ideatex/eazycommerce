// Vanigam Commerce - Inventory Management Server Page

import React from 'react';
import db from '@/lib/db';
import { AuthEngine } from '@/lib/auth';
import { InventoryAdminClient } from './InventoryAdminClient';

export const revalidate = 0;

export default async function AdminInventoryPage() {
  const session = await AuthEngine.getSessionUserFromCookies();

  const variants = await db.productVariant.findMany({
    where: {
      product: { businessId: session?.businessId },
    },
    orderBy: [{ stock: 'asc' }, { updatedAt: 'desc' }],
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: { select: { name: true } },
        },
      },
      movements: {
        take: 8,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const serialized = variants.map((v) => {
    const available = Math.max(0, v.stock - v.reservedStock);
    let status = 'IN_STOCK';
    if (v.stock <= 0) status = 'OUT_OF_STOCK';
    else if (available <= 15) status = 'LOW_STOCK';

    return {
      id: v.id,
      productId: v.productId,
      productTitle: v.product.title,
      productSlug: v.product.slug,
      categoryName: v.product.category?.name || 'Uncategorized',
      sku: v.sku,
      variantTitle: v.title,
      price: v.price,
      stock: v.stock,
      reservedStock: v.reservedStock,
      availableStock: available,
      status,
      movements: v.movements.map((m) => ({
        id: m.id,
        type: m.type,
        quantity: m.quantity,
        previousStock: m.previousStock,
        newStock: m.newStock,
        referenceId: m.referenceId,
        notes: m.notes,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl min-w-0">
      <InventoryAdminClient initialVariants={serialized} />
    </div>
  );
}
