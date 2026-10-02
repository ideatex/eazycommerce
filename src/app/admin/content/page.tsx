import React from 'react';
import db from '@/lib/db';
import { requireAdminScope } from '@/lib/adminScope';
import { ContentAdminClient } from './ContentAdminClient';
import { buildDefaultSections } from '@/lib/storefrontSections';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const { businessId } = await requireAdminScope();
  const business = await db.business.findUnique({ where: { id: businessId } });

  let sections: any[] = [];
  if (business) {
    sections = await db.storefrontSection.findMany({
      where: { businessId: business.id },
      orderBy: { sortOrder: 'asc' },
    });

    // Seed the default layout, and add any section type this store has never had
    // (e.g. types introduced after the store was created). Existing sections are untouched.
    const have = new Set(sections.map((s) => s.sectionType));
    const missing = buildDefaultSections().filter((d) => !have.has(d.sectionType));
    if (missing.length > 0) {
      const base = sections.length;
      for (const [i, def] of missing.entries()) {
        await db.storefrontSection.create({
          data: { businessId: business.id, ...def, sortOrder: base + i },
        });
      }
      sections = await db.storefrontSection.findMany({
        where: { businessId: business.id },
        orderBy: { sortOrder: 'asc' },
      });
    }
  }

  return <ContentAdminClient initialSections={sections} />;
}
