'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  UploadCloud,
  Plus,
  Trash2,
  Check,
  Globe,
  Sparkles,
  Info,
  DollarSign,
  Package,
  Layers,
  Store,
  Tag,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
  Star,
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  PageHeader,
} from '@/components/ui';

interface ProductEditorClientProps {
  categories: Array<{ id: string; name: string }>;
  initialProduct?: {
    id: string;
    title: string;
    slug: string;
    sku: string;
    description: string;
    shortDescription?: string | null;
    basePrice: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
    stock?: number;
    moq: number;
    hsnCode?: string | null;
    taxRatePercent: number;
    categoryId?: string | null;
    status: string;
    tags?: string | null;
    images?: Array<{ url: string }>;
    priceTiers?: Array<{ minQuantity: number; price: number }>;
    variants?: Array<{ stock: number; reservedStock: number; price: number }>;
  } | null;
}

export function ProductEditorClient({
  categories,
  initialProduct,
}: ProductEditorClientProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState(initialProduct?.title || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [shortDescription, setShortDescription] = useState(initialProduct?.shortDescription || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [basePrice, setBasePrice] = useState(initialProduct?.basePrice?.toString() || '');
  const [compareAtPrice, setCompareAtPrice] = useState(initialProduct?.compareAtPrice?.toString() || '');
  const [costPrice, setCostPrice] = useState(initialProduct?.costPrice?.toString() || '');
  const [stock, setStock] = useState(
    (initialProduct?.variants?.[0]?.stock ?? 25).toString()
  );
  const [moq, setMoq] = useState((initialProduct?.moq ?? 1).toString());
  const [hsnCode, setHsnCode] = useState(initialProduct?.hsnCode || '9403.60.00');
  const [taxRatePercent, setTaxRatePercent] = useState(
    (initialProduct?.taxRatePercent ?? 18.0).toString()
  );
  const [categoryId, setCategoryId] = useState(
    initialProduct?.categoryId || categories[0]?.id || ''
  );
  const [status, setStatus] = useState(initialProduct?.status || 'PUBLISHED');
  const [tags, setTags] = useState(
    initialProduct?.tags || 'handcrafted, solid wood, sustainable'
  );
  
  // Media State
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>(
    initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images.map((img) => img.url)
      : [
          'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
        ]
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wholesale Tiers State
  const [tiers, setTiers] = useState<Array<{ minQuantity: number; price: number }>>(
    initialProduct?.priceTiers && initialProduct.priceTiers.length > 0
      ? initialProduct.priceTiers.map((pt) => ({
          minQuantity: pt.minQuantity,
          price: pt.price,
        }))
      : []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto slug
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Margin calculation
  const priceNum = parseFloat(basePrice) || 0;
  const costNum = parseFloat(costPrice) || 0;
  const marginPercent = priceNum > 0 && costNum > 0
    ? Math.round(((priceNum - costNum) / priceNum) * 100)
    : 0;

  const handleFileUpload = async (filesList: FileList | File[]) => {
    const files = Array.from(filesList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      setUploadError('Please select valid image files (JPG, PNG, WEBP, GIF, SVG).');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.urls) {
        setImages((prev) => [...prev, ...data.data.urls]);
      } else {
        setUploadError(data.error?.message || 'Failed to upload image(s).');
      }
    } catch {
      setUploadError('Network error while uploading image files.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImage = () => {
    let cleanUrl = imageUrl.trim();
    if (!cleanUrl) return;

    setUploadError(null);

    // Smart detection for Unsplash webpage links
    if (cleanUrl.includes('unsplash.com/photos/')) {
      const slugMatch = cleanUrl.match(/unsplash\.com\/photos\/([^/?#]+)/);
      if (slugMatch && slugMatch[1]) {
        const photoSlug = slugMatch[1];
        // If it looks like a photo id or slug ending with an id
        const idParts = photoSlug.split('-');
        const possibleId = idParts[idParts.length - 1];
        if (photoSlug.startsWith('photo-')) {
          cleanUrl = `https://images.unsplash.com/${photoSlug}?auto=format&fit=crop&w=1200&q=80`;
        } else if (possibleId) {
          cleanUrl = `https://images.unsplash.com/photo-${possibleId}?auto=format&fit=crop&w=1200&q=80`;
        }
      }
    }

    setImages([...images, cleanUrl]);
    setImageUrl('');
  };

  const handleRemoveImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
    setBrokenImages((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const handleMakeCover = (idx: number) => {
    if (idx === 0) return;
    const selected = images[idx];
    const remaining = images.filter((_, i) => i !== idx);
    setImages([selected, ...remaining]);
    setBrokenImages({});
  };

  const handleAddTier = () => {
    setTiers([...tiers, { minQuantity: (tiers[tiers.length - 1]?.minQuantity || 5) + 5, price: Math.round(priceNum * 0.9) }]);
  };

  const handleUpdateTier = (index: number, field: 'minQuantity' | 'price', val: number) => {
    const updated = [...tiers];
    updated[index][field] = val;
    setTiers(updated);
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !sku.trim() || !basePrice) {
      setErrorMsg('Product title, SKU, and price are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const validTiers = tiers
      .filter((t) => t.minQuantity > 0 && t.price > 0)
      .map((t) => ({
        minQuantity: Number(t.minQuantity),
        price: Number(t.price),
      }));

    try {
      const payload: Record<string, unknown> = {
        title,
        slug: slug || `product-${Date.now()}`,
        sku: sku.toUpperCase().trim(),
        description,
        shortDescription: shortDescription || null,
        basePrice: parseFloat(basePrice),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        categoryId: categoryId || null,
        moq: parseInt(moq) || 1,
        hsnCode: hsnCode || null,
        taxRatePercent: parseFloat(taxRatePercent) || 18.0,
        status,
        tags: tags || null,
        images,
        priceTiers: validTiers,
      };

      if (initialProduct) {
        payload.stock = parseInt(stock) || 0;
      } else {
        payload.variants = [
          {
            title: 'Standard',
            sku: sku.toUpperCase().trim(),
            price: parseFloat(basePrice),
            stock: parseInt(stock) || 10,
            attributesJson: '{}',
          },
        ];
      }

      const res = await fetch(
        initialProduct ? `/api/products/${initialProduct.id}` : '/api/products',
        {
          method: initialProduct ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        router.push('/admin/products');
      } else {
        setErrorMsg(data.error?.message || (initialProduct ? 'Failed to update product' : 'Failed to create product'));
      }
    } catch {
      setErrorMsg('Network error while saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
              {initialProduct ? `Edit Product: ${initialProduct.title}` : 'Add New Product'}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {initialProduct
                ? 'Update catalog specifications, imagery, wholesale tiers, and inventory.'
                : 'Specify catalog specifications, pricing, inventory parameters, and tax classifications.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="md"
            href="/admin/products"
          >
            Discard
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
          >
            {initialProduct ? 'Save Changes' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2-Column Shopify Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start min-w-0">
        {/* Left Main Column (8/12) */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* Card: Title & Description */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                General Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <Input
                label="Product Title *"
                required
                placeholder="e.g. Handcrafted Solid Teak Dining Table"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Input
                label="Short Description (Listing Summary)"
                placeholder="e.g. Crafted from sustainably harvested plantation teak with matte polyurethane coating."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />

              <Textarea
                label="Full Editorial & Craftsmanship Story"
                rows={5}
                placeholder="Detail the materials, joinery methods, finishing oils, and design rationale..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Card: Media Gallery */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-900 flex items-center justify-between">
                <span>Product Media & Imagery</span>
                <span className="text-[11px] text-neutral-400 font-normal">{images.length} images added</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Hidden Native File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files);
                  }
                }}
              />

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileUpload(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#2563EB] bg-blue-50/50 scale-[0.99]'
                    : 'border-neutral-200 hover:border-[#2563EB]/50 hover:bg-neutral-50/60'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-neutral-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-neutral-800">
                      {isUploading ? 'Uploading image files...' : 'Click to browse or drag & drop image files'}
                    </p>
                    <p className="text-xs text-neutral-400">
                      Supports JPG, PNG, WEBP, GIF, SVG up to 10MB per file
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Paste URL Option */}
              <div className="pt-2 border-t border-neutral-100">
                <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-2">
                  Or add image from direct web URL
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste direct image link (e.g. https://images.unsplash.com/... or https://...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleAddImage}
                    disabled={!imageUrl.trim()}
                  >
                    Add URL
                  </Button>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Tip: Ensure the URL points directly to an image file (e.g. ending in .jpg, .png or hosted on images.unsplash.com).
                </p>
              </div>

              {/* Thumbnails Preview */}
              {images.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-neutral-700 flex items-center justify-between">
                    <span>Catalog Media Gallery Preview</span>
                    <span className="text-[11px] text-neutral-400 font-normal">
                      The first item is the Primary Cover image
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative aspect-square rounded-xl overflow-hidden border transition-all bg-neutral-50 group flex flex-col items-center justify-center p-1.5 ${
                          idx === 0
                            ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-sm'
                            : 'border-neutral-200'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Product preview ${idx + 1}`}
                          className="w-full h-full object-contain"
                          onError={() => {
                            setBrokenImages((prev) => ({ ...prev, [idx]: true }));
                          }}
                          onLoad={() => {
                            setBrokenImages((prev) => {
                              const next = { ...prev };
                              delete next[idx];
                              return next;
                            });
                          }}
                        />

                        {/* Broken Image Warning Overlay */}
                        {brokenImages[idx] && (
                          <div className="absolute inset-0 bg-rose-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center text-white text-[11px] z-10">
                            <AlertTriangle className="w-5 h-5 text-amber-300 mb-1" />
                            <span className="font-semibold text-rose-100 leading-tight">Image load failed</span>
                            <span className="text-[9px] text-rose-200 mt-0.5">Check URL or upload file directly</span>
                          </div>
                        )}

                        {/* Top Badges */}
                        {idx === 0 ? (
                          <span className="absolute top-2 left-2 bg-[#2563EB] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 z-10">
                            <Star className="w-2.5 h-2.5 fill-white" />
                            Cover
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMakeCover(idx)}
                            className="absolute top-2 left-2 bg-neutral-900/80 hover:bg-[#2563EB] text-white text-[9px] font-semibold px-2 py-0.5 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                            title="Set as main cover image"
                          >
                            Set Cover
                          </button>
                        )}

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-xs z-10 cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Pricing & Profit Margin */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                Commercial Pricing & Indian GST
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Selling Price (₹) *"
                  type="number"
                  required
                  min="1"
                  placeholder="2499"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                />

                <Input
                  label="Compare-At Price (₹)"
                  type="number"
                  placeholder="2999"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                />

                <Input
                  label="Cost Per Item (₹)"
                  type="number"
                  placeholder="1400"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>

              {costNum > 0 && priceNum > 0 && (
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between text-xs">
                  <span className="text-neutral-600">Calculated Gross Margin:</span>
                  <span className="font-semibold text-emerald-700 font-mono">
                    {marginPercent}% (₹{(priceNum - costNum).toLocaleString('en-IN')} profit/unit)
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                <Input
                  label="HSN Classification Code"
                  placeholder="9403.60.00"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                />

                <Select
                  label="Applicable GST Slab (%)"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(e.target.value)}
                  options={[
                    { label: '18% Standard GST (9% CGST + 9% SGST)', value: '18.0' },
                    { label: '12% Concessional GST (6% CGST + 6% SGST)', value: '12.0' },
                    { label: '5% Essential GST (2.5% CGST + 2.5% SGST)', value: '5.0' },
                    { label: '28% Luxury GST (14% CGST + 14% SGST)', value: '28.0' },
                    { label: '0% Exempted Goods', value: '0.0' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Inventory & Warehouse Logistics */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                Inventory Logistics & Quantities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Stock Keeping Unit (SKU) *"
                  required
                  placeholder="FRN-TEAK-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="uppercase font-mono"
                />

                <Input
                  label="Available Warehouse Stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />

                <Input
                  label="Minimum Order Quantity (MOQ)"
                  type="number"
                  min="1"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Wholesale Tier Pricing */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>B2B Wholesale Tier Pricing</span>
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTier}
              >
                + Add Tier
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <p className="text-xs text-neutral-500">
                Offer automated volume discounts for wholesale institutions ordering bulk units.
              </p>

              <div className="space-y-2">
                {tiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        label={idx === 0 ? "Min Quantity" : undefined}
                        type="number"
                        min="2"
                        value={tier.minQuantity}
                        onChange={(e) => handleUpdateTier(idx, 'minQuantity', parseInt(e.target.value) || 2)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        label={idx === 0 ? "Discounted Unit Price (₹)" : undefined}
                        type="number"
                        min="1"
                        value={tier.price}
                        onChange={(e) => handleUpdateTier(idx, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="text-neutral-400 hover:text-rose-600 p-2 mt-auto"
                      title="Remove tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Column (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Status */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                Publication Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { label: 'Published (Visible to all storefront visitors)', value: 'PUBLISHED' },
                  { label: 'Draft (Internal review only)', value: 'DRAFT' },
                  { label: 'Archived (Delisted from catalog)', value: 'ARCHIVED' },
                ]}
              />
              <p className="text-[11px] text-neutral-400">
                {status === 'PUBLISHED'
                  ? 'Product is live and searchable across all customer and B2B channels.'
                  : 'Product will not be indexed or visible on storefront.'}
              </p>
            </CardContent>
          </Card>

          {/* Card: Organization & Taxonomy */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                Organization & Maker
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <Select
                label="Product Category *"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
              />

              <Input
                label="Tags (Comma-separated)"
                placeholder="handcrafted, wood, artisan"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Card: SEO Search Listing Preview */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-neutral-500" />
                <span>Search Engine Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-1.5">
              <div className="text-xs text-blue-700 font-medium truncate">
                {title || 'Product Title'} | Vanigam Commerce
              </div>
              <div className="text-[11px] text-emerald-800 font-mono truncate">
                https://vanigam.com/product/{slug || 'product-url'}
              </div>
              <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                {shortDescription || description || 'Handcrafted commercial procurement piece manufactured with premium quality materials.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
