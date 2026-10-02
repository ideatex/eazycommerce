'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Store,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Archive,
  Eye,
  Sparkles,
  Layers,
  FileEdit,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  CardContent,
  Modal,
  DataTable,
  Column,
  PageHeader,
} from '@/components/ui';

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  sku: string;
  basePrice: number;
  status: string;
  moq: number;
  hsnCode?: string | null;
  tags?: string | null;
  category?: { id: string; name: string } | null;
  variants: Array<{ id: string; stock: number; reservedStock: number; price: number }>;
  images: Array<{ url: string }>;
}

interface CategoryItem {
  id: string;
  name: string;
}

interface ProductsAdminClientProps {
  initialProducts: ProductItem[];
  categories: CategoryItem[];
}

export function ProductsAdminClient({
  initialProducts,
  categories,
}: ProductsAdminClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editMoq, setEditMoq] = useState('');
  const [editStatus, setEditStatus] = useState('PUBLISHED');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setEditTitle(p.title);
    setEditPrice(p.basePrice.toString());
    const totalStock = p.variants.reduce((acc, v) => acc + (v.stock - v.reservedStock), 0);
    setEditStock(totalStock.toString());
    setEditMoq(p.moq.toString());
    setEditStatus(p.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          basePrice: parseFloat(editPrice),
          stock: parseInt(editStock),
          moq: parseInt(editMoq),
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  title: editTitle,
                  basePrice: parseFloat(editPrice),
                  status: editStatus,
                  moq: parseInt(editMoq),
                  variants: p.variants.map((v, i) =>
                    i === 0 ? { ...v, stock: parseInt(editStock), price: parseFloat(editPrice) } : v
                  ),
                }
              : p
          )
        );
        setIsEditModalOpen(false);
        showFeedback('success', `Product '${editTitle}' updated successfully.`);
      } else {
        showFeedback('error', data.error?.message || 'Failed to update product');
      }
    } catch {
      showFeedback('error', 'Network error updating product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (productId: string, title: string) => {
    if (!confirm(`Are you sure you want to archive '${title}'? It will be hidden from the storefront.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: 'ARCHIVED' } : p))
        );
        showFeedback('success', `Product '${title}' archived.`);
      } else {
        showFeedback('error', data.error?.message || 'Failed to archive product');
      }
    } catch {
      showFeedback('error', 'Network error archiving product');
    }
  };

  // Bulk Actions: each request is checked, and only products the server confirmed are updated.
  const runBulk = async (ids: string[], request: (id: string) => Promise<Response>): Promise<string[]> => {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await request(id);
          const json = await res.json();
          return json.success ? id : null;
        } catch {
          return null;
        }
      })
    );
    return results.filter((id): id is string => id !== null);
  };

  const handleBulkArchive = async (ids: string[]) => {
    if (!confirm(`Archive ${ids.length} selected products?`)) return;

    const done = await runBulk(ids, (id) => fetch(`/api/products/${id}`, { method: 'DELETE' }));
    setProducts((prev) => prev.map((p) => (done.includes(p.id) ? { ...p, status: 'ARCHIVED' } : p)));
    setSelectedIds((prev) => prev.filter((id) => !done.includes(id)));
    if (done.length === ids.length) showFeedback('success', `${done.length} products archived.`);
    else showFeedback('error', `Only ${done.length} of ${ids.length} products could be archived.`);
  };

  const handleBulkPublish = async (ids: string[]) => {
    const done = await runBulk(ids, (id) =>
      fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      })
    );
    setProducts((prev) => prev.map((p) => (done.includes(p.id) ? { ...p, status: 'PUBLISHED' } : p)));
    setSelectedIds((prev) => prev.filter((id) => !done.includes(id)));
    if (done.length === ids.length) showFeedback('success', `${done.length} products published to storefront.`);
    else showFeedback('error', `Only ${done.length} of ${ids.length} products could be published.`);
  };

  // Tab Counts
  const totalCount = products.length;
  const publishedCount = products.filter((p) => p.status === 'PUBLISHED').length;
  const archivedCount = products.filter((p) => p.status === 'ARCHIVED').length;
  const lowStockCount = products.filter(
    (p) => p.variants.reduce((acc, v) => acc + (v.stock - v.reservedStock), 0) <= 15
  ).length;

  const tabs = [
    { id: 'ALL', label: 'All Catalog', count: totalCount },
    { id: 'PUBLISHED', label: 'Published Active', count: publishedCount },
    { id: 'LOW_STOCK', label: 'Low Inventory', count: lowStockCount },
    { id: 'ARCHIVED', label: 'Archived', count: archivedCount },
  ];

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const totalStock = p.variants.reduce((acc, v) => acc + (v.stock - v.reservedStock), 0);
      if (activeTab === 'PUBLISHED' && p.status !== 'PUBLISHED') return false;
      if (activeTab === 'ARCHIVED' && p.status !== 'ARCHIVED') return false;
      if (activeTab === 'LOW_STOCK' && totalStock > 15) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        if (!matchTitle && !matchSku) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortColumn === 'title') {
        return sortDirection === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      if (sortColumn === 'price') {
        return sortDirection === 'asc' ? a.basePrice - b.basePrice : b.basePrice - a.basePrice;
      }
      if (sortColumn === 'stock') {
        const aStock = a.variants.reduce((acc, v) => acc + (v.stock - v.reservedStock), 0);
        const bStock = b.variants.reduce((acc, v) => acc + (v.stock - v.reservedStock), 0);
        return sortDirection === 'asc' ? aStock - bStock : bStock - aStock;
      }
      return 0;
    });
  }, [products, activeTab, searchQuery, sortColumn, sortDirection]);

  // Table Columns Definition
  const columns: Column<ProductItem>[] = [
    {
      key: 'title',
      label: 'Product Item',
      sortable: true,
      render: (p) => {
        const img = p.images[0]?.url;
        return (
          <div className="flex items-center gap-3">
            {img ? (
              <img
                src={img}
                alt={p.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800';
                }}
                className="w-10 h-10 rounded-md object-cover border border-neutral-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs shrink-0">
                <Package className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <Link
                href={`/products/${p.slug}`}
                target="_blank"
                className="font-semibold text-neutral-900 hover:underline block truncate max-w-xs"
              >
                {p.title}
              </Link>
              <span className="text-[11px] text-neutral-400 block">
                {p.category?.name || 'General Catalog'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'sku',
      label: 'SKU Identifier',
      render: (p) => (
        <span className="font-mono text-neutral-700 text-xs font-medium">
          {p.sku}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => (
        <Badge
          variant={
            p.status === 'PUBLISHED'
              ? 'success'
              : p.status === 'ARCHIVED'
              ? 'neutral'
              : 'warning'
          }
        >
          {p.status}
        </Badge>
      ),
    },
    {
      key: 'price',
      label: 'Unit Price',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono-numeric font-semibold text-neutral-900">
          ₹{p.basePrice.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock On Hand',
      sortable: true,
      align: 'center',
      render: (p) => {
        const totalStock = p.variants.reduce((acc, v) => acc + (v.stock - v.reservedStock), 0);
        return (
          <span
            className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full ${
              totalStock <= 0
                ? 'bg-rose-100 text-rose-800'
                : totalStock <= 15
                ? 'bg-amber-100 text-amber-800'
                : 'bg-neutral-100 text-neutral-800'
            }`}
          >
            {totalStock} in stock
          </span>
        );
      },
    },
    {
      key: 'moq',
      label: 'MOQ',
      align: 'center',
      render: (p) => <span className="font-mono text-neutral-700">{p.moq}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/admin/products/${p.id}/edit`}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded border border-neutral-200 hover:bg-neutral-50 transition-colors"
            title="Edit Full Specifications & Tiers"
            aria-label="Edit Full Specifications"
          >
            <FileEdit className="w-3.5 h-3.5 text-blue-600" />
          </Link>
          <button
            onClick={() => handleOpenEdit(p)}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded border border-neutral-200 hover:bg-neutral-50 transition-colors"
            title="Quick Edit"
            aria-label="Quick edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/products/${p.slug}`}
            target="_blank"
            className="p-1.5 text-neutral-400 hover:text-neutral-800 rounded border border-neutral-200 hover:bg-neutral-50 transition-colors"
            title="View Live"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          {p.status !== 'ARCHIVED' && (
            <button
              onClick={() => handleArchive(p.id, p.title)}
              className="p-1.5 text-neutral-400 hover:text-rose-600 rounded border border-neutral-200 hover:bg-neutral-50 transition-colors"
              title="Archive Product"
              aria-label="Archive"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl min-w-0">
      {/* Page Header with Action Buttons */}
      <PageHeader
        title="Products Catalog"
        description="Comprehensive inventory management, pricing tiers, variant attributes, and publication control."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Products' },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              href="/shop-with-sidebar"
              target="_blank"
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Live Catalog
            </Button>
            <Button
              variant="primary"
              size="sm"
              href="/admin/products/new"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Product
            </Button>
          </div>
        }
      />

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 text-xs rounded-xl border flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-neutral-400 hover:text-neutral-700 text-xs px-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 font-medium block">Total Catalog Items</span>
            <span className="text-2xl font-bold text-neutral-900 mt-1 block font-mono-numeric">
              {totalCount}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 font-medium block">Active Storefront</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block font-mono-numeric">
              {publishedCount}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 font-medium block">Low Stock Alert (≤15)</span>
            <span className={`text-2xl font-bold mt-1 block font-mono-numeric ${lowStockCount > 0 ? 'text-amber-700' : 'text-neutral-800'}`}>
              {lowStockCount}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 font-medium block">Archived SKUs</span>
            <span className="text-2xl font-bold text-neutral-500 mt-1 block font-mono-numeric">
              {archivedCount}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Advanced DataTable */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        keyField="id"
        selectedIds={selectedIds}
        onSelect={setSelectedIds}
        searchPlaceholder="Filter by title or SKU code..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={(col) => {
          if (sortColumn === col) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortColumn(col);
            setSortDirection('asc');
          }
        }}
        bulkActions={[
          {
            label: 'Publish to Storefront',
            onClick: handleBulkPublish,
          },
          {
            label: 'Archive Selected',
            variant: 'danger',
            onClick: handleBulkArchive,
          },
        ]}
      />

      {/* Quick Edit Modal */}
      {editingProduct && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Product: ${editingProduct.sku}`}
          description="Adjust price, stock level, minimum order quantity, or publishing state."
          size="md"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                form="edit-product-form"
                isLoading={isSubmitting}
              >
                Save Changes
              </Button>
            </>
          }
        >
          <form id="edit-product-form" onSubmit={handleSaveEdit} className="space-y-4">
            <Input
              label="Product Title"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Base Price (₹)"
                type="number"
                required
                min="1"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
              <Input
                label="Available Stock"
                type="number"
                required
                min="0"
                value={editStock}
                onChange={(e) => setEditStock(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="MOQ (Minimum Order Qty)"
                type="number"
                min="1"
                value={editMoq}
                onChange={(e) => setEditMoq(e.target.value)}
              />
              <Select
                label="Status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                options={[
                  { label: 'PUBLISHED', value: 'PUBLISHED' },
                  { label: 'DRAFT', value: 'DRAFT' },
                  { label: 'ARCHIVED', value: 'ARCHIVED' },
                ]}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
