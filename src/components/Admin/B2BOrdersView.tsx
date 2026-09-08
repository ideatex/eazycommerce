"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/utils/formatePrice";
import {
  actionGetB2BOrders,
  actionGetOrganizations,
  actionCreatePurchaseOrder,
  actionUpdateB2BOrderStatus,
} from "@/actions/vanigamActions";
import { VanigamB2BOrder, VanigamOrganization } from "@/lib/b2b2c/mockVanigamData";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Skeleton } from "@/components/ui";
import toast from "react-hot-toast";

export default function B2BOrdersView() {
  const { currentWorkspace, isPlatformAdmin, hasPermission } = useWorkspace();
  const [orders, setOrders] = useState<VanigamB2BOrder[]>([]);
  const [organizations, setOrganizations] = useState<VanigamOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDraftModal, setShowDraftModal] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // New PO form state
  const [supplierId, setSupplierId] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("prod-1");
  const [quantity, setQuantity] = useState(100);
  const [unitPrice, setUnitPrice] = useState(16.5);
  const [terms, setTerms] = useState("Net 30 Days");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [fetchedOrders, fetchedOrgs] = await Promise.all([
        actionGetB2BOrders(currentWorkspace.id),
        actionGetOrganizations(),
      ]);
      setOrders(fetchedOrders);
      setOrganizations(fetchedOrgs);

      if (fetchedOrgs.length >= 2) {
        const defaultSupplier = fetchedOrgs.find((o) => o.organizationType === "MANUFACTURER" || o.organizationType === "SUPPLIER");
        const defaultBuyer = fetchedOrgs.find((o) => o.id === currentWorkspace.id && o.id !== defaultSupplier?.id) || fetchedOrgs[fetchedOrgs.length - 1];
        setSupplierId(defaultSupplier ? defaultSupplier.id : fetchedOrgs[0].id);
        setBuyerId(defaultBuyer ? defaultBuyer.id : fetchedOrgs[1].id);
      }
    } catch (err) {
      console.error("Failed to load B2B orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentWorkspace.id, isPlatformAdmin]);

  // Multi-Tenant Isolation Filter
  const workspaceOrders = isPlatformAdmin
    ? orders
    : orders.filter(
        (o) => o.supplierId === currentWorkspace.id || o.buyerId === currentWorkspace.id
      );

  // Search & Status Filter
  const visibleOrders = workspaceOrders.filter((po) => {
    const matchesStatus = statusFilter === "ALL" || po.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      po.poNumber.toLowerCase().includes(q) ||
      po.supplierName.toLowerCase().includes(q) ||
      po.buyerName.toLowerCase().includes(q) ||
      po.paymentTerms.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const suppliers = organizations.filter(
    (o) => o.organizationType === "MANUFACTURER" || o.organizationType === "SUPPLIER" || o.organizationType === "DISTRIBUTOR"
  );
  const buyers = organizations.filter(
    (o) => o.organizationType === "DISTRIBUTOR" || o.organizationType === "SELLER" || o.organizationType === "RETAILER"
  );

  const handleStatusUpdate = async (poId: string, newStatus: VanigamB2BOrder["status"]) => {
    try {
      const updated = await actionUpdateB2BOrderStatus(poId, newStatus);
      if (updated) {
        setOrders(orders.map((o) => (o.id === poId ? { ...o, status: newStatus } : o)));
        if (newStatus === "RECEIVED") {
          toast.success(`Purchase Order ${updated.poNumber} received! Sourced goods stocked into buyer inventory.`);
        } else {
          toast.success(`Purchase Order ${updated.poNumber} transitioned to ${newStatus}`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update PO status");
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 20) {
      toast.error("Minimum Order Quantity (MOQ) for wholesale order is 20 units.");
      return;
    }

    const supplier = organizations.find((o) => o.id === supplierId);
    const buyer = organizations.find((o) => o.id === buyerId);

    try {
      const newPO = await actionCreatePurchaseOrder({
        supplierId,
        supplierName: supplier?.name || "Global Manufacturer",
        buyerId,
        buyerName: buyer?.name || "Enterprise Wholesale Buyer",
        paymentTerms: terms,
        items: [
          {
            productId: selectedProduct,
            productTitle:
              selectedProduct === "prod-1"
                ? "Havit HV-G69 Dual Vibration Gamepad"
                : selectedProduct === "prod-5"
                ? "Apple Watch Ultra Titanium Series"
                : "Logitech MX Master 3S Wireless Mouse",
            sku: `SKU-${selectedProduct}-WHOLESALE`,
            unitPrice: Number(unitPrice),
            quantity: Number(quantity),
          },
        ],
      });

      setOrders([newPO, ...orders]);
      setShowDraftModal(false);
      toast.success(`B2B Purchase Order ${newPO.poNumber} created and routed to supplier!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create PO");
    }
  };

  const handleExportCSV = () => {
    const headers = ["PO Number", "Supplier", "Buyer", "Quantity", "Total Amount", "Terms", "Status", "Created At"];
    const rows = visibleOrders.map((po) => [
      po.poNumber,
      po.supplierName,
      po.buyerName,
      po.items.reduce((acc, i) => acc + i.quantity, 0),
      po.totalAmount,
      po.paymentTerms,
      po.status,
      po.createdAt,
    ]);
    const content = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `b2b-purchase-orders-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("B2B Purchase Orders exported to CSV!");
  };

  const canCreatePO = hasPermission("b2b_orders.create");
  const canApprovePO = hasPermission("b2b_orders.approve");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue border border-blue-100">
              Procurement Engine
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {workspaceOrders.length} POs On File
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-dark">B2B Purchase Orders & MOQ Routing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upstream wholesale procurement with automated MOQ validation, Net credit terms, and supply-chain receipt.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="py-2.5 px-4 bg-gray-1 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-2 transition border border-gray-3 flex items-center gap-1.5"
            title="Refresh POs"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-4 bg-white text-dark rounded-xl text-xs font-bold hover:bg-gray-1 transition border border-gray-3 flex items-center gap-1.5"
          >
            ⬇ Export CSV
          </button>
          {canCreatePO && (
            <button
              onClick={() => setShowDraftModal(true)}
              className="py-2.5 px-5 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition shadow-sm self-start sm:self-auto"
            >
              + Draft Purchase Order
            </button>
          )}
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-3 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="Search POs by PO number, supplier, buyer, or payment terms..."
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

        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "SUBMITTED", "APPROVED", "PROCESSING", "SHIPPED", "RECEIVED", "CANCELLED"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
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

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-2 bg-gray-2/50 font-bold text-dark text-sm flex justify-between items-center">
          <span>Enterprise Purchase Orders ({visibleOrders.length})</span>
          <span className="text-xs text-gray-400 font-normal">
            Automated credit terms & status synchronization
          </span>
        </div>

        {/* Mobile & Tablet Card View (< 1024px) */}
        <div className="block lg:hidden divide-y divide-gray-2">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No purchase orders match your search criteria.
            </div>
          ) : (
            visibleOrders.map((po) => {
              const totalQty = po.items.reduce((acc, i) => acc + i.quantity, 0);

              return (
                <div key={po.id} className="p-4 sm:p-5 space-y-3 bg-white">
                  {/* PO Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-bold text-dark text-sm">
                        {po.poNumber}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        po.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : po.status === "PROCESSING" || po.status === "SHIPPED"
                          ? "bg-blue/10 text-blue"
                          : po.status === "RECEIVED"
                          ? "bg-purple-100 text-purple-700"
                          : po.status === "REJECTED" || po.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>

                  {/* Supplier & Buyer */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-1 p-2.5 rounded-xl">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Supplier</span>
                      <span className="font-semibold text-dark truncate block">{po.supplierName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Buyer</span>
                      <span className="font-medium text-gray-700 truncate block">{po.buyerName}</span>
                    </div>
                  </div>

                  {/* Order Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-xs border border-gray-2 p-2.5 rounded-xl text-center">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Quantity</span>
                      <span className="font-mono font-bold text-blue">{totalQty} units</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Total</span>
                      <span className="font-bold text-dark">{formatPrice(po.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Terms</span>
                      <span className="font-mono text-gray-600 font-semibold">{po.paymentTerms}</span>
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {po.status === "SUBMITTED" && canApprovePO && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(po.id, "APPROVED")}
                          className="py-2 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex-1 text-center min-h-[38px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(po.id, "REJECTED")}
                          className="py-2 px-3 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition flex-1 text-center min-h-[38px]"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {po.status === "APPROVED" && (
                      <button
                        onClick={() => handleStatusUpdate(po.id, "PROCESSING")}
                        className="py-2 px-3 bg-blue text-white rounded-lg text-xs font-bold hover:bg-blue-dark transition w-full text-center min-h-[38px]"
                      >
                        Process
                      </button>
                    )}
                    {po.status === "PROCESSING" && (
                      <button
                        onClick={() => handleStatusUpdate(po.id, "SHIPPED")}
                        className="py-2 px-3 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition w-full text-center min-h-[38px]"
                      >
                        Ship
                      </button>
                    )}
                    {po.status === "SHIPPED" && (
                      <button
                        onClick={() => handleStatusUpdate(po.id, "RECEIVED")}
                        className="py-2 px-3 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition w-full text-center min-h-[38px]"
                      >
                        Receive Stock
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table (>= 1024px) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-2 text-xs uppercase tracking-wider font-semibold text-gray-500 bg-gray-1/30">
                <th className="py-3 px-6">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Buyer</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Terms</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-2">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 space-y-3">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </td>
                </tr>
              ) : visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-gray-400">
                    No purchase orders match your search criteria.
                  </td>
                </tr>
              ) : (
                visibleOrders.map((po) => {
                  const totalQty = po.items.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <tr key={po.id} className="hover:bg-gray-1/50 transition">
                      <td className="py-4 px-6 font-mono font-bold text-dark">{po.poNumber}</td>
                      <td className="py-4 px-4 font-semibold text-dark">{po.supplierName}</td>
                      <td className="py-4 px-4 text-gray-600">{po.buyerName}</td>
                      <td className="py-4 px-4 font-mono font-semibold text-blue">{totalQty} units</td>
                      <td className="py-4 px-4 font-bold text-dark">{formatPrice(po.totalAmount)}</td>
                      <td className="py-4 px-4 text-xs font-mono text-gray-500">{po.paymentTerms}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            po.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : po.status === "PROCESSING" || po.status === "SHIPPED"
                              ? "bg-blue/10 text-blue"
                              : po.status === "RECEIVED"
                              ? "bg-purple-100 text-purple-700"
                              : po.status === "REJECTED" || po.status === "CANCELLED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1">
                        {po.status === "SUBMITTED" && canApprovePO && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(po.id, "APPROVED")}
                              className="py-1 px-2.5 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(po.id, "REJECTED")}
                              className="py-1 px-2.5 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {po.status === "APPROVED" && (
                          <button
                            onClick={() => handleStatusUpdate(po.id, "PROCESSING")}
                            className="py-1 px-2.5 bg-blue text-white rounded-md text-xs font-bold hover:bg-blue-dark transition"
                          >
                            Process
                          </button>
                        )}
                        {po.status === "PROCESSING" && (
                          <button
                            onClick={() => handleStatusUpdate(po.id, "SHIPPED")}
                            className="py-1 px-2.5 bg-purple-600 text-white rounded-md text-xs font-bold hover:bg-purple-700 transition"
                          >
                            Ship
                          </button>
                        )}
                        {po.status === "SHIPPED" && (
                          <button
                            onClick={() => handleStatusUpdate(po.id, "RECEIVED")}
                            className="py-1 px-2.5 bg-emerald-700 text-white rounded-md text-xs font-bold hover:bg-emerald-800 transition shadow-xs"
                          >
                            Receive Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for drafting a B2B Purchase Order */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-3 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-2">
              <div>
                <h2 className="text-lg font-bold text-dark">Draft Wholesale Purchase Order</h2>
                <p className="text-xs text-gray-500">Minimum Order Quantity (MOQ) threshold: 20 units</p>
              </div>
              <button
                onClick={() => setShowDraftModal(false)}
                className="text-gray-400 hover:text-dark text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-dark mb-1">Upstream Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.organizationType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Procuring Buyer</label>
                <select
                  value={buyerId}
                  onChange={(e) => setBuyerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white"
                >
                  {buyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.organizationType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Catalog Item Sourced</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white"
                >
                  <option value="prod-1">Havit HV-G69 Dual Vibration Gamepad</option>
                  <option value="prod-5">Apple Watch Ultra Titanium Series</option>
                  <option value="prod-6">Logitech MX Master 3S Wireless Mouse</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Order Quantity (MOQ &ge; 20)</label>
                  <input
                    type="number"
                    min={20}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Agreed Wholesale Price ($)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Agreed Payment Terms</label>
                <select
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg text-xs text-dark focus:outline-none focus:border-blue bg-white"
                >
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 45 Days">Net 45 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                  <option value="Direct Wire Transfer / COD">Direct Wire Transfer / COD</option>
                </select>
              </div>

              <div className="p-3 bg-gray-1 rounded-xl text-xs flex justify-between items-center">
                <span className="text-gray-500 font-medium">Estimated PO Total:</span>
                <span className="font-extrabold text-dark text-base">{formatPrice(quantity * unitPrice)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-2">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-2 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-blue text-white rounded-xl text-xs font-bold hover:bg-blue-dark transition"
                >
                  Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
