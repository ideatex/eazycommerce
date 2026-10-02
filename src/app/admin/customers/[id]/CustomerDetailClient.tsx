'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  MapPin,
  ShoppingBag,
  Star,
  Clock,
  ShieldCheck,
  FileText,
  Check,
  Edit3
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Textarea
} from '@/components/ui';

interface CustomerDetailClientProps {
  customer: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    computedTotalSpent: number;
    computedOrderCount: number;
    customerProfile: {
      notes: string | null;
    } | null;
    b2bProfile: {
      companyName: string;
      gstin: string;
      pan: string | null;
      creditLimit: number;
      availableCredit: number;
      paymentTermsDays: number;
      status: string;
    } | null;
    addresses: Array<{
      id: string;
      name: string;
      phone: string;
      streetAddress: string;
      apartment: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      isDefaultShipping: boolean;
      isDefaultBilling: boolean;
    }>;
    orders: Array<{
      id: string;
      orderNumber: string;
      status: string;
      paymentStatus: string;
      paymentMethod: string;
      grandTotal: number;
      createdAt: string;
      invoices: Array<{ invoiceNumber: string }>;
      items: Array<{ id: string; title: string; quantity: number; unitPrice: number }>;
    }>;
    reviews: Array<{
      id: string;
      rating: number;
      title: string | null;
      comment: string;
      createdAt: string;
      product: { id: string; title: string; slug: string };
    }>;
  };
}

export function CustomerDetailClient({ customer: initialCustomer }: CustomerDetailClientProps) {
  const [customer, setCustomer] = useState(initialCustomer);
  const [notes, setNotes] = useState(customer.customerProfile?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !customer.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer((prev) => ({ ...prev, isActive: !prev.isActive }));
        showFeedback('success', `Customer account ${!customer.isActive ? 'activated' : 'deactivated'}.`);
      } else {
        showFeedback('error', data.error?.message || 'Failed to update account status');
      }
    } catch {
      showFeedback('error', 'Network error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', 'Admin notes updated successfully.');
      } else {
        showFeedback('error', data.error?.message || 'Failed to save notes');
      }
    } catch {
      showFeedback('error', 'Network error saving notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link & Primary Action */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/customers"
          className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </Link>

        <Button
          size="sm"
          variant={customer.isActive ? 'destructive' : 'primary'}
          onClick={handleToggleStatus}
          disabled={isUpdatingStatus}
          className="text-xs"
        >
          {customer.isActive ? 'Deactivate Account' : 'Activate Account'}
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

      {/* Customer Header Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-xl p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-neutral-900 text-white flex items-center justify-center text-lg font-bold shadow-xs">
            {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : 'C'}
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
                {customer.fullName}
              </h1>
              <Badge variant={customer.isActive ? 'success' : 'error'}>
                {customer.isActive ? 'Active' : 'Disabled'}
              </Badge>
              {customer.b2bProfile && (
                <Badge variant="info">B2B Corporate</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 mt-1.5">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span>{customer.email}</span>
              </span>
              {customer.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{customer.phone}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>
                  Registered {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Summary KPIs */}
        <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-neutral-100 pt-4 sm:pt-0 sm:pl-6">
          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block font-medium">
              Total Spent
            </span>
            <span className="text-lg font-bold text-neutral-900 font-mono-numeric">
              ₹{Math.round(customer.computedTotalSpent).toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block font-medium">
              Orders Placed
            </span>
            <span className="text-lg font-bold text-neutral-900 font-mono-numeric">
              {customer.computedOrderCount}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Orders & Activity */}
        <div className="lg:col-span-8 space-y-6">
          {/* Orders History Card */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-neutral-500" />
                <span>Order History ({customer.orders.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customer.orders.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  No orders placed yet by this customer.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-medium text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Order</th>
                        <th className="py-2.5 px-4 font-semibold">Date</th>
                        <th className="py-2.5 px-4 font-semibold">Items</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 px-4 text-right font-semibold">Total</th>
                        <th className="py-2.5 px-4 text-center font-semibold">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {customer.orders.map((order) => (
                        <tr key={order.id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                            <Link href={`/admin/orders?search=${order.orderNumber}`} className="hover:underline">
                              #{order.orderNumber}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-neutral-500 text-[11px] font-mono">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-neutral-600">
                            {order.items.reduce((acc, it) => acc + it.quantity, 0)} items
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                order.status === 'DELIVERED'
                                  ? 'success'
                                  : order.status === 'CANCELLED'
                                  ? 'error'
                                  : 'warning'
                              }
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-neutral-900 font-mono-numeric">
                            ₹{order.grandTotal.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <a
                              href={`/api/invoices/${order.orderNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={`vanigam-invoice-${order.orderNumber}.pdf`}
                              className="text-neutral-500 hover:text-neutral-900 inline-block p-1"
                              title={order.invoices[0] ? `Download Invoice (${order.invoices[0].invoiceNumber})` : 'Generate & Download Tax Invoice'}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Reviews Card */}
          {customer.reviews.length > 0 && (
            <Card className="bg-white">
              <CardHeader className="pb-3 border-b border-neutral-100">
                <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Submitted Reviews ({customer.reviews.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 divide-y divide-neutral-100">
                {customer.reviews.map((rev) => (
                  <div key={rev.id} className="py-3 first:pt-0 last:pb-0 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/products/${rev.product.slug}`}
                        target="_blank"
                        className="font-semibold text-neutral-900 hover:underline"
                      >
                        {rev.product.title}
                      </Link>
                      <span className="text-neutral-400 text-[10px] font-mono">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3 h-3 ${
                            idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-neutral-600 text-[11px] mt-1">{rev.comment}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Profile & Addresses */}
        <div className="lg:col-span-4 space-y-6">
          {/* B2B Trade Profile Card if applicable */}
          {customer.b2bProfile && (
            <Card className="bg-white border-blue-200 shadow-subtle">
              <CardHeader className="pb-3 border-b border-blue-50 bg-blue-50/40">
                <CardTitle className="text-xs font-semibold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>B2B Corporate Account</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-neutral-400 block font-medium">Company Name</span>
                  <span className="font-semibold text-neutral-900">{customer.b2bProfile.companyName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block font-medium">GSTIN</span>
                  <span className="font-mono font-semibold text-neutral-800">{customer.b2bProfile.gstin}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-medium block">Credit Limit</span>
                    <span className="font-mono font-bold text-neutral-900">
                      ₹{customer.b2bProfile.creditLimit.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-medium block">Available</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ₹{customer.b2bProfile.availableCredit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Internal Notes */}
          <Card className="bg-white">
            <CardHeader className="pb-2 border-b border-neutral-100 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Internal Staff Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Textarea
                placeholder="Log customer preferences, verification details, or credit remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="text-xs"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="text-xs h-7 px-3"
                >
                  <Check className="w-3 h-3 mr-1" />
                  <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Address Book Card */}
          <Card className="bg-white">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span>Saved Addresses ({customer.addresses.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-neutral-100">
              {customer.addresses.length === 0 ? (
                <p className="text-xs text-neutral-400 py-2">No addresses on file.</p>
              ) : (
                customer.addresses.map((addr) => (
                  <div key={addr.id} className="py-3 first:pt-0 last:pb-0 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900">{addr.name}</span>
                      {addr.isDefaultShipping && (
                        <Badge variant="neutral" className="text-[10px]">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-neutral-600 leading-relaxed text-[11px]">
                      {addr.streetAddress}
                      {addr.apartment && `, ${addr.apartment}`}
                      <br />
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <span className="text-[11px] text-neutral-400 block font-mono">
                      Phone: {addr.phone}
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
