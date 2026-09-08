import { prisma } from "@/lib/prismaDB";
import {
  initialCommissionRules,
  initialSettlements,
  VanigamCommissionRule,
  VanigamSettlement,
} from "@/lib/b2b2c/mockVanigamData";
import { assertValidTransition } from "@/services/businessStateMachine";
import { createAuditLog, createNotification } from "@/services/auditAndNotificationService";

let inMemoryRules: VanigamCommissionRule[] = [...initialCommissionRules];
let inMemorySettlements: VanigamSettlement[] = [...initialSettlements];

export async function getCommissionRules(): Promise<VanigamCommissionRule[]> {
  try {
    const rules = await prisma.commissionRule.findMany({
      orderBy: { priority: "asc" },
      include: { organization: true },
    });
    if (rules && rules.length > 0) {
      return rules.map((r) => ({
        id: r.id,
        name: r.name,
        organizationId: r.organizationId,
        organizationName: r.organization?.name || "Global Default",
        type: r.type as any,
        percentageRate: Number(r.percentageRate),
        fixedFee: Number(r.fixedFee),
        category: r.categorySlug || "All",
        isActive: r.isActive,
      }));
    }
    return inMemoryRules;
  } catch {
    return inMemoryRules;
  }
}

export async function createCommissionRule(data: Partial<VanigamCommissionRule>): Promise<VanigamCommissionRule> {
  const newRule: VanigamCommissionRule = {
    id: `comm-${Date.now()}`,
    name: data.name || "Custom Commission Rule",
    organizationId: data.organizationId || null,
    organizationName: data.organizationName || "Global Default",
    type: data.type || "PERCENTAGE",
    percentageRate: data.percentageRate !== undefined ? data.percentageRate : 8.0,
    fixedFee: data.fixedFee !== undefined ? data.fixedFee : 0,
    category: data.category || "All",
    isActive: true,
  };

  inMemoryRules.unshift(newRule);

  await createAuditLog({
    action: "COMMISSION_RULE_CREATED",
    entityType: "CommissionRule",
    entityId: newRule.id,
    details: { name: newRule.name, rate: newRule.percentageRate, type: newRule.type },
  });

  return newRule;
}

export async function getSettlements(orgId?: string): Promise<VanigamSettlement[]> {
  try {
    const settlements = await prisma.settlement.findMany({
      where: orgId ? { organizationId: orgId } : undefined,
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    });
    if (settlements && settlements.length > 0) {
      return settlements.map((s) => ({
        id: s.id,
        settlementNo: s.settlementNo,
        organizationId: s.organizationId,
        organizationName: s.organization.name,
        grossSales: Number(s.grossSales),
        commissionFee: Number(s.commissionFee),
        netPayout: Number(s.netPayout),
        status: s.status as any,
        period: "Recent Billing Cycle",
        payoutDate: s.payoutDate ? s.payoutDate.toISOString().split("T")[0] : null,
      }));
    }
    return orgId ? inMemorySettlements.filter((s) => s.organizationId === orgId) : inMemorySettlements;
  } catch {
    return orgId ? inMemorySettlements.filter((s) => s.organizationId === orgId) : inMemorySettlements;
  }
}

/**
 * FLOW 19 & 21 — REFUND SETTLEMENT DEDUCTION:
 * Deducts approved customer refund amounts from the seller's active settlement balance.
 */
export async function processReturnRefundDeduction(
  sellerOrgId: string,
  refundAmount: number,
  businessOrderNo?: string
): Promise<VanigamSettlement | null> {
  let settlement = inMemorySettlements.find(
    (s) => s.organizationId === sellerOrgId && (s.status === "PENDING" || s.status === "ELIGIBLE")
  );

  if (!settlement) {
    settlement = {
      id: `set-${Date.now()}`,
      settlementNo: `SET-2026-${Math.floor(100 + Math.random() * 900)}`,
      organizationId: sellerOrgId,
      organizationName: "Authorized Seller",
      grossSales: 0,
      commissionFee: 0,
      netPayout: -refundAmount,
      status: "PENDING",
      period: "Current Billing Cycle",
      payoutDate: null,
    };
    inMemorySettlements.unshift(settlement);
  } else {
    settlement.netPayout = Number((settlement.netPayout - refundAmount).toFixed(2));
  }

  await createAuditLog({
    action: "SETTLEMENT_REFUND_DEDUCTED",
    entityType: "Settlement",
    entityId: settlement.id,
    organizationId: sellerOrgId,
    details: {
      refundAmount,
      updatedNetPayout: settlement.netPayout,
      businessOrderNo,
    },
  });

  await createNotification({
    recipientOrgId: sellerOrgId,
    title: "Refund Deducted from Settlement",
    message: `A refund of $${refundAmount} for order ${businessOrderNo || ""} was approved and deducted from settlement ${settlement.settlementNo}.`,
    type: "WARNING",
    link: "/admin/finance",
  });

  return settlement;
}

/**
 * FLOW 22 — PAYOUT EXECUTION:
 * Disburses eligible escrow settlement funds and prevents duplicate payouts.
 */
export async function processPayout(settlementId: string): Promise<VanigamSettlement | null> {
  const idx = inMemorySettlements.findIndex((s) => s.id === settlementId);
  if (idx !== -1) {
    const settlement = inMemorySettlements[idx];

    // Idempotency: Reject duplicate payout if already paid
    if (settlement.status === "PAID") {
      throw new Error(
        `DUPLICATE_PAYOUT_REJECTED: Settlement ${settlement.settlementNo} has already been disbursed on ${settlement.payoutDate}.`
      );
    }

    assertValidTransition("SETTLEMENT", settlement.status, "PAID");

    settlement.status = "PAID";
    settlement.payoutDate = new Date().toISOString().split("T")[0];

    await createAuditLog({
      action: "SETTLEMENT_PAYOUT_DISBURSED",
      entityType: "Settlement",
      entityId: settlement.id,
      organizationId: settlement.organizationId,
      details: {
        settlementNo: settlement.settlementNo,
        payoutAmount: settlement.netPayout,
        payoutDate: settlement.payoutDate,
      },
    });

    await createNotification({
      recipientOrgId: settlement.organizationId,
      title: `Payout Disbursed: $${settlement.netPayout}`,
      message: `Escrow settlement ${settlement.settlementNo} has been successfully transferred to your linked bank account.`,
      type: "SUCCESS",
      link: "/admin/finance",
    });

    try {
      await prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: "PAID",
          payoutDate: new Date(),
        },
      });
    } catch {
      // Graceful fallback
    }

    return settlement;
  }
  return null;
}
