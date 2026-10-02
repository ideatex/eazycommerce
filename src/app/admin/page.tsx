import React from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  FileText,
  Package,
  ArrowUpRight,
  AlertCircle,
  Clock,
  Truck,
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  Store,
  Building2,
  Users,
  ShieldCheck
} from 'lucide-react';
import db from '@/lib/db';
import { requireAdminScope } from '@/lib/adminScope';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default async function AdminDashboardPage() {
  const { businessId } = await requireAdminScope();
  const [
    totalOrders,
    totalProducts,
    orders,
    b2bProfiles,
    auditLogs,
    lowStockVariants,
    pendingOrdersCount,
  ] = await Promise.all([
    db.order.count({ where: { businessId } }),
    db.product.count({ where: { businessId } }),
    db.order.findMany({
      where: { businessId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        invoices: true,
      },
    }),
    db.b2BProfile.findMany({ where: { user: { businessId } } }),
    db.auditLog.findMany({
      where: { businessId },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true } } },
    }),
    db.productVariant.findMany({
      where: { stock: { lte: 15 }, product: { businessId } },
      include: { product: true },
      take: 5,
    }),
    db.order.count({
      where: { status: 'PENDING', businessId },
    }),
  ]);

  const allOrders = await db.order.findMany({
    where: { businessId },
    select: { grandTotal: true, taxTotal: true },
  });

  const totalRevenue = allOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const totalTax = allOrders.reduce((acc, o) => acc + o.taxTotal, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const getBadgeVariant = (status: string): 'neutral' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'PROCESSING':
      case 'SHIPPED':
      case 'PACKED':
        return 'info';
      case 'CONFIRMED':
        return 'neutral';
      case 'PENDING':
      default:
        return 'warning';
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl min-w-0">
      {/* Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
            Operational Triage Center
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time fulfillment pipeline, inventory replenishment alerts, and store revenue.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            href="/admin/orders"
          >
            Fulfillment Queue
          </Button>
          <Button
            variant="primary"
            size="sm"
            href="/admin/products/new"
          >
            + Add Product
          </Button>
        </div>
      </div>

      {/* Operational Action Cards (Triage Alerts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Orders Needing Dispatch */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          pendingOrdersCount > 0
            ? 'bg-amber-50/60 border-amber-200 text-amber-900'
            : 'bg-emerald-50/40 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              pendingOrdersCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold">
                {pendingOrdersCount > 0
                  ? `${pendingOrdersCount} Orders Awaiting Confirmation`
                  : 'Fulfillment Queue Clear'}
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                {pendingOrdersCount > 0
                  ? 'Customer orders requiring verification and carrier booking.'
                  : 'All incoming customer orders have been acknowledged.'}
              </p>
            </div>
          </div>
          <Link
            href="/admin/orders?status=PENDING"
            className="text-xs font-semibold underline underline-offset-2 shrink-0 sm:ml-3"
          >
            Process & Dispatch →
          </Link>
        </div>

        {/* Low Stock Replenishment Warnings */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          lowStockVariants.length > 0
            ? 'bg-rose-50/50 border-rose-200 text-rose-900'
            : 'bg-neutral-50 border-neutral-200 text-neutral-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              lowStockVariants.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-600'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold">
                {lowStockVariants.length > 0
                  ? `${lowStockVariants.length} SKUs at or Below Safe Stock`
                  : 'Warehouse Stock Levels Optimal'}
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                {lowStockVariants.length > 0
                  ? 'Inventory below 15 units. Time to restock.'
                  : 'No variants currently under critical replenishment limits.'}
              </p>
            </div>
          </div>
          <Link
            href="/admin/products"
            className="text-xs font-semibold underline underline-offset-2 shrink-0 sm:ml-3"
          >
            Manage Stock →
          </Link>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Gross Commerce Sales</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              ₹{Math.round(totalRevenue).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1 font-mono-numeric">
              GST: ₹{Math.round(totalTax).toLocaleString('en-IN')}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Total Orders / AOV</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              {totalOrders}
            </div>
            <span className="text-[11px] text-neutral-500 block mt-1">
              AOV: <strong className="text-neutral-800 font-mono-numeric">₹{avgOrderValue.toLocaleString('en-IN')}</strong>
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">B2B Accounts</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              {b2bProfiles.length} Accounts
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Corporate B2B credit lines
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Orders Table & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders High-Density Table */}
        <div className="lg:col-span-8 bg-white border border-neutral-200/90 rounded-xl overflow-hidden shadow-subtle">
          <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
            <div>
              <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Recent Orders Pipeline
              </h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">Showing latest transactions across all channels</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 flex items-center gap-1"
            >
              <span>Full Order Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Settlement</th>
                  <th className="py-3 px-4 text-right font-semibold">Amount</th>
                  <th className="py-3 px-4 text-center font-semibold">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((o) => {
                  const invoice = o.invoices[0];

                  return (
                    <tr key={o.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                        <Link href={`/admin/orders?search=${o.orderNumber}`} className="hover:underline">
                          #{o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-neutral-800 block truncate max-w-xs">{o.customerName}</span>
                        <span className="text-[11px] text-neutral-400">{o.customerEmail}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getBadgeVariant(o.status)}>
                          {o.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-neutral-600 font-mono">
                        {o.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-neutral-900 font-mono-numeric">
                        ₹{o.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={`/api/invoices/${o.orderNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={`vanigam-invoice-${o.orderNumber}.pdf`}
                          className="p-1 text-neutral-500 hover:text-neutral-900 inline-block"
                          title={invoice ? `Download Invoice (${invoice.invoiceNumber})` : 'Generate & Download Tax Invoice'}
                        >
                          <FileText className="w-4 h-4 text-neutral-600" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Stream */}
        <Card className="lg:col-span-4 bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
              <span>Audit Trail Activity</span>
            </CardTitle>
            <Link href="/admin/audit" className="text-[11px] text-neutral-500 hover:underline">
              View all
            </Link>
          </CardHeader>

          <CardContent className="pt-4 space-y-3.5">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">No recent activity logged.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="text-xs pb-3 border-b border-neutral-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-neutral-800">{log.action}</span>
                    <span className="text-neutral-400 text-[10px] font-mono">
                      {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Target: <span className="font-mono text-neutral-700">{log.entity}</span>
                    {log.user && <span className="text-neutral-400"> • by {log.user.fullName}</span>}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
