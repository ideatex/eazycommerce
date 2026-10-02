import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Badge, Card, CardContent } from '@/components/ui';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function WidgetHeader({ title, hint, href, linkText }: { title: string; hint?: string; href?: string; linkText?: string }) {
  return (
    <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
      <div>
        <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">{title}</h2>
        {hint && <p className="text-[11px] text-neutral-500 mt-0.5">{hint}</p>}
      </div>
      {href && (
        <Link href={href} className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 flex items-center gap-1 shrink-0">
          <span>{linkText}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function Shell({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`bg-white border border-neutral-200/90 rounded-xl overflow-hidden shadow-subtle ${className}`}>{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-neutral-400 py-8 text-center px-4">{children}</p>;
}

/** KPI tile in the same style as the existing dashboard cards. */
export function KpiCard({ label, value, sub }: { label: string; value: React.ReactNode; sub: React.ReactNode }) {
  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <span className="text-xs text-neutral-500 block mb-1 font-medium">{label}</span>
        <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">{value}</div>
        <span className="text-[11px] text-neutral-400 block mt-1">{sub}</span>
      </CardContent>
    </Card>
  );
}

export function RevenueChart({ days }: { days: Array<{ label: string; revenue: number; orders: number }> }) {
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const total = days.reduce((a, d) => a + d.revenue, 0);
  const orders = days.reduce((a, d) => a + d.orders, 0);
  return (
    <Shell className="lg:col-span-8">
      <WidgetHeader title="Revenue, last 7 days" hint="Excludes cancelled and refunded orders" href="/admin/analytics?period=7d" linkText="Analytics" />
      <div className="p-4">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-xl font-bold text-neutral-900 font-mono-numeric">{inr(total)}</span>
          <span className="text-[11px] text-neutral-500">{orders} {orders === 1 ? 'order' : 'orders'}</span>
        </div>
        {total === 0 ? (
          <Empty>No sales in the last 7 days.</Empty>
        ) : (
          <div className="flex items-end gap-2 sm:gap-3 h-40" role="img" aria-label={`Daily revenue for the last 7 days, total ${inr(total)}`}>
            {days.map((d) => (
              <div key={d.label} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-1.5" title={`${d.label}: ${inr(d.revenue)} from ${d.orders} orders`}>
                <span className="text-[10px] text-neutral-500 font-mono-numeric">{d.revenue > 0 ? inr(d.revenue) : ''}</span>
                <div
                  className={`w-full rounded-t ${d.revenue > 0 ? 'bg-blue-600' : 'bg-neutral-200'}`}
                  style={{ height: `${Math.max(d.revenue > 0 ? 6 : 2, (d.revenue / max) * 100)}%` }}
                />
                <span className="text-[10px] text-neutral-500">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

const STATUS_BAR: Record<string, string> = {
  PENDING: 'bg-amber-400',
  CONFIRMED: 'bg-neutral-400',
  PROCESSING: 'bg-blue-500',
  PACKED: 'bg-blue-500',
  SHIPPED: 'bg-blue-500',
  OUT_FOR_DELIVERY: 'bg-blue-500',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-rose-400',
  RETURNED: 'bg-rose-400',
  REFUNDED: 'bg-rose-400',
};

export function OrderStatusWidget({ counts }: { counts: Array<{ status: string; count: number }> }) {
  const total = counts.reduce((a, c) => a + c.count, 0);
  return (
    <Shell className="lg:col-span-4">
      <WidgetHeader title="Orders by status" href="/admin/orders" linkText="All orders" />
      <div className="p-4 space-y-3">
        {total === 0 ? (
          <Empty>No orders yet.</Empty>
        ) : (
          counts.map((c) => (
            <Link key={c.status} href={`/admin/orders?status=${c.status}`} className="block group">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-medium text-neutral-700 group-hover:underline">{c.status.replace(/_/g, ' ')}</span>
                <span className="font-mono-numeric text-neutral-500">{c.count}</span>
              </div>
              <div className="h-1.5 rounded bg-neutral-100 overflow-hidden">
                <div className={`h-full rounded ${STATUS_BAR[c.status] ?? 'bg-neutral-400'}`} style={{ width: `${(c.count / total) * 100}%` }} />
              </div>
            </Link>
          ))
        )}
      </div>
    </Shell>
  );
}

export function TopProductsWidget({ items }: { items: Array<{ title: string; quantity: number; revenue: number }> }) {
  return (
    <Shell className="lg:col-span-4">
      <WidgetHeader title="Top products" hint="By revenue, last 30 days" href="/admin/products" linkText="Catalogue" />
      {items.length === 0 ? (
        <Empty>No product sales in the last 30 days.</Empty>
      ) : (
        <ol className="divide-y divide-neutral-100">
          {items.map((p, i) => (
            <li key={p.title} className="px-4 py-3 flex items-center gap-3 text-xs">
              <span className="w-5 h-5 rounded bg-neutral-100 text-neutral-600 text-[11px] font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-neutral-900 block truncate">{p.title}</span>
                <span className="text-[11px] text-neutral-400">{p.quantity} sold</span>
              </div>
              <span className="font-semibold text-neutral-900 font-mono-numeric">{inr(p.revenue)}</span>
            </li>
          ))}
        </ol>
      )}
    </Shell>
  );
}

export function LowStockWidget({ items }: { items: Array<{ id: string; title: string; variant: string; sku: string; available: number }> }) {
  return (
    <Shell className="lg:col-span-4">
      <WidgetHeader title="Low stock" hint="Available units at or below 15" href="/admin/inventory" linkText="Inventory" />
      {items.length === 0 ? (
        <Empty>Stock levels are healthy.</Empty>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((v) => (
            <li key={v.id} className="px-4 py-3 flex items-center gap-3 text-xs">
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-neutral-900 block truncate">{v.title}</span>
                <span className="text-[11px] text-neutral-400 font-mono">{v.sku}{v.variant && v.variant !== 'Standard' ? ` · ${v.variant}` : ''}</span>
              </div>
              <Badge variant={v.available <= 0 ? 'error' : 'warning'}>{v.available <= 0 ? 'Out of stock' : `${v.available} left`}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

export function PendingReviewsWidget({ count, latest }: { count: number; latest: Array<{ id: string; rating: number; comment: string; product: string }> }) {
  return (
    <Shell className="lg:col-span-4">
      <WidgetHeader title="Reviews awaiting approval" hint={`${count} pending`} href="/admin/reviews" linkText="Moderate" />
      {latest.length === 0 ? (
        <Empty>No reviews are waiting for moderation.</Empty>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {latest.map((r) => (
            <li key={r.id} className="px-4 py-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-900 truncate">{r.product}</span>
                <span className="text-amber-500 shrink-0" aria-label={`${r.rating} out of 5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              <p className="text-neutral-500 mt-0.5 line-clamp-2">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
