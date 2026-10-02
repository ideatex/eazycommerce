'use client';

import React, { useState } from 'react';
import { Sliders, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

interface SettingsClientProps {
  business: any;
}

export function SettingsClient({ business }: SettingsClientProps) {
  const [formData, setFormData] = useState({
    name: business.name || '',
    legalName: business.legalName || '',
    gstin: business.gstin || '',
    state: business.state || 'Tamil Nadu',
    currency: business.currency || 'INR',
    currencySymbol: business.currencySymbol || '₹',
    commerceMode: business.commerceMode || 'HYBRID',
    email: business.email || '',
    phone: business.phone || '',
    address: business.address || '',
    city: business.city || '',
    postalCode: business.postalCode || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess('Business settings and tax parameters updated successfully.');
      } else {
        setSaveError(data.error?.message || 'Failed to update settings');
      }
    } catch {
      setSaveError('Network error while updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {/* Commerce Mode Selector */}
      <Card>
        <CardHeader className="pb-3 border-b border-neutral-100">
          <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-neutral-500" />
            <span>Commerce Operating Mode</span>
          </CardTitle>
          <p className="text-xs text-neutral-500 mt-0.5">
            Select the operational architecture configured for this storefront.
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {[
              { id: 'B2C', title: 'Retail (D2C)', desc: 'Single-brand store for consumers' },
              { id: 'B2B', title: 'B2B Wholesale', desc: 'Bulk tiers & credit terms' },
              { id: 'HYBRID', title: 'Retail + Wholesale', desc: 'Consumers and B2B buyers' },
            ].map((mode) => {
              const isSelected = formData.commerceMode === mode.id;

              return (
                <label
                  key={mode.id}
                  className={`p-3.5 rounded-sm border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-50/80 ring-1 ring-neutral-900 font-medium shadow-subtle'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-neutral-900">{mode.title}</span>
                    <input
                      type="radio"
                      name="commerceMode"
                      value={mode.id}
                      checked={isSelected}
                      onChange={handleInputChange}
                      className="accent-neutral-900 h-3.5 w-3.5"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-500 font-normal">{mode.desc}</span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tax & Legal */}
      <Card>
        <CardHeader className="pb-3 border-b border-neutral-100">
          <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Tax & Legal Parameters</span>
          </CardTitle>
          <p className="text-xs text-neutral-500 mt-0.5">
            Operating origin state is used to compute intra-state (CGST + SGST) vs inter-state (IGST).
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Operating State"
              name="state"
              required
              value={formData.state}
              onChange={handleInputChange}
            />

            <Input
              label="Supplier GSTIN (optional)"
              name="gstin"
              value={formData.gstin}
              onChange={handleInputChange}
              className="uppercase font-mono"
            />

            <Input
              label="Store Brand Name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
            />

            <Input
              label="Legal Registered Entity Name"
              name="legalName"
              value={formData.legalName}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact details shown in the storefront footer and on invoices */}
      <Card>
        <CardHeader className="pb-3 border-b border-neutral-100">
          <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Store Contact Details</span>
          </CardTitle>
          <p className="text-xs text-neutral-500 mt-0.5">
            Shown in the public storefront footer and on tax invoices. Leave a field empty to hide it.
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact Email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            <Input label="Contact Phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
            <div className="sm:col-span-2">
              <Input label="Street Address" name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <Input label="City" name="city" value={formData.city} onChange={handleInputChange} />
            <Input label="PIN Code" name="postalCode" value={formData.postalCode} onChange={handleInputChange} />
          </div>
        </CardContent>
      </Card>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <div>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSaving}
        >
          Save Configuration
        </Button>
      </div>
    </form>
  );
}

