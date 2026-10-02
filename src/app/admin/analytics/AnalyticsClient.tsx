'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  CreditCard,
  Truck,
  Calendar,
  Percent,
  CheckCircle2,
  Clock,
  Building2
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  PageHeader
} from '@/components/ui';

interface AnalyticsClientProps {
  metrics: {
    period: string;
    grossSales: number;
    netRevenue: number;
    totalTax: number;
    totalShipping: number;
    totalDiscount: number;
    totalOrders: number;
    aov: number;
    totalCustomers: number;
    totalProducts: number;
    statusCounts: Record<string, number>;
    paymentMethodCounts: Record<string, number>;
    topProducts: Array<{ title: string; quantity: number; revenue: number }>;
  };
}

export function AnalyticsClient({ metrics }: AnalyticsClientProps) {
  const router = useRouter();

  const periods = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'all', label: 'All Time' },
  ];

  const handlePeriodChange = (p: string) => {
    router.push(`/admin/analytics?period=${p}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Commercial Analytics & Intelligence"
          description="Auditable financial metrics, sales velocity, average basket sizes, and product leaderboard."
        />

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-neutral-100 p-1 rounded-lg shrink-0 text-xs">
          {periods.map((p) => {
            const isActive = metrics.period === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Gross Commerce Sales</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              ₹{Math.round(metrics.grossSales).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1 font-mono-numeric">
              GST: ₹{Math.round(metrics.totalTax).toLocaleString('en-IN')}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Average Order Value (AOV)</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              ₹{metrics.aov.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Across {metrics.totalOrders} customer orders
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Net Commerce Volume</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              ₹{Math.round(metrics.netRevenue).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              Discounts: ₹{Math.round(metrics.totalDiscount).toLocaleString('en-IN')}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Top Selling Products Leaderboard */}
        <div className="lg:col-span-8 bg-white border border-neutral-200/90 rounded-xl overflow-hidden shadow-subtle">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
            <div>
              <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Top Performing Products Leaderboard
              </h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">Ranked by total commercial volume</p>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              {metrics.topProducts.length} items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Product Title</th>
                  <th className="py-3 px-4 text-center font-semibold">Units Sold</th>
                  <th className="py-3 px-4 text-right font-semibold">Gross Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {metrics.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-neutral-400 text-xs">
                      No product sales recorded in this selected period.
                    </td>
                  </tr>
                ) : (
                  metrics.topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-bold text-neutral-400 text-xs">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">
                        {p.title}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-neutral-700">
                        {p.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900 font-mono-numeric">
                        ₹{Math.round(p.revenue).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Order Pipeline & Settlement Methods */}
        <div className="lg:col-span-4 space-y-6">
          {/* Order Status Distribution Card */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-neutral-500" />
                <span>Fulfillment Status Pipeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5 text-xs">
              {Object.keys(metrics.statusCounts).length === 0 ? (
                <p className="text-neutral-400 text-center py-4">No order records found.</p>
              ) : (
                Object.entries(metrics.statusCounts).map(([status, count]) => {
                  const percentage =
                    metrics.totalOrders > 0 ? Math.round((count / metrics.totalOrders) * 100) : 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-neutral-800">{status}</span>
                        <span className="font-mono text-neutral-500">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            status === 'DELIVERED'
                              ? 'bg-emerald-600'
                              : status === 'CANCELLED'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Settlement Methods Distribution Card */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                <span>Settlement Channels</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5 text-xs">
              {Object.keys(metrics.paymentMethodCounts).length === 0 ? (
                <p className="text-neutral-400 text-center py-4">No transactions recorded.</p>
              ) : (
                Object.entries(metrics.paymentMethodCounts).map(([method, count]) => (
                  <div
                    key={method}
                    className="p-2.5 bg-neutral-50 border border-neutral-200/80 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-neutral-700" />
                      <span className="font-semibold text-neutral-800 font-mono text-[11px]">
                        {method}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-neutral-900">
                      {count} {count === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
