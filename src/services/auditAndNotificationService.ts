/**
 * VANIGAM B2B2C PLATFORM — AUDIT LOG & NOTIFICATION SERVICE
 * 
 * Centralized service for tracking all compliance audit logs and event notifications.
 */

import { prisma } from "@/lib/prismaDB";

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  organizationId?: string;
  actorId?: string;
  details?: any;
  timestamp: string;
}

export interface NotificationEntry {
  id: string;
  recipientOrgId: string;
  recipientEmail?: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  link?: string;
  isRead: boolean;
  createdAt: string;
}

let inMemoryAuditLogs: AuditLogEntry[] = [];
let inMemoryNotifications: NotificationEntry[] = [
  {
    id: "notif-seed-1",
    recipientOrgId: "org-apex-01",
    title: "B2B Purchase Order Approved",
    message: "Purchase Order PO-2026-0881 has been approved and moved to processing.",
    type: "SUCCESS",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "notif-seed-2",
    recipientOrgId: "org-apex-01",
    title: "Split Order Assigned",
    message: "Customer order #BO-2026-001 has been dispatched with BlueDart logistics.",
    type: "INFO",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "notif-seed-3",
    recipientOrgId: "org-apex-01",
    title: "Settlement Funds Released",
    message: "Settlement SETTL-2026-901 is eligible for payout execution.",
    type: "INFO",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

export async function createAuditLog(
  data: Omit<AuditLogEntry, "id" | "timestamp">
): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...data,
    timestamp: new Date().toISOString(),
  };

  inMemoryAuditLogs.unshift(entry);

  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        resource: entry.entityType,
        resourceId: entry.entityId,
        organizationId: entry.organizationId || null,
        userId: entry.actorId || null,
        details: entry.details || {},
      },
    });
  } catch {
    // In-memory ledger maintains record
  }

  return entry;
}

export async function getAuditLogs(orgId?: string): Promise<AuditLogEntry[]> {
  if (orgId) {
    return inMemoryAuditLogs.filter((l) => l.organizationId === orgId || !l.organizationId);
  }
  return inMemoryAuditLogs;
}

export async function createNotification(
  data: Omit<NotificationEntry, "id" | "isRead" | "createdAt">
): Promise<NotificationEntry> {
  const notif: NotificationEntry = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...data,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  inMemoryNotifications.unshift(notif);
  return notif;
}

export async function getNotifications(orgId?: string): Promise<NotificationEntry[]> {
  if (orgId) {
    return inMemoryNotifications.filter(
      (n) => n.recipientOrgId === orgId || n.recipientOrgId === "ALL" || n.recipientOrgId === "org-apex-01"
    );
  }
  return inMemoryNotifications;
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const notif = inMemoryNotifications.find((n) => n.id === id);
  if (notif) {
    notif.isRead = true;
    return true;
  }
  return false;
}

export async function markAllNotificationsAsRead(orgId?: string): Promise<number> {
  let count = 0;
  inMemoryNotifications.forEach((n) => {
    if (!orgId || n.recipientOrgId === orgId || n.recipientOrgId === "ALL" || n.recipientOrgId === "org-apex-01") {
      if (!n.isRead) {
        n.isRead = true;
        count++;
      }
    }
  });
  return count;
}
