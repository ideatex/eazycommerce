"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { formatPrice } from "@/utils/formatePrice";
import {
  actionGetCatalogOffers,
  actionGetOrganizations,
  actionCreateOrUpdateOffer,
  actionToggleOfferMarketplaceLive,
  actionDeleteProductOffer,
  actionGetCmsContent,
} from "@/actions/vanigamActions";
import {
  VanigamProductOffer,
  VanigamOrganization,
} from "@/lib/b2b2c/mockVanigamData";
import { useWorkspace } from "@/context/WorkspaceContext";
import toast from "react-hot-toast";

export default function CatalogOffersView() {
  const { currentWorkspace, isPlatformAdmin } = useWorkspace();
  const [offers, setOffers] = useState<VanigamProductOffer[]>([]);
  const [organizations, setOrganizations] = useState<VanigamOrganization[]>([]);
  const [availableProducts, setAvailableProducts] = useState<{ id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LIVE" | "INACTIVE">("ALL");

  // Create / Edit Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  // Form state
  const [orgId, setOrgId] = useState("");
  const [productId, setProductId] = useState("prod-1");
  const [customProductTitle, setCustomProductTitle] = useState("");
  const [productImage, setProductImage] = useState("/images/products/product-1-bg-1.png");
  const [sellingPrice, setSellingPrice] = useState(29.99);
  const [costPrice, setCostPrice] = useState(19.0);
  const [wholesalePrice, setWholesalePrice] = useState(24.0);
  const [moq, setMoq] = useState(1);
  const [stock, setStock] = useState(150);

  // Image Upload State
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url" | "presets">("upload");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    const validMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
    ];
    if (!validMimeTypes.includes(file.type)) {
      toast.error("Invalid format. Please upload JPG, PNG, WEBP, GIF, SVG, or AVIF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File exceeds 10MB limit.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image");
      }

      setProductImage(data.url);
      setUploadedFileInfo({
        name: data.originalName || file.name,
        size: data.size || file.size,
      });
      toast.success("Product image uploaded successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const fetchOffersAndOrgs = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedOffers, fetchedOrgs, cmsData] = await Promise.all([
        actionGetCatalogOffers(isPlatformAdmin ? undefined : currentWorkspace.id),
        actionGetOrganizations(),
        actionGetCmsContent().catch(() => ({ products: [] })),
      ]);
      setOffers(fetchedOffers || []);
      setOrganizations(fetchedOrgs || []);
      if (cmsData?.products && cmsData.products.length > 0) {
        setAvailableProducts(cmsData.products);
      } else {
        setAvailableProducts([
          { id: "prod-1", title: "Havit HV-G69 Dual Vibration Gamepad" },
          { id: "prod-5", title: "Apple Watch Ultra Titanium Series" },
          { id: "prod-6", title: "Logitech MX Master 3S Wireless Mouse" },
          { id: "prod-8", title: "Asus RT Dual Band Wi-Fi 6 Router" },
        ]);
      }
      if (!orgId) {
        setOrgId(currentWorkspace.id || (fetchedOrgs && fetchedOrgs[0]?.id) || "");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load catalog offers");
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace.id, isPlatformAdmin, orgId]);

  useEffect(() => {
    fetchOffersAndOrgs();
  }, [fetchOffersAndOrgs]);

  // Isolation Filter
  const workspaceFilteredOffers = isPlatformAdmin
    ? offers
    : offers.filter((o) => o.organizationId === currentWorkspace.id);

  // Search & Status Filter
  const visibleOffers = workspaceFilteredOffers.filter((o) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "LIVE" && o.isMarketplaceLive) ||
      (statusFilter === "INACTIVE" && !o.isMarketplaceLive);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.productTitle.toLowerCase().includes(q) ||
      o.sku.toLowerCase().includes(q) ||
      o.organizationName.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const sellers = organizations.filter(
    (o) =>
      o.organizationType === "SELLER" ||
      o.organizationType === "DISTRIBUTOR" ||
      o.organizationType === "MANUFACTURER"
  );

  const getProductPresetImage = (pid: string) => {
    if (pid === "prod-5") return "/images/products/product-5-bg-1.png";
    if (pid === "prod-6") return "/images/products/product-6-bg-1.png";
    if (pid === "prod-8") return "/images/products/product-8-bg-1.png";
    return "/images/products/product-1-bg-1.png";
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingOfferId(null);
    setOrgId(currentWorkspace.id || sellers[0]?.id || "");
    const initialPid = availableProducts[0]?.id || "prod-1";
    setProductId(initialPid);
    setCustomProductTitle("");
    setProductImage(getProductPresetImage(initialPid));
    setUploadedFileInfo(null);
    setImageInputMode("upload");
    setSellingPrice(49.99);
    setCostPrice(29.0);
    setWholesalePrice(39.0);
    setMoq(1);
    setStock(100);
    setShowOfferModal(true);
  };

  const handleOpenEditModal = (offer: VanigamProductOffer) => {
    setIsEditing(true);
    setEditingOfferId(offer.id);
    setOrgId(offer.organizationId);
    setProductId(offer.productId);
    setCustomProductTitle(offer.productTitle);
    setProductImage(offer.productImage || getProductPresetImage(offer.productId));
    setUploadedFileInfo(null);
    setImageInputMode(offer.productImage?.startsWith("/uploads/") ? "upload" : "url");
    setSellingPrice(offer.sellingPrice);
    setCostPrice(offer.costPrice);
    setWholesalePrice(offer.wholesalePrice);
    setMoq(offer.minimumOrderQuantity);
    setStock(offer.stockQuantity);
    setShowOfferModal(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedSeller = organizations.find((o) => o.id === (orgId || currentWorkspace.id));
      const effectiveOrgId = orgId || currentWorkspace.id;

      const chosenProd = availableProducts.find((p) => p.id === productId);
      const title = customProductTitle || chosenProd?.title || "Commercial Sourced Item";
      const effectivePid = productId === "custom"
        ? (isEditing && editingOfferId ? `prod-${editingOfferId}` : `prod-${Date.now().toString().slice(-6)}`)
        : productId;

      await actionCreateOrUpdateOffer({
        id: isEditing ? (editingOfferId || undefined) : undefined,
        organizationId: effectiveOrgId,
        organizationName: selectedSeller?.name || currentWorkspace.name,
        productId: effectivePid,
        productTitle: title,
        productImage: productImage || "/images/products/product-1-bg-1.png",
        sku: `SKU-${effectivePid}-${Date.now().toString().slice(-4)}`,
        sellingPrice,
        costPrice,
        wholesalePrice,
        minimumOrderQuantity: moq,
        stockQuantity: stock,
        isMarketplaceLive: true,
        leadTimeDays: 1,
      });

      if (productId === "custom") {
        setAvailableProducts((prev) => [
          ...prev.filter((p) => p.id !== effectivePid),
          { id: effectivePid, title },
        ]);
      }

      toast.success(isEditing ? "Commercial offer updated!" : "New commercial offer published to marketplace!");
      setShowOfferModal(false);
      await fetchOffersAndOrgs();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMarketplaceLive = async (offerId: string) => {
    try {
      const updated = await actionToggleOfferMarketplaceLive(offerId);
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, isMarketplaceLive: updated.isMarketplaceLive } : o))
      );
      toast.success(
        updated.isMarketplaceLive
          ? "Offer is now LIVE on marketplace storefront!"
          : "Offer hidden from storefront (B2B wholesale only)"
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update offer visibility");
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm("Are you sure you want to remove this commercial offer from the catalog?")) return;
    try {
      await actionDeleteProductOffer(offerId);
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      toast.success("Product offer removed from catalog.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete offer");
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Product Title", "SKU", "Seller Org", "Selling Price", "Cost Price", "Wholesale Price", "MOQ", "Stock", "Marketplace Live"];
    const rows = visibleOffers.map((o) => [
      o.id,
      o.productTitle,
      o.sku,
      o.organizationName,
      o.sellingPrice,
      o.costPrice,
      o.wholesalePrice,
      o.minimumOrderQuantity,
      o.stockQuantity,
      o.isMarketplaceLive ? "YES" : "NO",
    ]);
    const content = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `catalog-offers-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Catalog offers exported to CSV!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-100">
              Commercial Catalog
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {workspaceFilteredOffers.length} Offers Active
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-dark">Master Catalog & Multi-Seller Offers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Decoupled product identity: Master catalog records with commercial multi-seller offers, pricing tiers, and real-time inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOffersAndOrgs}
            disabled={isLoading}
            className="py-2.5 px-4 bg-gray-1 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-2 transition border border-gray-3 flex items-center gap-1.5"
            title="Refresh offers"
          >
            <span className={isLoading ? "animate-spin" : ""}>🔄</span> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-4 bg-white text-dark rounded-xl text-xs font-bold hover:bg-gray-1 transition border border-gray-3 flex items-center gap-1.5"
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="py-2.5 px-5 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition shadow-sm self-start sm:self-auto"
          >
            + Create Product Offer
          </button>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-3 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="Search offers by product title, SKU, or seller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-3 rounded-lg text-sm focus:outline-none focus:border-blue"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-dark font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(["ALL", "LIVE", "INACTIVE"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === filter
                  ? "bg-dark text-white"
                  : "bg-gray-1 border border-gray-3 text-gray-600 hover:bg-gray-2"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-2 bg-gray-2/50 font-bold text-dark text-sm flex justify-between items-center">
          <span>Active Commercial Offers ({visibleOffers.length})</span>
          <span className="text-xs text-gray-400 font-normal">
            {isPlatformAdmin ? "Global view across all marketplace sellers" : `Scoped to ${currentWorkspace.name}`}
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 bg-gray-2 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Mobile & Tablet Card View (< 1024px) */}
            <div className="block lg:hidden divide-y divide-gray-2">
              {visibleOffers.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No commercial offers match your search criteria.
                </div>
              ) : (
                visibleOffers.map((o) => (
                  <div key={o.id} className="p-4 sm:p-5 space-y-3 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl bg-gray-1 border border-gray-2 shrink-0 flex items-center justify-center p-1 overflow-hidden">
                        <Image
                          src={o.productImage || "/images/products/product-1-bg-1.png"}
                          alt={o.productTitle}
                          width={60}
                          height={60}
                          unoptimized
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-dark text-sm truncate">{o.productTitle}</div>
                        <div className="text-xs font-mono text-gray-400 mt-0.5">{o.sku}</div>
                        <div className="text-xs text-gray-500 mt-0.5 font-medium">{o.organizationName}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs border border-gray-2 p-2.5 rounded-xl text-center">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Retail Price</span>
                        <span className="font-bold text-blue text-sm">{formatPrice(o.sellingPrice)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Wholesale</span>
                        <span className="font-mono text-dark font-semibold">{formatPrice(o.wholesalePrice)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Stock</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${o.stockQuantity > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                          {o.stockQuantity} units
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => handleToggleMarketplaceLive(o.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          o.isMarketplaceLive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-2 text-gray-500"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${o.isMarketplaceLive ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                        {o.isMarketplaceLive ? "LIVE ON STORE" : "HIDDEN / B2B"}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(o)}
                          className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-blue-50 text-blue hover:bg-blue-100 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(o.id)}
                          className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table (>= 1024px) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-2 text-xs uppercase tracking-wider font-semibold text-gray-500 bg-gray-1/30">
                    <th className="py-3 px-6">Product & SKU</th>
                    <th className="py-3 px-4">Offering Business</th>
                    <th className="py-3 px-4">Selling Price</th>
                    <th className="py-3 px-4">Cost / Wholesale</th>
                    <th className="py-3 px-4">MOQ</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Storefront Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-2">
                  {visibleOffers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-gray-400">
                        No commercial offers match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    visibleOffers.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-1/50 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-1 border border-gray-2 shrink-0 flex items-center justify-center p-1 overflow-hidden">
                              <Image
                                src={o.productImage || "/images/products/product-1-bg-1.png"}
                                alt={o.productTitle}
                                width={44}
                                height={44}
                                unoptimized
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-dark">{o.productTitle}</div>
                              <div className="text-xs font-mono text-gray-400">{o.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-dark">{o.organizationName}</td>
                        <td className="py-4 px-4 font-bold text-blue text-base">
                          {formatPrice(o.sellingPrice)}
                        </td>
                        <td className="py-4 px-4 text-xs font-mono text-gray-600">
                          Cost: {formatPrice(o.costPrice)} <br />
                          B2B: {formatPrice(o.wholesalePrice)}
                        </td>
                        <td className="py-4 px-4 font-mono text-xs">{o.minimumOrderQuantity} unit(s)</td>
                        <td className="py-4 px-4 font-bold text-dark">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${o.stockQuantity > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                            {o.stockQuantity} in stock
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleMarketplaceLive(o.id)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                              o.isMarketplaceLive
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-gray-2 text-gray-500 hover:bg-gray-3"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${o.isMarketplaceLive ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                            {o.isMarketplaceLive ? "LIVE ON STORE" : "HIDDEN / B2B ONLY"}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(o)}
                            className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue hover:bg-blue-100 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(o.id)}
                            className="text-xs font-semibold px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal to Create / Edit offer */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-3 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-2">
              <h2 className="text-lg font-bold text-dark">
                {isEditing ? "Edit Commercial Offer" : "Publish Commercial Offer"}
              </h2>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-gray-400 hover:text-dark text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-dark mb-1">Selling Organization</label>
                <select
                  value={orgId || currentWorkspace.id}
                  onChange={(e) => setOrgId(e.target.value)}
                  disabled={isEditing}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg bg-gray-2 text-dark text-xs focus:outline-none focus:border-blue disabled:opacity-60"
                >
                  {isPlatformAdmin ? (
                    sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.organizationType})
                      </option>
                    ))
                  ) : (
                    <option value={currentWorkspace.id}>
                      {currentWorkspace.name} ({currentWorkspace.organizationType})
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Master Product Item</label>
                <select
                  value={productId}
                  onChange={(e) => {
                    const newPid = e.target.value;
                    setProductId(newPid);
                    const prod = availableProducts.find((p) => p.id === newPid);
                    if (prod) {
                      setCustomProductTitle(prod.title);
                      setProductImage(getProductPresetImage(newPid));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg bg-white text-dark text-xs focus:outline-none focus:border-blue"
                >
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                  <option value="custom">Custom Catalog Product...</option>
                </select>
              </div>

              {productId === "custom" && (
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Custom Product Name</label>
                  <input
                    type="text"
                    required
                    value={customProductTitle}
                    onChange={(e) => setCustomProductTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue"
                    placeholder="e.g. Ergonomic Office Desk Stand"
                  />
                </div>
              )}

              {/* Product Image Section: Upload / URL / Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-dark">
                    Product Image & Media
                  </label>
                  {/* Mode switcher tabs */}
                  <div className="flex items-center bg-gray-2 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setImageInputMode("upload")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        imageInputMode === "upload"
                          ? "bg-white text-dark shadow-2xs font-bold"
                          : "text-gray-500 hover:text-dark"
                      }`}
                    >
                      📁 Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("url")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        imageInputMode === "url"
                          ? "bg-white text-dark shadow-2xs font-bold"
                          : "text-gray-500 hover:text-dark"
                      }`}
                    >
                      🔗 URL / Path
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("presets")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        imageInputMode === "presets"
                          ? "bg-white text-dark shadow-2xs font-bold"
                          : "text-gray-500 hover:text-dark"
                      }`}
                    >
                      ⚡ Presets
                    </button>
                  </div>
                </div>

                {/* Mode 1: Drag & Drop File Upload */}
                {imageInputMode === "upload" && (
                  <div className="space-y-2">
                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />

                    {/* Drag & Drop Box */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                        isDragOver
                          ? "border-blue bg-blue-50/40 text-blue scale-[1.01]"
                          : "border-gray-3 bg-gray-1/40 hover:bg-gray-1 hover:border-gray-4 text-gray-600"
                      }`}
                    >
                      {isUploadingImage ? (
                        <div className="py-4 flex flex-col items-center gap-2">
                          <div className="w-7 h-7 border-2 border-blue border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-bold text-blue">Uploading image to server...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue text-lg">
                            ☁️
                          </div>
                          <div>
                            <div className="text-xs font-bold text-dark">
                              Drag & drop product image here, or{" "}
                              <span className="text-blue underline underline-offset-2">Browse Files</span>
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              Supports JPG, PNG, WEBP, GIF, SVG (up to 10MB)
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Uploaded / Current Image Preview Bar */}
                    {productImage && (
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-3 shadow-2xs">
                        <div className="w-14 h-14 rounded-xl bg-gray-1 border border-gray-2 shrink-0 flex items-center justify-center p-1 overflow-hidden relative">
                          <Image
                            src={productImage}
                            alt="Preview"
                            width={56}
                            height={56}
                            unoptimized
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-dark truncate">
                              {uploadedFileInfo?.name || (productImage.startsWith("/uploads/") ? productImage.split("/").pop() : "Selected Catalog Asset")}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              ✓ Ready
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-gray-400 mt-0.5 truncate">
                            {productImage} {uploadedFileInfo?.size ? `(${Math.round(uploadedFileInfo.size / 1024)} KB)` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-3 text-dark hover:bg-gray-1 transition"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProductImage("/images/products/product-1-bg-1.png");
                              setUploadedFileInfo(null);
                            }}
                            className="text-xs font-semibold px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 transition"
                            title="Reset to default image"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mode 2: Custom URL / Asset Path */}
                {imageInputMode === "url" && (
                  <div className="flex items-center gap-3 bg-gray-1 p-2.5 rounded-xl border border-gray-3">
                    <div className="w-14 h-14 rounded-xl bg-white border border-gray-2 shrink-0 flex items-center justify-center p-1 overflow-hidden relative shadow-2xs">
                      <Image
                        src={productImage || "/images/products/product-1-bg-1.png"}
                        alt="Preview"
                        width={56}
                        height={56}
                        unoptimized
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <input
                        type="text"
                        value={productImage}
                        onChange={(e) => setProductImage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white font-mono"
                        placeholder="e.g. /images/products/item.png or https://..."
                      />
                      <div className="text-[10px] text-gray-400">
                        Supports local public paths or external HTTPS URLs.
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 3: Presets */}
                {imageInputMode === "presets" && (
                  <div className="bg-gray-1 p-3 rounded-xl border border-gray-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-white border border-gray-2 shrink-0 flex items-center justify-center p-1 overflow-hidden relative shadow-2xs">
                        <Image
                          src={productImage || "/images/products/product-1-bg-1.png"}
                          alt="Preview"
                          width={56}
                          height={56}
                          unoptimized
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-dark block mb-1">Choose Quick Preset Image</span>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {[
                            { label: "Gamepad", src: "/images/products/product-1-bg-1.png" },
                            { label: "Watch", src: "/images/products/product-5-bg-1.png" },
                            { label: "Mouse", src: "/images/products/product-6-bg-1.png" },
                            { label: "Router", src: "/images/products/product-8-bg-1.png" },
                            { label: "Audio", src: "/images/products/product-2-bg-1.png" },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setProductImage(preset.src)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                                productImage === preset.src
                                  ? "bg-blue text-white border-blue shadow-2xs"
                                  : "bg-white text-gray-600 border-gray-3 hover:bg-gray-2"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-3 rounded-lg bg-white text-dark text-xs focus:outline-none focus:border-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Wholesale ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-3 rounded-lg bg-white text-dark text-xs focus:outline-none focus:border-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-3 rounded-lg bg-white text-dark text-xs focus:outline-none focus:border-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Min Order Qty (MOQ)</label>
                  <input
                    type="number"
                    min={1}
                    value={moq}
                    onChange={(e) => setMoq(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-3 rounded-lg bg-white text-dark text-xs focus:outline-none focus:border-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Stock Level</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-3 rounded-lg bg-white text-dark text-xs focus:outline-none focus:border-blue"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-2 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : isEditing ? "Update Offer" : "Publish Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
