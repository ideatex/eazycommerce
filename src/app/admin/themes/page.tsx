import React from 'react';
import db from '@/lib/db';
import { requireAdminScope } from '@/lib/adminScope';
import { ThemeBuilderClient } from './ThemeBuilderClient';

export default async function AdminThemesPage() {
  const { businessId } = await requireAdminScope();
  const theme = await db.themeConfig.findFirst({
    where: { isActive: true, businessId },
  });

  const presets = [
    { id: 'minimal', name: 'Calm Minimal', desc: 'Monochromatic slate with royal accent, generous whitespace' },
    { id: 'luxe', name: 'Luxe Modern', desc: 'Deep warm stone with brushed gold accents' },
    { id: 'fashion', name: 'Clean Fashion', desc: 'High-contrast editorial aesthetics with rose accent' },
    { id: 'tech', name: 'Tech & Electronics', desc: 'Deep navy surface with precision cyan accent' },
    { id: 'grocery', name: 'Organic Grocery', desc: 'Forest emerald with fresh green highlights' },
    { id: 'b2b', name: 'Industrial B2B', desc: 'High-density utilitarian slate with industrial safety orange' },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-6 min-w-0 max-w-7xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Themes
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Select a theme preset or customize storefront design tokens.
        </p>
      </div>

      <ThemeBuilderClient initialTheme={theme} presets={presets} />
    </div>
  );
}
