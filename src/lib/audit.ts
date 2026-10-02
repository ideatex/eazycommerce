import { prisma } from "@/lib/prismaDB";

/** Writes an audit entry. Never throws: auditing must not break the operation being audited. */
export async function writeAudit(entry: {
  businessId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        businessId: entry.businessId ?? null,
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        detailsJson: entry.details === undefined ? null : JSON.stringify(entry.details),
      },
    });
  } catch (err) {
    console.error("[audit] failed to write entry", err);
  }
}
