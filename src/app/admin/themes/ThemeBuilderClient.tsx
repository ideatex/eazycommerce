'use client';

import React, { useState } from 'react';
import { Palette, Check, RefreshCw, Eye } from 'lucide-react';
import { Button, Select, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

interface ThemeBuilderClientProps {
  initialTheme: any;
  presets: any[];
}

export function ThemeBuilderClient({ initialTheme, presets }: ThemeBuilderClientProps) {
  const [activePreset, setActivePreset] = useState(initialTheme?.presetName || 'minimal');
  const [primaryColor, setPrimaryColor] = useState(initialTheme?.primaryColor || '#0f172a');
  const [accentColor, setAccentColor] = useState(initialTheme?.accentColor || '#2563eb');
  const [borderRadius, setBorderRadius] = useState(initialTheme?.borderRadius || '0.375rem');
  const [fontFamily, setFontFamily] = useState(initialTheme?.fontFamily || 'Inter, system-ui, sans-serif');
  const [cardStyle, setCardStyle] = useState(initialTheme?.cardStyle || 'subtle_border');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const handleApplyPreset = (presetId: string) => {
    setActivePreset(presetId);
    if (presetId === 'minimal') {
      setPrimaryColor('#0f172a');
      setAccentColor('#2563eb');
      setBorderRadius('0.375rem');
    } else if (presetId === 'luxe') {
      setPrimaryColor('#18181b');
      setAccentColor('#c5a059');
      setBorderRadius('0.25rem');
    } else if (presetId === 'fashion') {
      setPrimaryColor('#000000');
      setAccentColor('#e11d48');
      setBorderRadius('0rem');
    } else if (presetId === 'tech') {
      setPrimaryColor('#020617');
      setAccentColor('#0284c7');
      setBorderRadius('0.5rem');
    } else if (presetId === 'grocery') {
      setPrimaryColor('#14532d');
      setAccentColor('#15803d');
      setBorderRadius('0.5rem');
    } else if (presetId === 'b2b') {
      setPrimaryColor('#1e293b');
      setAccentColor('#ea580c');
      setBorderRadius('0.25rem');
    }

    // Apply attribute live to document body for instant visual feedback
    document.body.setAttribute('data-theme', presetId);
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const res = await fetch('/api/themes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetName: activePreset,
          primaryColor,
          accentColor,
          borderRadius,
          fontFamily,
          cardStyle,
          businessSlug: 'vanigam',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess('Theme tokens successfully saved and active across all storefront pages!');
        document.body.setAttribute('data-theme', activePreset);
      } else {
        setSaveError(data.error?.message || 'Failed to save theme configuration');
      }
    } catch {
      setSaveError('Network error while saving theme configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl">
      {/* Configuration Controls */}
      <div className="lg:col-span-7 space-y-6">
        {/* Preset Cards */}
        <Card>
          <CardHeader className="pb-3 border-b border-neutral-100">
            <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-neutral-500" />
              <span>Presets</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((preset) => {
                const isSelected = activePreset === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`p-3.5 text-left rounded-sm border transition-all relative ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-50/80 ring-1 ring-neutral-900 shadow-subtle'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-neutral-900 block">{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-neutral-900" />}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">{preset.desc}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Granular Color & Geometry Adjustments */}
        <Card>
          <CardHeader className="pb-3 border-b border-neutral-100">
            <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Custom Tokens
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSaveTheme} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-medium text-neutral-700 block mb-1.5">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-sm border border-neutral-300 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 border border-neutral-300 rounded-sm font-mono uppercase focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-neutral-700 block mb-1.5">
                    Accent / Call-to-Action Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-9 h-9 rounded-sm border border-neutral-300 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 border border-neutral-300 rounded-sm font-mono uppercase focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <Select
                  label="Border Radius"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(e.target.value)}
                  options={[
                    { label: 'Sharp / No Radius (High Fashion, Editorial)', value: '0rem' },
                    { label: 'Subtle Rounded 4px (Clean Classic)', value: '0.25rem' },
                    { label: 'Modern Standard 6px (Minimalist)', value: '0.375rem' },
                    { label: 'Soft Rounded 8px (Modern Retail)', value: '0.5rem' },
                  ]}
                />

                <Select
                  label="Card Elevation & Borders"
                  value={cardStyle}
                  onChange={(e) => setCardStyle(e.target.value)}
                  options={[
                    { label: 'Subtle Border (Restrained, Calm)', value: 'subtle_border' },
                    { label: 'Soft Drop Shadow (Warm, Spacious)', value: 'elevated' },
                    { label: 'Flat Monolithic (Minimalist)', value: 'flat' },
                  ]}
                />
              </div>

              {saveSuccess && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-sm">
                  {saveSuccess}
                </div>
              )}

              {saveError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-sm">
                  {saveError}
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                >
                  Save Theme Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Live Interactive Preview */}
      <Card className="lg:col-span-5 sticky top-6">
        <CardHeader className="pb-3 border-b border-neutral-100 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-neutral-600" />
            <span>Live Preview</span>
          </CardTitle>
          <span className="text-[10px] font-mono text-neutral-400">Preset: {activePreset}</span>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Mock Product Card Preview using active tokens */}
          <div
            className="border p-4 space-y-3 transition-all bg-white"
            style={{
              borderColor: '#e2e8f0',
              borderRadius: borderRadius,
            }}
          >
            <div
              className="aspect-4/3 overflow-hidden bg-neutral-100 relative"
              style={{ borderRadius: borderRadius }}
            >
              <img
                src="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800"
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Living & Workspace</span>
              <h4 className="text-xs font-semibold text-neutral-900 mt-0.5">Oasis Ergonomic Walnut Desk</h4>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-sm font-semibold text-neutral-900">₹24,999</span>
                <span className="text-[11px] text-neutral-400 line-through">₹28,999</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full text-xs font-medium py-2 px-3 text-white transition-colors"
              style={{
                backgroundColor: primaryColor,
                borderRadius: borderRadius,
              }}
            >
              Add to Bag
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

