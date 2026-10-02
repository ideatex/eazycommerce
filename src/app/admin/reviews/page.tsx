// Vanigam Commerce - Review Moderation Server Page

import React from 'react';
import db from '@/lib/db';
import { AuthEngine } from '@/lib/auth';
import { ReviewsAdminClient } from './ReviewsAdminClient';

export const revalidate = 0;

export default async function AdminReviewsPage() {
  const session = await AuthEngine.getSessionUserFromCookies();

  const reviews = await db.productReview.findMany({
    where: {
      product: { businessId: session?.businessId },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
      product: { select: { id: true, title: true, slug: true } },
    },
  });

  const serialized = reviews.map((r) => ({
    id: r.id,
    productId: r.productId,
    productTitle: r.product.title,
    productSlug: r.product.slug,
    customerId: r.customerId,
    customerName: r.customer.fullName,
    customerEmail: r.customer.email ?? '',
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    isVerifiedPurchase: r.isVerifiedPurchase,
    isApproved: r.isApproved,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl min-w-0">
      <ReviewsAdminClient initialReviews={serialized} />
    </div>
  );
}
