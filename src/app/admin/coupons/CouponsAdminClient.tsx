'use client';

import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Percent,
  Calendar,
  Check
} from 'lucide-react';
import {
  Button,
  Badge,
  DataTable,
  Column,
  PageHeader,
  Modal,
  Input,
  Select,
  Textarea,
  Card,
  CardContent
} from '@/components/ui';

interface CouponItem {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  timesUsed: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CouponsAdminClientProps {
  initialCoupons: CouponItem[];
}

export function CouponsAdminClient({ initialCoupons }: CouponsAdminClientProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 0,
    maxDiscount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deletingCoupon, setDeletingCoupon] = useState<CouponItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 500,
      maxDiscount: '500',
      usageLimit: '100',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount !== null ? String(coupon.maxDiscount) : '',
      usageLimit: coupon.usageLimit !== null ? String(coupon.usageLimit) : '',
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
      endDate: coupon.endDate ? coupon.endDate.split('T')[0] : '',
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c))
        );
        showFeedback('success', `Coupon status updated.`);
      } else {
        showFeedback('error', json.error?.message || 'Failed to update coupon status');
      }
    } catch {
      showFeedback('error', 'Network error toggling coupon status');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCoupon) {
        // Update coupon
        const res = await fetch('/api/coupons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCoupon.id,
            description: formData.description || undefined,
            discountValue: Number(formData.discountValue),
            minOrderValue: Number(formData.minOrderValue),
            maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
            usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
            isActive: formData.isActive,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setCoupons((prev) =>
            prev.map((c) =>
              c.id === editingCoupon.id
                ? {
                    ...c,
                    description: formData.description || null,
                    discountValue: Number(formData.discountValue),
                    minOrderValue: Number(formData.minOrderValue),
                    maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
                    usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
                    isActive: formData.isActive,
                  }
                : c
            )
          );
          showFeedback('success', `Coupon '${editingCoupon.code}' updated.`);
          setIsModalOpen(false);
        } else {
          showFeedback('error', json.error?.message || 'Failed to update coupon');
        }
      } else {
        // Create new coupon
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: formData.code.trim().toUpperCase(),
            description: formData.description || undefined,
            discountType: formData.discountType,
            discountValue: Number(formData.discountValue),
            minOrderValue: Number(formData.minOrderValue),
            maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
            usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
            startDate: formData.startDate || undefined,
            endDate: formData.endDate || undefined,
            isActive: formData.isActive,
          }),
        });
        const json = await res.json();
        if (json.success) {
          const created = json.data;
          setCoupons((prev) => [
            {
              id: created.id,
              code: created.code,
              description: created.description,
              discountType: created.discountType,
              discountValue: created.discountValue,
              minOrderValue: created.minOrderValue,
              maxDiscount: created.maxDiscount,
              usageLimit: created.usageLimit,
              timesUsed: created.timesUsed,
              startDate: created.startDate,
              endDate: created.endDate,
              isActive: created.isActive,
              createdAt: created.createdAt,
            },
            ...prev,
          ]);
          showFeedback('success', `Coupon '${formData.code.toUpperCase()}' created.`);
          setIsModalOpen(false);
        } else {
          showFeedback('error', json.error?.message || 'Failed to create coupon');
        }
      }
    } catch {
      showFeedback('error', 'Network error saving coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCoupon) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/coupons?id=${deletingCoupon.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== deletingCoupon.id));
        showFeedback('success', `Coupon '${deletingCoupon.code}' deleted.`);
        setDeletingCoupon(null);
      } else {
        showFeedback('error', json.error?.message || 'Failed to delete coupon');
      }
    } catch {
      showFeedback('error', 'Network error deleting coupon');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const matches =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

    if (!matches) return false;
    if (activeTab === 'ACTIVE') return c.isActive;
    if (activeTab === 'INACTIVE') return !c.isActive;
    return true;
  });

  const totalRedemptions = coupons.reduce((acc, c) => acc + c.timesUsed, 0);

  const columns: Column<CouponItem>[] = [
    {
      key: 'code',
      label: 'Coupon Code',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-mono font-bold text-xs text-neutral-900 tracking-wider">
              {item.code}
            </span>
            {item.description && (
              <span className="text-[11px] text-neutral-500 block truncate max-w-xs">
                {item.description}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'discount',
      label: 'Discount Offer',
      render: (item) => (
        <div className="text-xs">
          <span className="font-semibold text-neutral-900 font-mono">
            {item.discountType === 'PERCENTAGE' ? `${item.discountValue}% OFF` : `₹${item.discountValue} Flat OFF`}
          </span>
          {item.maxDiscount && (
            <span className="text-[10px] text-neutral-400 block font-mono">
              (Up to ₹{item.maxDiscount})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'minOrder',
      label: 'Min Spend',
      align: 'right',
      render: (item) => (
        <span className="font-mono text-xs text-neutral-700">
          ₹{item.minOrderValue.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'usage',
      label: 'Usage / Cap',
      align: 'center',
      render: (item) => (
        <span className="font-mono text-xs text-neutral-800">
          {item.timesUsed} / {item.usageLimit || '∞'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (item) => (
        <button
          onClick={() => handleToggleActive(item.id, item.isActive)}
          className="cursor-pointer"
          title="Click to toggle status"
        >
          <Badge variant={item.isActive ? 'success' : 'neutral'}>
            {item.isActive ? 'Active' : 'Disabled'}
          </Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              navigator.clipboard.writeText(item.code);
              showFeedback('success', `Copied '${item.code}' to clipboard.`);
            }}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Copy Code"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Edit Coupon"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDeletingCoupon(item)}
            className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete Coupon"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Coupons & Promotional Rules"
          description="Manage percentage discounts, fixed allowances, minimum order thresholds, and redemption caps."
        />

        <Button
          size="sm"
          variant="primary"
          onClick={openCreateModal}
          className="text-xs h-8 px-3 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Create Coupon</span>
        </Button>
      </div>

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
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Configured Vouchers</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              {coupons.length}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Active promotional campaigns
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Total Customer Redemptions</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              {totalRedemptions}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Checkout vouchers applied
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Currently Active Rules</span>
            <div className="text-2xl font-bold text-emerald-700 font-mono-numeric">
              {coupons.filter((c) => c.isActive).length} Active
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              {coupons.filter((c) => !c.isActive).length} disabled rules
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Coupons Table */}
      <DataTable
        columns={columns}
        data={filteredCoupons}
        keyField="id"
        searchPlaceholder="Search coupons by code or description..."
        searchValue={search}
        onSearchChange={setSearch}
        tabs={[
          { id: 'ALL', label: 'All Rules', count: coupons.length },
          { id: 'ACTIVE', label: 'Active', count: coupons.filter((c) => c.isActive).length },
          { id: 'INACTIVE', label: 'Disabled', count: coupons.filter((c) => !c.isActive).length },
        ]}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as any)}
      />

      {/* Create / Edit Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? 'Edit Coupon Rule' : 'Create Promotional Coupon'}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              Coupon Code *
            </label>
            <Input
              required
              placeholder="e.g. FESTIVE20"
              value={formData.code}
              disabled={!!editingCoupon}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="font-mono text-xs font-bold uppercase tracking-wider"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              Campaign Description
            </label>
            <Input
              placeholder="e.g. 10% instant discount on orders above ₹1,000"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Discount Type
              </label>
              <Select
                value={formData.discountType}
                disabled={!!editingCoupon}
                onChange={(e) => setFormData((prev) => ({ ...prev, discountType: e.target.value }))}
                className="text-xs"
              >
                <option value="PERCENTAGE">Percentage (% Off)</option>
                <option value="FIXED">Fixed Amount (₹ Off)</option>
              </Select>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Discount Value *
              </label>
              <Input
                type="number"
                required
                min="1"
                value={formData.discountValue}
                onChange={(e) => setFormData((prev) => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                className="text-xs font-mono font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Min Order Spend (₹)
              </label>
              <Input
                type="number"
                min="0"
                value={formData.minOrderValue}
                onChange={(e) => setFormData((prev) => ({ ...prev, minOrderValue: parseFloat(e.target.value) || 0 }))}
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Max Discount Cap (₹)
              </label>
              <Input
                type="number"
                min="1"
                placeholder="Optional cap for %"
                value={formData.maxDiscount}
                onChange={(e) => setFormData((prev) => ({ ...prev, maxDiscount: e.target.value }))}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Total Redemption Limit
              </label>
              <Input
                type="number"
                min="1"
                placeholder="Blank for unlimited"
                value={formData.usageLimit}
                onChange={(e) => setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))}
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Rule Status
              </label>
              <Select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                className="text-xs"
              >
                <option value="true">Active & Ready</option>
                <option value="false">Disabled / Paused</option>
              </Select>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCoupon}
        onClose={() => setDeletingCoupon(null)}
        title="Confirm Coupon Deletion"
      >
        <div className="space-y-4 pt-2 text-xs">
          <p className="text-neutral-700">
            Are you sure you want to permanently delete coupon rule{' '}
            <strong className="text-neutral-900 font-mono">{deletingCoupon?.code}</strong>?
          </p>
          <p className="text-neutral-500">
            Existing historical orders that redeemed this coupon will remain preserved in audit records.
          </p>

          <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingCoupon(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
