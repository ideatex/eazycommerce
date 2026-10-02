'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  Package,
  Truck,
  Eye,
  Check,
  MapPin,
  Receipt,
  Store,
  ChevronRight,
  ExternalLink,
  X,
  Clock
} from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  DataTable,
  Column,
  PageHeader,
  Modal,
} from '@/components/ui';

interface OrdersManagerClientProps {
  initialOrders: any[];
  initialStatus?: string;
  initialSearch?: string;
}

export function OrdersManagerClient({
  initialOrders,
  initialStatus,
  initialSearch,
}: OrdersManagerClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [activeTab, setActiveTab] = useState<string>(
    initialStatus ? initialStatus.toUpperCase() : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Order Details Drawer State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [shippingOrder, setShippingOrder] = useState<any | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('Delhivery Express Cargo');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleStatusChange = async (
    orderNumber: string,
    nextStatus: string,
    extraData?: { trackingNumber?: string; trackingCarrier?: string; note?: string }
  ) => {
    setIsUpdating(orderNumber);
    setFeedback(null);
    try {
      const res = await fetch(`/api/orders/${orderNumber}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          note: extraData?.note || `Admin transitioned order to ${nextStatus}`,
          trackingNumber: extraData?.trackingNumber,
          trackingCarrier: extraData?.trackingCarrier,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === orderNumber
              ? {
                  ...o,
                  status: nextStatus,
                  paymentStatus: nextStatus === 'REFUNDED' ? 'REFUNDED' : o.paymentStatus,
                  trackingNumber: extraData?.trackingNumber || o.trackingNumber,
                  trackingCarrier: extraData?.trackingCarrier || o.trackingCarrier,
                }
              : o
          )
        );
        if (selectedOrder && selectedOrder.orderNumber === orderNumber) {
          setSelectedOrder({
            ...selectedOrder,
            status: nextStatus,
            paymentStatus: nextStatus === 'REFUNDED' ? 'REFUNDED' : selectedOrder.paymentStatus,
            trackingNumber: extraData?.trackingNumber || selectedOrder.trackingNumber,
            trackingCarrier: extraData?.trackingCarrier || selectedOrder.trackingCarrier,
          });
        }
        showFeedback('success', `Order #${orderNumber} transitioned to ${nextStatus}`);
      } else {
        showFeedback('error', data.error?.message || 'Status update failed');
      }
    } catch {
      showFeedback('error', 'Network error communicating with server');
    } finally {
      setIsUpdating(null);
    }
  };

  const openShippingModal = (o: any) => {
    setShippingOrder(o);
    setTrackingNumber(`DLV-${Math.floor(100000 + Math.random() * 900000)}`);
    setCarrier('Delhivery Express Cargo');
  };

  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingOrder) return;
    await handleStatusChange(shippingOrder.orderNumber, 'SHIPPED', {
      trackingNumber,
      trackingCarrier: carrier,
      note: `Dispatched via ${carrier} with AWB #${trackingNumber}`,
    });
    setShippingOrder(null);
  };

  // Bulk transitions: only orders the server accepted are updated; failures are reported.
  const handleBulkStatusChange = async (ids: string[], newStatus: string) => {
    const targetOrders = orders.filter((o) => ids.includes(o.id));
    const outcomes = await Promise.all(
      targetOrders.map(async (o) => {
        try {
          const res = await fetch(`/api/orders/${o.orderNumber}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: newStatus,
              note: `Bulk transitioned by admin to ${newStatus}`,
            }),
          });
          const json = await res.json();
          return json.success ? { id: o.id, error: null } : { id: o.id, error: json.error?.message || 'Update failed' };
        } catch {
          return { id: o.id, error: 'Network error' };
        }
      })
    );
    const doneIds = outcomes.filter((r) => !r.error).map((r) => r.id);
    const firstError = outcomes.find((r) => r.error)?.error;

    setOrders((prev) => prev.map((o) => (doneIds.includes(o.id) ? { ...o, status: newStatus } : o)));
    setSelectedIds((prev) => prev.filter((id) => !doneIds.includes(id)));
    if (!firstError) showFeedback('success', `${doneIds.length} orders updated to ${newStatus}`);
    else showFeedback('error', `${doneIds.length} of ${targetOrders.length} updated. ${firstError}`);
  };

  const getBadgeVariant = (status: string): 'neutral' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'PROCESSING':
      case 'PACKED':
      case 'SHIPPED':
        return 'info';
      case 'CONFIRMED':
        return 'neutral';
      case 'PENDING':
      default:
        return 'warning';
    }
  };

  // Tabs with count badges
  const tabs = useMemo(() => {
    return [
      { id: 'ALL', label: 'All Orders', count: orders.length },
      { id: 'PENDING', label: 'Pending', count: orders.filter((o) => o.status === 'PENDING').length },
      { id: 'CONFIRMED', label: 'Confirmed', count: orders.filter((o) => o.status === 'CONFIRMED').length },
      { id: 'PROCESSING', label: 'Processing', count: orders.filter((o) => o.status === 'PROCESSING').length },
      { id: 'PACKED', label: 'Packed', count: orders.filter((o) => o.status === 'PACKED').length },
      { id: 'SHIPPED', label: 'Shipped', count: orders.filter((o) => o.status === 'SHIPPED').length },
      { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', count: orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length },
      { id: 'DELIVERED', label: 'Delivered', count: orders.filter((o) => o.status === 'DELIVERED').length },
      { id: 'CANCELLED', label: 'Cancelled', count: orders.filter((o) => o.status === 'CANCELLED').length },
    ];
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesTab = activeTab === 'ALL' || o.status === activeTab;
      const matchesSearch =
        !searchQuery ||
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  // DataTable Columns
  const columns: Column<any>[] = [
    {
      key: 'orderNumber',
      label: 'Order Reference',
      sortable: true,
      render: (o) => (
        <button
          onClick={() => setSelectedOrder(o)}
          className="font-mono font-semibold text-neutral-900 hover:underline text-left cursor-pointer"
        >
          #{o.orderNumber}
        </button>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date & Time',
      sortable: true,
      render: (o) => (
        <span className="text-neutral-500 text-[11px] font-mono">
          {new Date(o.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer Buyer',
      render: (o) => (
        <div className="min-w-0 max-w-xs">
          <span className="font-semibold text-neutral-900 block truncate">{o.customerName}</span>
          <span className="text-[11px] text-neutral-400 block truncate">{o.customerEmail}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Fulfillment Status',
      render: (o) => <Badge variant={getBadgeVariant(o.status)}>{o.status}</Badge>,
    },
    {
      key: 'payment',
      label: 'Settlement Method',
      render: (o) => (
        <div className="space-y-0.5">
          <span className="text-xs font-mono text-neutral-800 block">{o.paymentMethod}</span>
          <span className="text-[10px] text-emerald-700 font-medium">{o.paymentStatus}</span>
        </div>
      ),
    },
    {
      key: 'grandTotal',
      label: 'Order Total',
      align: 'right',
      sortable: true,
      render: (o) => (
        <span className="font-mono-numeric font-semibold text-neutral-900">
          ₹{o.grandTotal.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Transition Step',
      render: (o) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {o.status === 'PENDING' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(o.orderNumber, 'CONFIRMED')}
              disabled={isUpdating === o.orderNumber}
            >
              Confirm
            </Button>
          )}
          {o.status === 'CONFIRMED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(o.orderNumber, 'PROCESSING')}
              disabled={isUpdating === o.orderNumber}
            >
              Process
            </Button>
          )}
          {o.status === 'PROCESSING' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(o.orderNumber, 'PACKED')}
              disabled={isUpdating === o.orderNumber}
            >
              Pack
            </Button>
          )}
          {o.status === 'PACKED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openShippingModal(o)}
              disabled={isUpdating === o.orderNumber}
            >
              Ship
            </Button>
          )}
          {o.status === 'SHIPPED' && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(o.orderNumber, 'OUT_FOR_DELIVERY')}
                disabled={isUpdating === o.orderNumber}
              >
                Out for Delivery
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStatusChange(o.orderNumber, 'DELIVERED')}
                disabled={isUpdating === o.orderNumber}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                Delivered
              </Button>
            </div>
          )}
          {o.status === 'OUT_FOR_DELIVERY' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(o.orderNumber, 'DELIVERED')}
              disabled={isUpdating === o.orderNumber}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              Delivered
            </Button>
          )}
          {o.status === 'DELIVERED' && (
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Fulfilled
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(o.orderNumber, 'RETURNED')}
                disabled={isUpdating === o.orderNumber}
                className="text-amber-700 hover:text-amber-800 border-neutral-300"
              >
                Return
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(o.orderNumber, 'REFUNDED')}
                disabled={isUpdating === o.orderNumber}
                className="text-rose-700 hover:text-rose-800 border-neutral-300"
              >
                Refund
              </Button>
            </div>
          )}
          {o.status === 'RETURNED' && (
            <div className="flex items-center gap-1.5">
              <span className="text-amber-700 text-xs font-semibold">Returned</span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStatusChange(o.orderNumber, 'REFUNDED')}
                disabled={isUpdating === o.orderNumber}
                className="bg-rose-700 hover:bg-rose-800"
              >
                Refund
              </Button>
            </div>
          )}
          {o.status === 'REFUNDED' && (
            <span className="text-rose-700 text-xs font-semibold flex items-center gap-1">
              Refunded
            </span>
          )}
          {['PENDING', 'CONFIRMED'].includes(o.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(o.orderNumber, 'CANCELLED')}
              disabled={isUpdating === o.orderNumber}
              className="text-rose-600 hover:text-rose-700 border-neutral-300"
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
    {
      key: 'invoice',
      label: 'Invoice',
      align: 'center',
      render: (o) => {
        const inv = o.invoices?.[0];
        return (
          <a
            href={`/api/invoices/${o.orderNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            download={`vanigam-invoice-${o.orderNumber}.pdf`}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded border border-neutral-200 hover:bg-neutral-50 inline-flex items-center"
            title={inv ? `Download Invoice (${inv.invoiceNumber})` : 'Generate & Download Tax Invoice'}
          >
            <FileText className="w-3.5 h-3.5" />
          </a>
        );
      },
    },
  ];

  const parsedAddress = selectedOrder?.shippingAddressJson
    ? JSON.parse(selectedOrder.shippingAddressJson)
    : {};

  return (
    <div className="space-y-6 max-w-7xl min-w-0">
      {/* Page Header */}
      <PageHeader
        title="Order Operations"
        description="Fulfillment queue, courier consignment management, and invoice reconciliations."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Orders' },
        ]}
      />

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
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

      {/* Orders DataTable */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        keyField="id"
        selectedIds={selectedIds}
        onSelect={setSelectedIds}
        searchPlaceholder="Search order #, recipient name, or email..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        bulkActions={[
          {
            label: 'Mark as Packed',
            onClick: (ids) => handleBulkStatusChange(ids, 'PACKED'),
          },
          {
            label: 'Mark as Shipped',
            onClick: (ids) => handleBulkStatusChange(ids, 'SHIPPED'),
          },
        ]}
      />

      {/* Order Detail Slide-Over Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.orderNumber}`}
          description={`Placed on ${new Date(selectedOrder.createdAt).toLocaleString('en-IN')}`}
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getBadgeVariant(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
                <a
                  href={`/api/invoices/${selectedOrder.orderNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`vanigam-invoice-${selectedOrder.orderNumber}.pdf`}
                  className="text-xs font-semibold text-neutral-800 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download Tax Invoice</span>
                </a>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedOrder.status === 'PENDING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(selectedOrder.orderNumber, 'CONFIRMED')}
                    disabled={isUpdating === selectedOrder.orderNumber}
                  >
                    Confirm Order
                  </Button>
                )}
                {selectedOrder.status === 'CONFIRMED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(selectedOrder.orderNumber, 'PROCESSING')}
                    disabled={isUpdating === selectedOrder.orderNumber}
                  >
                    Process Order
                  </Button>
                )}
                {selectedOrder.status === 'PROCESSING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(selectedOrder.orderNumber, 'PACKED')}
                    disabled={isUpdating === selectedOrder.orderNumber}
                  >
                    Pack Order
                  </Button>
                )}
                {selectedOrder.status === 'PACKED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openShippingModal(selectedOrder)}
                    disabled={isUpdating === selectedOrder.orderNumber}
                  >
                    Ship Order
                  </Button>
                )}
                {selectedOrder.status === 'SHIPPED' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(selectedOrder.orderNumber, 'OUT_FOR_DELIVERY')}
                      disabled={isUpdating === selectedOrder.orderNumber}
                    >
                      Out for Delivery
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatusChange(selectedOrder.orderNumber, 'DELIVERED')}
                      disabled={isUpdating === selectedOrder.orderNumber}
                      className="bg-emerald-700 hover:bg-emerald-800"
                    >
                      Mark Delivered
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(selectedOrder.orderNumber, 'DELIVERED')}
                    disabled={isUpdating === selectedOrder.orderNumber}
                    className="bg-emerald-700 hover:bg-emerald-800"
                  >
                    Mark Delivered
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close Drawer
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs">
            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                  Customer Information
                </span>
                <p className="font-semibold text-neutral-900">{selectedOrder.customerName}</p>
                <p className="text-neutral-600">{selectedOrder.customerEmail}</p>
                <p className="text-neutral-600">{selectedOrder.customerPhone || parsedAddress.phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                  Delivery Destination
                </span>
                <p className="font-semibold text-neutral-900">{parsedAddress.name || selectedOrder.customerName}</p>
                <p className="text-neutral-600">{parsedAddress.streetAddress}</p>
                <p className="text-neutral-600">
                  {parsedAddress.city}, {parsedAddress.state} – {parsedAddress.postalCode}
                </p>
                {parsedAddress.gstin && (
                  <p className="text-[11px] font-mono text-neutral-800 font-semibold pt-1">
                    GSTIN: {parsedAddress.gstin}
                  </p>
                )}
              </div>
            </div>

            {/* Order timeline (includes customer return requests) */}
            {selectedOrder.history?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px]">Timeline</h4>
                <ol className="space-y-1.5 border-l-2 border-neutral-200 pl-3">
                  {selectedOrder.history.map((h: any) => (
                    <li key={h.id} className={h.note?.startsWith('Return requested') ? 'text-amber-800' : 'text-neutral-700'}>
                      <span className="font-semibold">{String(h.status).replace(/_/g, ' ')}</span>
                      <span className="text-neutral-400"> · {new Date(h.createdAt).toLocaleString('en-IN')}</span>
                      {h.note && <div className="text-neutral-500">{h.note}</div>}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Line Items Table */}
            <div className="space-y-2">
              <h4 className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px]">
                Consignment Items ({selectedOrder.items.length})
              </h4>
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedOrder.items.map((it: any) => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3 font-medium text-neutral-900">{it.title}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono-numeric">
                          ₹{it.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numeric font-semibold text-neutral-900">
                          ₹{it.totalPrice.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Reconciliation */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-600">Taxable Subtotal:</span>
                <span className="font-mono-numeric font-medium">₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">GST Tax Total:</span>
                <span className="font-mono-numeric font-medium">₹{selectedOrder.taxTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Freight Shipping Fee:</span>
                <span className="font-mono-numeric font-medium">
                  {selectedOrder.shippingFee === 0 ? 'FREE' : `₹${selectedOrder.shippingFee}`}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm font-semibold text-neutral-900">
                <span>Grand Total Settled:</span>
                <span className="font-mono-numeric">₹{selectedOrder.grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Dispatch / Shipping Modal */}
      {shippingOrder && (
        <Modal
          isOpen={!!shippingOrder}
          onClose={() => setShippingOrder(null)}
          title={`Dispatch Order #${shippingOrder.orderNumber}`}
          description="Enter carrier logistics partner and consignment Air Waybill (AWB) tracking reference."
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShippingOrder(null)}
                disabled={isUpdating === shippingOrder.orderNumber}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleShipSubmit}
                disabled={isUpdating === shippingOrder.orderNumber || !trackingNumber.trim()}
              >
                {isUpdating === shippingOrder.orderNumber ? 'Dispatching...' : 'Confirm Shipment'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleShipSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Logistics Carrier
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              >
                <option value="Delhivery Express Cargo">Delhivery Express Cargo</option>
                <option value="Blue Dart Aviation">Blue Dart Aviation</option>
                <option value="DTDC Surface & Air">DTDC Surface & Air</option>
                <option value="India Post Speed Post">India Post Speed Post</option>
                <option value="Shadowfax Commercial">Shadowfax Commercial</option>
                <option value="Local Courier / Hand Delivery">Local Courier / Hand Delivery</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                AWB / Consignment Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. DLV-994821038"
                className="w-full p-2.5 rounded-lg border border-neutral-300 font-mono text-xs text-neutral-900 focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                required
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                This tracking code will be shared with the customer and recorded in dispatch records.
              </p>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
