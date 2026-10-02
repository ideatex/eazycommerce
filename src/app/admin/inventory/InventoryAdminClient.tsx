'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  AlertTriangle,
  History,
  Edit,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  PackageX,
  Plus,
  Minus
} from 'lucide-react';
import {
  Button,
  Badge,
  DataTable,
  Column,
  PageHeader,
  Modal,
  Input,
  Card,
  CardContent
} from '@/components/ui';

interface MovementRecord {
  id: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

interface InventoryVariant {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  categoryName: string;
  sku: string;
  variantTitle: string;
  price: number;
  stock: number;
  reservedStock: number;
  availableStock: number;
  status: string;
  movements: MovementRecord[];
}

interface InventoryAdminClientProps {
  initialVariants: InventoryVariant[];
}

export function InventoryAdminClient({ initialVariants }: InventoryAdminClientProps) {
  const [variants, setVariants] = useState<InventoryVariant[]>(initialVariants);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'IN_STOCK'>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Adjustment Modal
  const [adjustingVariant, setAdjustingVariant] = useState<InventoryVariant | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Movement Ledger Modal
  const [historyVariant, setHistoryVariant] = useState<InventoryVariant | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const openAdjustModal = (variant: InventoryVariant) => {
    setAdjustingVariant(variant);
    setNewStock(variant.stock);
    setReason('Warehouse cycle count reconciliation');
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingVariant) return;

    if (!reason.trim()) {
      showFeedback('error', 'A reason note is required for auditable inventory adjustments.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: adjustingVariant.id,
          newStock: Number(newStock),
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        const { variant: updatedVariant, movement, availableStock } = json.data;
        let nextStatus = 'IN_STOCK';
        if (updatedVariant.stock <= 0) nextStatus = 'OUT_OF_STOCK';
        else if (availableStock <= 15) nextStatus = 'LOW_STOCK';

        setVariants((prev) =>
          prev.map((v) =>
            v.id === adjustingVariant.id
              ? {
                  ...v,
                  stock: updatedVariant.stock,
                  availableStock,
                  status: nextStatus,
                  movements: [movement, ...v.movements],
                }
              : v
          )
        );

        showFeedback('success', `SKU ${adjustingVariant.sku} stock adjusted to ${updatedVariant.stock} units.`);
        setAdjustingVariant(null);
      } else {
        showFeedback('error', json.error?.message || 'Failed to adjust stock');
      }
    } catch {
      showFeedback('error', 'Network error during inventory adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPhysicalStock = variants.reduce((acc, v) => acc + v.stock, 0);
  const totalReserved = variants.reduce((acc, v) => acc + v.reservedStock, 0);
  const totalAvailable = variants.reduce((acc, v) => acc + v.availableStock, 0);
  const lowStockCount = variants.filter((v) => v.status === 'LOW_STOCK').length;
  const outOfStockCount = variants.filter((v) => v.status === 'OUT_OF_STOCK').length;

  const filteredVariants = variants.filter((v) => {
    const matches =
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.productTitle.toLowerCase().includes(search.toLowerCase()) ||
      v.variantTitle.toLowerCase().includes(search.toLowerCase());

    if (!matches) return false;
    if (activeTab === 'LOW_STOCK') return v.status === 'LOW_STOCK';
    if (activeTab === 'OUT_OF_STOCK') return v.status === 'OUT_OF_STOCK';
    if (activeTab === 'IN_STOCK') return v.status === 'IN_STOCK';
    return true;
  });

  const columns: Column<InventoryVariant>[] = [
    {
      key: 'sku',
      label: 'SKU & Variant',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-mono font-bold text-xs text-neutral-900 block tracking-tight">
            {item.sku}
          </span>
          <span className="text-[11px] text-neutral-500 block truncate">
            {item.variantTitle !== 'Default' ? item.variantTitle : 'Primary Stock'}
          </span>
        </div>
      ),
    },
    {
      key: 'product',
      label: 'Product Title',
      sortable: true,
      render: (item) => (
        <div className="max-w-xs">
          <Link
            href={`/products/${item.productSlug}`}
            target="_blank"
            className="font-semibold text-neutral-900 hover:underline block truncate"
          >
            {item.productTitle}
          </Link>
          <span className="text-[11px] text-neutral-400 block truncate">
            {item.categoryName}
          </span>
        </div>
      ),
    },
    {
      key: 'physicalStock',
      label: 'On Hand',
      align: 'right',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-neutral-800">
          {item.stock}
        </span>
      ),
    },
    {
      key: 'reserved',
      label: 'Committed',
      align: 'right',
      render: (item) => (
        <span className="font-mono text-xs text-amber-700">
          {item.reservedStock}
        </span>
      ),
    },
    {
      key: 'available',
      label: 'Available',
      align: 'right',
      render: (item) => (
        <span
          className={`font-mono text-xs font-bold ${
            item.availableStock <= 0
              ? 'text-rose-600'
              : item.availableStock <= 15
              ? 'text-amber-600'
              : 'text-emerald-700'
          }`}
        >
          {item.availableStock}
        </span>
      ),
    },
    {
      key: 'health',
      label: 'Status',
      align: 'center',
      render: (item) => (
        <Badge
          variant={
            item.status === 'OUT_OF_STOCK'
              ? 'error'
              : item.status === 'LOW_STOCK'
              ? 'warning'
              : 'success'
          }
        >
          {item.status === 'OUT_OF_STOCK'
            ? 'Depleted'
            : item.status === 'LOW_STOCK'
            ? 'Low Stock'
            : 'Optimal'}
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
            variant="outline"
            onClick={() => openAdjustModal(item)}
            className="text-xs h-7 px-2.5"
          >
            <Edit className="w-3 h-3 mr-1" />
            <span>Adjust</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setHistoryVariant(item)}
            className="text-xs h-7 px-2 text-neutral-500 hover:text-neutral-900"
            title="View Movement Ledger"
          >
            <History className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Stock Movement Ledger"
        description="Monitor physical stock levels, manage fulfillment reservations, and audit manual cycle adjustments."
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

      {/* Critical Replenishment Alert Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold">
                {outOfStockCount > 0 && `${outOfStockCount} SKUs Out of Stock. `}
                {lowStockCount > 0 && `${lowStockCount} SKUs at or below safe reorder levels (15 units).`}
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                Initiate supplier purchase orders or artisan workshop restocking to prevent order fulfillment delays.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveTab('LOW_STOCK')}
            className="text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100/50 shrink-0"
          >
            Filter Critical SKUs →
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Physical Warehouse Stock</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              {totalPhysicalStock.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Units across all variants
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Order Reservations</span>
            <div className="text-2xl font-bold text-amber-700 font-mono-numeric">
              {totalReserved.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Committed to active shipments
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Available for Sale</span>
            <div className="text-2xl font-bold text-emerald-700 font-mono-numeric">
              {totalAvailable.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1 font-mono-numeric">
              Unencumbered units
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Critical Reorder SKUs</span>
            <div className="text-2xl font-bold text-rose-700 font-mono-numeric">
              {lowStockCount + outOfStockCount}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              {outOfStockCount} depleted, {lowStockCount} below threshold
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Inventory Table */}
      <DataTable
        columns={columns}
        data={filteredVariants}
        keyField="id"
        searchPlaceholder="Search inventory by SKU or product name..."
        searchValue={search}
        onSearchChange={setSearch}
        tabs={[
          { id: 'ALL', label: 'All SKUs', count: variants.length },
          { id: 'LOW_STOCK', label: 'Low Stock Warnings', count: lowStockCount },
          { id: 'OUT_OF_STOCK', label: 'Depleted', count: outOfStockCount },
          { id: 'IN_STOCK', label: 'Optimal Stock', count: variants.length - lowStockCount - outOfStockCount },
        ]}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as any)}
      />

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!adjustingVariant}
        onClose={() => setAdjustingVariant(null)}
        title="Manual Stock Adjustment"
      >
        {adjustingVariant && (
          <form onSubmit={handleSaveAdjustment} className="space-y-4 pt-2 text-xs">
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
              <span className="font-mono font-bold text-neutral-900 block text-xs">
                {adjustingVariant.sku}
              </span>
              <span className="text-neutral-700 block">{adjustingVariant.productTitle}</span>
              <span className="text-neutral-400 text-[11px]">
                {adjustingVariant.variantTitle}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-500 block mb-1 font-medium">
                  Current Physical Stock
                </label>
                <div className="p-2 bg-neutral-100 border border-neutral-200 rounded text-neutral-800 font-mono font-bold text-sm">
                  {adjustingVariant.stock} units
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-800 block mb-1">
                  New Physical Stock *
                </label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  className="font-mono font-bold text-sm"
                />
              </div>
            </div>

            {/* Live Difference Calculation */}
            <div className="p-2.5 rounded-md border flex items-center justify-between text-xs bg-neutral-50 border-neutral-200">
              <span className="text-neutral-600">Net Inventory Movement:</span>
              <span
                className={`font-mono font-bold ${
                  newStock - adjustingVariant.stock > 0
                    ? 'text-emerald-700'
                    : newStock - adjustingVariant.stock < 0
                    ? 'text-rose-600'
                    : 'text-neutral-500'
                }`}
              >
                {newStock - adjustingVariant.stock > 0
                  ? `+${newStock - adjustingVariant.stock} units (Restock)`
                  : newStock - adjustingVariant.stock < 0
                  ? `${newStock - adjustingVariant.stock} units (Reduction)`
                  : 'No change'}
              </span>
            </div>

            <div>
              <label className="font-semibold text-neutral-800 block mb-1">
                Audit Reason / Reference *
              </label>
              <Input
                required
                placeholder="e.g. Received batch #4829 from atelier, or damaged freight return"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustingVariant(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting || newStock === adjustingVariant.stock}
              >
                {isSubmitting ? 'Recording...' : 'Commit Adjustment'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Movement History Ledger Modal */}
      <Modal
        isOpen={!!historyVariant}
        onClose={() => setHistoryVariant(null)}
        title={`Movement Ledger — ${historyVariant?.sku || ''}`}
      >
        <div className="space-y-4 pt-2 text-xs">
          <div className="text-neutral-500 text-[11px]">
            Showing recorded transactions for{' '}
            <strong className="text-neutral-800">{historyVariant?.productTitle}</strong>.
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 border border-neutral-200 rounded-md">
            {historyVariant?.movements.length === 0 ? (
              <div className="p-6 text-center text-neutral-400">
                No historical movements logged for this SKU yet.
              </div>
            ) : (
              historyVariant?.movements.map((m) => (
                <div key={m.id} className="p-3 space-y-1 hover:bg-neutral-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900 font-mono text-[11px]">
                      {m.type}
                    </span>
                    <span
                      className={`font-mono font-bold text-xs ${
                        m.quantity > 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
                    </span>
                  </div>

                  <p className="text-neutral-600 text-[11px] leading-relaxed">
                    {m.notes || 'System transaction'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-0.5">
                    <span>
                      Stock transition: {m.previousStock} → {m.newStock}
                    </span>
                    <span>
                      {new Date(m.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryVariant(null)}
            >
              Close Ledger
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
