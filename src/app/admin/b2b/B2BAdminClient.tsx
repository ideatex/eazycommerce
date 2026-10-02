'use client';

import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle,
  CreditCard,
  Check
} from 'lucide-react';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, PageHeader, Modal, Input } from '@/components/ui';

interface B2BAdminClientProps {
  initialAccounts: any[];
}

export function B2BAdminClient({ initialAccounts }: B2BAdminClientProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [adjustingAccount, setAdjustingAccount] = useState<any | null>(null);
  const [newCreditLimit, setNewCreditLimit] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleUpdate = async (b2bProfileId: string, updates: Record<string, any>) => {
    setIsUpdating(b2bProfileId);
    try {
      const res = await fetch('/api/b2b/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ b2bProfileId, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === b2bProfileId ? { ...acc, ...updates } : acc))
        );
        showFeedback('success', 'Corporate account updated successfully.');
      } else {
        showFeedback('error', data.error?.message || 'Failed to update account');
      }
    } catch {
      showFeedback('error', 'Network error updating B2B profile');
    } finally {
      setIsUpdating(null);
      setAdjustingAccount(null);
    }
  };

  const handleSaveCreditAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingAccount) return;
    const limitNum = parseFloat(newCreditLimit);
    if (!limitNum || limitNum <= 0) return;
    handleUpdate(adjustingAccount.id, { creditLimit: limitNum, availableCredit: limitNum });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Corporate Trade Accounts (B2B)"
        description="Corporate credit limit verification, tax GSTIN compliance, and net 30/60 billing terms."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'B2B Accounts' },
        ]}
      />

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

      <Card className="bg-white border-neutral-200/90 shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Corporate Entity</th>
                  <th className="py-3.5 px-4">GSTIN & Business Type</th>
                  <th className="py-3.5 px-4">Key Contact</th>
                  <th className="py-3.5 px-4 text-right">Credit Line</th>
                  <th className="py-3.5 px-4 text-center">Settlement Terms</th>
                  <th className="py-3.5 px-4">Credit Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-400">
                      No corporate trade accounts registered.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-neutral-900">{acc.companyName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-700">
                        <div className="font-semibold">{acc.gstin}</div>
                        <span className="text-[10px] text-neutral-500 font-sans">{acc.businessType || 'Institutional Buyer'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-neutral-900 font-medium">{acc.user?.fullName}</span>
                        <span className="text-[11px] text-neutral-400 block">{acc.user?.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-neutral-900 font-mono-numeric">
                        ₹{acc.creditLimit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                          Net {acc.paymentTermsDays} Days
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={acc.status === 'APPROVED' ? 'success' : 'warning'}>
                          {acc.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {acc.status !== 'APPROVED' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleUpdate(acc.id, { status: 'APPROVED' })}
                              disabled={isUpdating === acc.id}
                            >
                              Approve Credit
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAdjustingAccount(acc);
                                setNewCreditLimit(acc.creditLimit.toString());
                              }}
                              disabled={isUpdating === acc.id}
                            >
                              Adjust Limit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Adjust Credit Modal */}
      {adjustingAccount && (
        <Modal
          isOpen={!!adjustingAccount}
          onClose={() => setAdjustingAccount(null)}
          title={`Adjust Trade Credit Limit: ${adjustingAccount.companyName}`}
          description="Update the revolving credit ceiling for this approved corporate buyer."
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                size="md"
                onClick={() => setAdjustingAccount(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                form="credit-adjustment-form"
                isLoading={isUpdating === adjustingAccount.id}
              >
                Save New Credit Limit
              </Button>
            </>
          }
        >
          <form id="credit-adjustment-form" onSubmit={handleSaveCreditAdjustment} className="space-y-4 text-xs">
            <Input
              label="Revolving Credit Limit (₹) *"
              type="number"
              required
              min="10000"
              step="5000"
              value={newCreditLimit}
              onChange={(e) => setNewCreditLimit(e.target.value)}
            />
            <p className="text-[11px] text-neutral-500">
              Orders placed under Corporate Credit Line will draw against this limit, refreshing upon invoice reconciliation.
            </p>
          </form>
        </Modal>
      )}
    </div>
  );
}
