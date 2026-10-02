'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import {
  Button,
  Badge,
  DataTable,
  Column,
  PageHeader,
  Modal,
  Card,
  CardContent
} from '@/components/ui';

interface ReviewItem {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
}

interface ReviewsAdminClientProps {
  initialReviews: ReviewItem[];
}

export function ReviewsAdminClient({ initialReviews }: ReviewsAdminClientProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleApproval = async (id: string, currentApproved: boolean) => {
    setIsUpdating(id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: !currentApproved }),
      });
      const json = await res.json();
      if (json.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isApproved: !currentApproved } : r))
        );
        showFeedback('success', `Review ${!currentApproved ? 'approved and published' : 'hidden from storefront'}.`);
      } else {
        showFeedback('error', json.error?.message || 'Failed to update review status');
      }
    } catch {
      showFeedback('error', 'Network error updating review');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingReview) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${deletingReview.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setReviews((prev) => prev.filter((r) => r.id !== deletingReview.id));
        showFeedback('success', 'Review deleted permanently.');
        setDeletingReview(null);
      } else {
        showFeedback('error', json.error?.message || 'Failed to delete review');
      }
    } catch {
      showFeedback('error', 'Network error deleting review');
    }
  };

  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.productTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase()) ||
      (r.title && r.title.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === 'PENDING') return !r.isApproved;
    if (activeTab === 'APPROVED') return r.isApproved;
    return true;
  });

  const columns: Column<ReviewItem>[] = [
    {
      key: 'product',
      label: 'Product',
      sortable: true,
      render: (item) => (
        <div className="min-w-0 max-w-xs">
          <Link
            href={`/products/${item.productSlug}`}
            target="_blank"
            className="font-semibold text-neutral-900 hover:underline block truncate"
          >
            {item.productTitle}
          </Link>
          <span className="text-[11px] text-neutral-400 font-mono block truncate">
            ID: {item.productId.substring(0, 8)}...
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (item) => (
        <div>
          <span className="font-semibold text-neutral-800 block truncate">{item.customerName}</span>
          <span className="text-[11px] text-neutral-400 block truncate">{item.customerEmail}</span>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      align: 'center',
      render: (item) => (
        <div>
          <div className="flex items-center justify-center gap-0.5 text-amber-500">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                className={`w-3 h-3 ${
                  idx < item.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                }`}
              />
            ))}
          </div>
          {item.isVerifiedPurchase && (
            <span className="text-[9px] font-medium text-emerald-700 block mt-0.5">
              ✓ Verified Buyer
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'comment',
      label: 'Customer Review',
      render: (item) => (
        <div className="max-w-md text-xs">
          {item.title && <span className="font-semibold text-neutral-900 block mb-0.5">{item.title}</span>}
          <p className="text-neutral-600 text-[11px] line-clamp-2 leading-relaxed">{item.comment}</p>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      align: 'right',
      render: (item) => (
        <span className="text-[11px] text-neutral-500 font-mono">
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (item) => (
        <Badge variant={item.isApproved ? 'success' : 'warning'}>
          {item.isApproved ? 'Approved' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant={item.isApproved ? 'outline' : 'primary'}
            onClick={() => handleToggleApproval(item.id, item.isApproved)}
            disabled={isUpdating === item.id}
            className="text-xs h-7 px-2"
          >
            {item.isApproved ? 'Hide' : 'Approve'}
          </Button>

          <button
            onClick={() => setDeletingReview(item)}
            className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete Review"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Reviews & Ratings"
        description="Moderate customer testimonials, verify authenticity, and control storefront review publication."
      />

      {feedback && (
        <div
          className={`p-3 text-xs rounded-md border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Catalog Average Rating</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric flex items-center gap-2">
              <span>{avgRating}</span>
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Across {reviews.length} total customer ratings
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Pending Moderation</span>
            <div className="text-2xl font-bold text-amber-700 font-mono-numeric">
              {pendingCount}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Reviews awaiting staff approval
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Published Testimonials</span>
            <div className="text-2xl font-bold text-emerald-700 font-mono-numeric">
              {approvedCount}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Live on product detail pages
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Reviews Table */}
      <DataTable
        columns={columns}
        data={filteredReviews}
        keyField="id"
        searchPlaceholder="Search reviews by product, customer, or keyword..."
        searchValue={search}
        onSearchChange={setSearch}
        tabs={[
          { id: 'ALL', label: 'All Reviews', count: reviews.length },
          { id: 'PENDING', label: 'Pending Approval', count: pendingCount },
          { id: 'APPROVED', label: 'Approved & Live', count: approvedCount },
        ]}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as any)}
      />

      {/* Delete Review Confirmation Modal */}
      <Modal
        isOpen={!!deletingReview}
        onClose={() => setDeletingReview(null)}
        title="Confirm Review Deletion"
      >
        <div className="space-y-4 pt-2 text-xs">
          <p className="text-neutral-700">
            Are you sure you want to permanently delete this {deletingReview?.rating}-star review for{' '}
            <strong className="text-neutral-900">{deletingReview?.productTitle}</strong>?
          </p>

          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-600 italic">
            "{deletingReview?.comment}"
          </div>

          <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingReview(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
