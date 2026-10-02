'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ChevronRight,
  Folder,
  FolderOpen
} from 'lucide-react';
import {
  Button,
  Badge,
  DataTable,
  Column,
  PageHeader,
  Modal,
  Input,
  Textarea,
  Select,
  Card,
  CardContent
} from '@/components/ui';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  parentName: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  subcategories: Array<{ id: string; name: string; slug: string }>;
}

interface CategoriesAdminClientProps {
  initialCategories: CategoryItem[];
}

export function CategoriesAdminClient({ initialCategories }: CategoriesAdminClientProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    parentId: '',
    sortOrder: 0,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      parentId: '',
      sortOrder: categories.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      parentId: cat.parentId || '',
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        // Update existing category
        const res = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCategory.id,
            name: formData.name,
            description: formData.description || null,
            imageUrl: formData.imageUrl || null,
            sortOrder: Number(formData.sortOrder),
            isActive: formData.isActive,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setCategories((prev) =>
            prev.map((c) =>
              c.id === editingCategory.id
                ? {
                    ...c,
                    name: formData.name,
                    description: formData.description || null,
                    imageUrl: formData.imageUrl || null,
                    sortOrder: Number(formData.sortOrder),
                    isActive: formData.isActive,
                  }
                : c
            )
          );
          showFeedback('success', `Category '${formData.name}' updated.`);
          setIsModalOpen(false);
        } else {
          showFeedback('error', json.error?.message || 'Failed to update category');
        }
      } else {
        // Create new category
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            slug: formData.slug || undefined,
            description: formData.description || undefined,
            imageUrl: formData.imageUrl || undefined,
            parentId: formData.parentId || undefined,
            sortOrder: Number(formData.sortOrder),
          }),
        });
        const json = await res.json();
        if (json.success) {
          const newCat = json.data;
          const parent = categories.find((c) => c.id === formData.parentId);
          setCategories((prev) => [
            ...prev,
            {
              id: newCat.id,
              name: newCat.name,
              slug: newCat.slug,
              description: newCat.description,
              imageUrl: newCat.imageUrl,
              parentId: newCat.parentId,
              parentName: parent?.name || null,
              sortOrder: newCat.sortOrder,
              isActive: newCat.isActive,
              productCount: 0,
              subcategories: [],
            },
          ]);
          showFeedback('success', `Category '${formData.name}' created.`);
          setIsModalOpen(false);
        } else {
          showFeedback('error', json.error?.message || 'Failed to create category');
        }
      }
    } catch {
      showFeedback('error', 'Network error while saving category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories?id=${deletingCategory.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
        showFeedback('success', `Category '${deletingCategory.name}' removed.`);
        setDeletingCategory(null);
      } else {
        showFeedback('error', json.error?.message || 'Failed to delete category');
      }
    } catch {
      showFeedback('error', 'Network error deleting category');
    } finally {
      setIsDeleting(false);
    }
  };

  const rootCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => !!c.parentId);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    (c.parentName && c.parentName.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<CategoryItem>[] = [
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
            {item.parentId ? <Folder className="w-3.5 h-3.5" /> : <FolderOpen className="w-4 h-4 text-neutral-900" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-neutral-900">{item.name}</span>
              {item.parentId && (
                <span className="text-[10px] text-neutral-400 font-mono">
                  (sub of {item.parentName})
                </span>
              )}
            </div>
            <span className="text-[11px] text-neutral-400 font-mono block">/{item.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'hierarchy',
      label: 'Division Level',
      render: (item) =>
        item.parentId ? (
          <Badge variant="neutral" className="text-[10px]">
            Subcategory
          </Badge>
        ) : (
          <Badge variant="info" className="text-[10px]">
            Primary Division
          </Badge>
        ),
    },
    {
      key: 'products',
      label: 'Linked Products',
      align: 'center',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-neutral-800">
          {item.productCount}
        </span>
      ),
    },
    {
      key: 'order',
      label: 'Sort Order',
      align: 'center',
      render: (item) => (
        <span className="font-mono text-xs text-neutral-500">{item.sortOrder}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (item) => (
        <Badge variant={item.isActive ? 'success' : 'error'}>
          {item.isActive ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/shop?category=${item.slug}`}
            target="_blank"
            className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors"
            title="View in Storefront"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Edit Category"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDeletingCategory(item)}
            className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete Category"
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
          title="Category Management"
          description="Organize your catalog with primary divisions, nested subcategories, and storefront navigation ordering."
        />

        <Button
          size="sm"
          variant="primary"
          onClick={openCreateModal}
          className="text-xs h-8 px-3 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Add Category</span>
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
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Total Divisions</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              {categories.length}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              {rootCategories.length} root, {subCategories.length} subcategories
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Catalog Linked SKUs</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              {categories.reduce((acc, c) => acc + c.productCount, 0)}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Total assigned products
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Active Storefront Categories</span>
            <div className="text-2xl font-bold text-emerald-700 font-mono-numeric">
              {categories.filter((c) => c.isActive).length}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Visible across storefront navigation
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Categories Table */}
      <DataTable
        columns={columns}
        data={filteredCategories}
        keyField="id"
        searchPlaceholder="Search categories by name, slug or parent..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1">
              Category Name *
            </label>
            <Input
              required
              placeholder="e.g. Ergonomic Office Furniture"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  name,
                  slug: editingCategory
                    ? prev.slug
                    : name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
                }));
              }}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1">
              URL Slug *
            </label>
            <Input
              required
              placeholder="e.g. ergonomic-office-furniture"
              value={formData.slug}
              disabled={!!editingCategory}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              className="text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1">
              Parent Category
            </label>
            <Select
              value={formData.parentId}
              onChange={(e) => setFormData((prev) => ({ ...prev, parentId: e.target.value }))}
              className="text-xs"
            >
              <option value="">None (Top-Level Primary Division)</option>
              {rootCategories
                .filter((c) => !editingCategory || c.id !== editingCategory.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1">
              Description
            </label>
            <Textarea
              placeholder="Describe this product collection for storefront and SEO..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">
                Sort Order
              </label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">
                Visibility Status
              </label>
              <Select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                className="text-xs"
              >
                <option value="true">Published & Active</option>
                <option value="false">Hidden / Draft</option>
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
              {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Safe Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Confirm Category Deletion"
      >
        <div className="space-y-4 pt-2 text-xs">
          <p className="text-neutral-700">
            Are you sure you want to delete category{' '}
            <strong className="text-neutral-900 font-semibold">{deletingCategory?.name}</strong>?
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              This category currently has{' '}
              <strong>{deletingCategory?.productCount} linked products</strong>. Deleting this
              category will safely unassign the category from those products without corrupting or deleting the products themselves.
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingCategory(null)}
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
