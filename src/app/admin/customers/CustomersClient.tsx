'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Eye,
  DollarSign,
  Calendar
} from 'lucide-react';
import {
  Button,
  Badge,
  DataTable,
  Column,
  PageHeader,
  Card,
  CardContent,
} from '@/components/ui';

interface CustomerItem {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  orderCount: number;
  totalSpent: number;
  notes: string | null;
  b2b: {
    companyName: string;
    creditLimit: number;
    availableCredit: number;
    status: string;
  } | null;
  addressCount: number;
  reviewCount: number;
}

interface CustomersClientProps {
  initialCustomers: CustomerItem[];
  totalCount: number;
}

export function CustomersClient({ initialCustomers, totalCount }: CustomersClientProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'B2B'>('ALL');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setIsUpdating(id);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c))
        );
        showFeedback('success', `Customer account ${!currentStatus ? 'activated' : 'deactivated'}.`);
      } else {
        showFeedback('error', data.error?.message || 'Failed to update customer');
      }
    } catch {
      showFeedback('error', 'Network error updating customer status');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.b2b?.companyName && c.b2b.companyName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'ACTIVE') return c.isActive;
    if (activeTab === 'INACTIVE') return !c.isActive;
    if (activeTab === 'B2B') return !!c.b2b;
    return true;
  });

  const totalSpentAll = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const b2bCount = customers.filter((c) => !!c.b2b).length;

  const columns: Column<CustomerItem>[] = [
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {item.fullName ? item.fullName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/customers/${item.id}`}
              className="font-semibold text-neutral-900 hover:text-neutral-600 block truncate"
            >
              {item.fullName}
            </Link>
            <span className="text-[11px] text-neutral-400 block truncate">{item.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Account Type',
      render: (item) =>
        item.b2b ? (
          <div>
            <Badge variant="info" className="gap-1">
              <Building2 className="w-3 h-3" />
              <span>B2B Wholesale</span>
            </Badge>
            <span className="text-[10px] text-neutral-500 block truncate mt-0.5">
              {item.b2b.companyName}
            </span>
          </div>
        ) : (
          <Badge variant="neutral">Retail Buyer</Badge>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.isActive ? 'success' : 'error'}>
          {item.isActive ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: 'orders',
      label: 'Orders',
      align: 'center',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-neutral-800">
          {item.orderCount}
        </span>
      ),
    },
    {
      key: 'totalSpent',
      label: 'Lifetime Value',
      align: 'right',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-neutral-900">
          ₹{Math.round(item.totalSpent).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'joined',
      label: 'Joined',
      align: 'right',
      render: (item) => (
        <span className="text-neutral-500 text-[11px] font-mono">
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            href={`/admin/customers/${item.id}`}
            className="text-xs h-7 px-2.5"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            <span>Profile</span>
          </Button>

          <Button
            size="sm"
            variant={item.isActive ? 'ghost' : 'outline'}
            onClick={() => handleToggleStatus(item.id, item.isActive)}
            disabled={isUpdating === item.id}
            className={`text-xs h-7 px-2 ${
              item.isActive
                ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        description="Comprehensive directory of registered retail buyers and approved B2B corporate trade accounts."
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

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Total Registered Users</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              {totalCount}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              {b2bCount} corporate trade accounts
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Customer Lifetime Value</span>
            <div className="text-2xl font-bold text-neutral-900 font-mono-numeric">
              ₹{Math.round(totalSpentAll).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1 font-mono-numeric">
              Across active buyer ledger
            </span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4">
            <span className="text-xs text-neutral-500 block mb-1 font-medium">Account Status Health</span>
            <div className="text-2xl font-bold text-emerald-700 font-mono-numeric">
              {customers.filter((c) => c.isActive).length} Active
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              {customers.filter((c) => !c.isActive).length} deactivated accounts
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Customers Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        keyField="id"
        searchPlaceholder="Search by name, email, phone or corporate entity..."
        searchValue={search}
        onSearchChange={setSearch}
        tabs={[
          { id: 'ALL', label: 'All Accounts', count: customers.length },
          { id: 'ACTIVE', label: 'Active', count: customers.filter((c) => c.isActive).length },
          { id: 'INACTIVE', label: 'Deactivated', count: customers.filter((c) => !c.isActive).length },
          { id: 'B2B', label: 'B2B Trade Accounts', count: b2bCount },
        ]}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as any)}
      />
    </div>
  );
}
