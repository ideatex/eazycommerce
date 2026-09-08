import { prisma } from "@/lib/prismaDB";
import {
  initialOrganizations,
  initialRelationships,
  VanigamOrganization,
  VanigamRelationship,
} from "@/lib/b2b2c/mockVanigamData";
import { createAuditLog, createNotification } from "@/services/auditAndNotificationService";

let inMemoryOrgs: VanigamOrganization[] = [...initialOrganizations];
let inMemoryRelationships: VanigamRelationship[] = [...initialRelationships];

export async function getOrganizations(): Promise<VanigamOrganization[]> {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
    });
    if (orgs && orgs.length > 0) {
      const existingIds = new Set(orgs.map((o) => o.id));
      const extra = inMemoryOrgs.filter((o) => !existingIds.has(o.id));
      return [...(orgs as any), ...extra];
    }
    return inMemoryOrgs;
  } catch {
    return inMemoryOrgs;
  }
}

export async function getOrganizationBySlug(slug: string): Promise<VanigamOrganization | null> {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug },
    });
    if (org) return org as any;
    return inMemoryOrgs.find((o) => o.slug === slug) || null;
  } catch {
    return inMemoryOrgs.find((o) => o.slug === slug) || null;
  }
}

export async function getOrganizationById(id: string): Promise<VanigamOrganization | null> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id },
    });
    if (org) return org as any;
    return inMemoryOrgs.find((o) => o.id === id) || null;
  } catch {
    return inMemoryOrgs.find((o) => o.id === id) || null;
  }
}

export async function createOrganization(data: Partial<VanigamOrganization>): Promise<VanigamOrganization> {
  const newOrg: VanigamOrganization = {
    id: data.id || `org-${Date.now()}`,
    name: data.name || "New Business",
    slug: data.slug || `org-${Date.now()}`,
    legalName: data.legalName || data.name || "Business Entity",
    organizationType: data.organizationType || "SELLER",
    status: data.status || "ACTIVE",
    email: data.email || "",
    phone: data.phone || "",
    website: data.website || "",
    taxIdentificationNumber: data.taxIdentificationNumber || "",
    registrationNumber: data.registrationNumber || "",
    logo: data.logo || "/images/sellers/seller-01.png",
    description: data.description || "",
    currency: data.currency || "USD",
    country: data.country || "US",
    city: data.city || "",
    state: data.state || "",
    createdAt: new Date().toISOString().split("T")[0],
  };

  // Unconditionally add to inMemoryOrgs so it reflects in the platform immediately
  inMemoryOrgs = [newOrg, ...inMemoryOrgs.filter((o) => o.id !== newOrg.id)];

  try {
    await createAuditLog({
      action: "ORGANIZATION_REGISTERED",
      entityType: "Organization",
      entityId: newOrg.id,
      organizationId: newOrg.id,
      details: {
        name: newOrg.name,
        organizationType: newOrg.organizationType,
        taxIdentificationNumber: newOrg.taxIdentificationNumber,
      },
    });

    await createNotification({
      recipientOrgId: "org-platform",
      title: "New Enterprise Registered",
      message: `${newOrg.name} has successfully onboarded as a ${newOrg.organizationType}.`,
      type: "SUCCESS",
      link: "/admin/businesses",
    });
  } catch {
    // quiet
  }

  try {
    const created = await prisma.organization.create({
      data: {
        name: newOrg.name,
        slug: newOrg.slug,
        legalName: newOrg.legalName,
        organizationType: newOrg.organizationType as any,
        status: newOrg.status as any,
        email: newOrg.email,
        phone: newOrg.phone,
        website: newOrg.website,
        taxIdentificationNumber: newOrg.taxIdentificationNumber,
        registrationNumber: newOrg.registrationNumber,
        logo: newOrg.logo,
        description: newOrg.description,
        currency: newOrg.currency,
        country: newOrg.country,
        city: newOrg.city,
        state: newOrg.state,
      },
    });
    return (created as any) || newOrg;
  } catch {
    return newOrg;
  }
}

export async function updateOrganizationStatus(
  id: string,
  status: VanigamOrganization["status"]
): Promise<VanigamOrganization | null> {
  try {
    const updated = await prisma.organization.update({
      where: { id },
      data: { status: status as any },
    });
    return updated as any;
  } catch {
    const idx = inMemoryOrgs.findIndex((o) => o.id === id);
    if (idx !== -1) {
      inMemoryOrgs[idx].status = status;
      return inMemoryOrgs[idx];
    }
    return null;
  }
}

export async function getRelationships(orgId?: string): Promise<VanigamRelationship[]> {
  try {
    const relations = await prisma.organizationRelationship.findMany({
      where: orgId
        ? {
            OR: [{ sourceOrganizationId: orgId }, { targetOrganizationId: orgId }],
          }
        : undefined,
      include: {
        sourceOrganization: true,
        targetOrganization: true,
      },
    });

    if (relations && relations.length > 0) {
      return relations.map((r) => ({
        id: r.id,
        sourceOrgId: r.sourceOrganizationId,
        sourceOrgName: r.sourceOrganization.name,
        targetOrgId: r.targetOrganizationId,
        targetOrgName: r.targetOrganization.name,
        relationshipType: r.relationshipType as any,
        status: r.status as any,
        creditLimit: (r.metadata as any)?.creditLimit || 50000,
        paymentTerms: (r.metadata as any)?.paymentTerms || "Net 30 Days",
        startedAt: r.startedAt.toISOString().split("T")[0],
      }));
    }
    return orgId
      ? inMemoryRelationships.filter((r) => r.sourceOrgId === orgId || r.targetOrgId === orgId)
      : inMemoryRelationships;
  } catch {
    return orgId
      ? inMemoryRelationships.filter((r) => r.sourceOrgId === orgId || r.targetOrgId === orgId)
      : inMemoryRelationships;
  }
}

export async function createRelationship(
  sourceOrgId: string,
  targetOrgId: string,
  type: VanigamRelationship["relationshipType"],
  creditLimit: number = 50000,
  paymentTerms: string = "Net 30 Days"
): Promise<VanigamRelationship> {
  const source = inMemoryOrgs.find((o) => o.id === sourceOrgId);
  const target = inMemoryOrgs.find((o) => o.id === targetOrgId);

  const newRel: VanigamRelationship = {
    id: `rel-${Date.now()}`,
    sourceOrgId,
    sourceOrgName: source?.name || "Source Org",
    targetOrgId,
    targetOrgName: target?.name || "Target Org",
    relationshipType: type,
    status: "ACTIVE",
    creditLimit,
    paymentTerms,
    startedAt: new Date().toISOString().split("T")[0],
  };

  try {
    const created = await prisma.organizationRelationship.create({
      data: {
        sourceOrganizationId: sourceOrgId,
        targetOrganizationId: targetOrgId,
        relationshipType: type as any,
        status: "ACTIVE",
        metadata: { creditLimit, paymentTerms },
      },
      include: {
        sourceOrganization: true,
        targetOrganization: true,
      },
    });
    return {
      id: created.id,
      sourceOrgId: created.sourceOrganizationId,
      sourceOrgName: created.sourceOrganization.name,
      targetOrgId: created.targetOrganizationId,
      targetOrgName: created.targetOrganization.name,
      relationshipType: created.relationshipType as any,
      status: created.status as any,
      creditLimit,
      paymentTerms,
      startedAt: created.startedAt.toISOString().split("T")[0],
    };
  } catch {
    inMemoryRelationships.unshift(newRel);
    return newRel;
  }
}
