'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  Check,
  ExternalLink,
  Edit2,
  LayoutTemplate,
  ShoppingBag,
  Grid,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';
import { Button, Input, Textarea, Badge, Modal } from '@/components/ui';

interface StorefrontSectionItem {
  id: string;
  sectionType: string;
  title: string | null;
  subtitle: string | null;
  configJson: string;
  sortOrder: number;
  isActive: boolean;
}

interface ContentAdminClientProps {
  initialSections: StorefrontSectionItem[];
}

export function ContentAdminClient({ initialSections }: ContentAdminClientProps) {
  const [sections, setSections] = useState<StorefrontSectionItem[]>(initialSections);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editingSection, setEditingSection] = useState<StorefrontSectionItem | null>(null);

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'HERO':
        return LayoutTemplate;
      case 'FEATURED_CATEGORIES':
        return Grid;
      case 'FEATURED_PRODUCTS':
        return ShoppingBag;
      case 'PROMO_BANNER':
        return Megaphone;
      case 'VALUE_PROPOSITIONS':
        return ShieldCheck;
      case 'PROMO_TILES':
        return Grid;
      case 'DEAL_BANNER':
        return Megaphone;
      case 'CUSTOMER_REVIEWS':
        return ShieldCheck;
      default:
        return Layers;
    }
  };

  const getSectionTypeLabel = (type: string) => {
    switch (type) {
      case 'HERO':
        return 'Storefront Hero Banner';
      case 'FEATURED_CATEGORIES':
        return 'Curated Categories Grid';
      case 'FEATURED_PRODUCTS':
        return 'Featured Products Showcase';
      case 'PROMO_BANNER':
        return 'Promotional Banner & Wholesale Notice';
      case 'VALUE_PROPOSITIONS':
        return 'Quality & Service Guarantees';
      case 'PROMO_TILES':
        return 'Featured Collection Tiles';
      case 'DEAL_BANNER':
        return 'Limited-Time Deal Countdown';
      case 'CUSTOMER_REVIEWS':
        return 'Customer Reviews';
      default:
        return type;
    }
  };

  const handleToggleActive = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Recalculate sortOrder
    const reordered = newSections.map((s, idx) => ({ ...s, sortOrder: idx }));
    setSections(reordered);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const res = await fetch('/api/cms/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });

      const data = await res.json();
      if (data.success) {
        setSections(data.data.sections);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(data.error?.message || 'Failed to save sections');
      }
    } catch {
      setSaveError('Network error while saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    setSections((prev) =>
      prev.map((s) => (s.id === editingSection.id ? editingSection : s))
    );
    setEditingSection(null);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-neutral-800" />
            <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
              Storefront CMS & Layout
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Configure, reorder, and toggle active sections on the primary storefront homepage.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            href="/"
            target="_blank"
          >
            <span>Live Store</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 text-neutral-400" />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAll}
            isLoading={isSaving}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1" />
                <span>Save Layout</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm">
          {saveError}
        </div>
      )}

      {/* Sections List */}
      <div className="mt-6 space-y-3">
        {sections.map((sec, idx) => {
          const Icon = getSectionIcon(sec.sectionType);
          return (
            <div
              key={sec.id}
              className={`border rounded-sm p-4 bg-white transition-all shadow-subtle ${
                sec.isActive ? 'border-neutral-200/90' : 'border-neutral-200/50 bg-neutral-50/40 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-sm bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-600 shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-900">
                        {getSectionTypeLabel(sec.sectionType)}
                      </span>
                      <Badge variant={sec.isActive ? 'success' : 'neutral'}>
                        {sec.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>

                    <p className="text-xs text-neutral-700 font-medium mt-1">
                      {sec.title || 'Untitled Section'}
                    </p>
                    {sec.subtitle && (
                      <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                        {sec.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Section Controls */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleActive(sec.id)}
                    className="p-1.5 text-neutral-500 hover:text-neutral-800 rounded-sm border border-neutral-200 hover:bg-neutral-50 transition-colors"
                    title={sec.isActive ? 'Disable section' : 'Enable section'}
                    aria-label={sec.isActive ? 'Disable section' : 'Enable section'}
                  >
                    {sec.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                  </button>

                  <button
                    onClick={() => setEditingSection(sec)}
                    className="p-1.5 text-neutral-500 hover:text-neutral-800 rounded-sm border border-neutral-200 hover:bg-neutral-50 transition-colors"
                    title="Edit content"
                    aria-label="Edit content"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center border border-neutral-200 rounded-sm divide-x divide-neutral-200">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-neutral-500 hover:text-neutral-800 disabled:opacity-30 hover:bg-neutral-50 transition-colors"
                      title="Move section up"
                      aria-label="Move section up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="p-1.5 text-neutral-500 hover:text-neutral-800 disabled:opacity-30 hover:bg-neutral-50 transition-colors"
                      title="Move section down"
                      aria-label="Move section down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Section Modal */}
      {editingSection && (
        <Modal
          isOpen={!!editingSection}
          onClose={() => setEditingSection(null)}
          title={`Edit ${getSectionTypeLabel(editingSection.sectionType)}`}
          description="Update section headline, supporting copy, and parameters."
          size="md"
        >
          <form onSubmit={handleSaveModal} className="space-y-4">
            <Input
              label="Section Title"
              value={editingSection.title || ''}
              onChange={(e) =>
                setEditingSection({ ...editingSection, title: e.target.value })
              }
              placeholder="e.g. Selected Products"
            />

            <Textarea
              label="Subtitle / Descriptor"
              rows={2}
              value={editingSection.subtitle || ''}
              onChange={(e) =>
                setEditingSection({ ...editingSection, subtitle: e.target.value })
              }
              placeholder="Supporting descriptive line"
            />

            <div>
              <Textarea
                label="Configuration (JSON)"
                rows={4}
                value={editingSection.configJson}
                onChange={(e) =>
                  setEditingSection({ ...editingSection, configJson: e.target.value })
                }
                className="font-mono text-[11px]"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Adjust section parameters like limits, tags, URLs, or banner text.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingSection(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Update In-Memory
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

