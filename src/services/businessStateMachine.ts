/**
 * VANIGAM B2B2C PLATFORM — BUSINESS STATE MACHINE & TRANSITION ENGINE
 * 
 * Centralized authority for valid status lifecycles:
 * - B2B Purchase Orders (Procurement)
 * - Marketplace Business Orders (Fulfillment)
 * - Master Orders (Commerce)
 * - Escrow Settlements & Payouts (Finance)
 * 
 * Prevents illegal status jumps (e.g., REJECTED -> SHIPPED, DELIVERED -> CREATED).
 */

export type B2BOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PROCESSING"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "SHIPPED"
  | "DELIVERED"
  | "RECEIVED"
  | "CANCELLED";

export type BusinessOrderStatus =
  | "CREATED"
  | "CONFIRMED"
  | "PROCESSING"
  | "PARTIALLY_SHIPPED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type SettlementStatus =
  | "PENDING"
  | "ON_HOLD"
  | "ELIGIBLE"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REVERSED";

const B2B_ORDER_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["PENDING_APPROVAL", "APPROVED", "REJECTED", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PARTIALLY_FULFILLED", "FULFILLED", "SHIPPED"],
  PARTIALLY_FULFILLED: ["FULFILLED", "SHIPPED"],
  FULFILLED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RECEIVED"],
  RECEIVED: [], // Terminal normal receipt
  REJECTED: [], // Terminal rejection
  CANCELLED: [], // Terminal cancellation
};

const BUSINESS_ORDER_TRANSITIONS: Record<string, string[]> = {
  CREATED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PARTIALLY_SHIPPED", "SHIPPED", "CANCELLED"],
  PARTIALLY_SHIPPED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [], // Terminal cancellation
  RETURNED: [], // Terminal return
};

const SETTLEMENT_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ON_HOLD", "ELIGIBLE"],
  ON_HOLD: ["PENDING", "ELIGIBLE"],
  ELIGIBLE: ["PROCESSING"],
  PROCESSING: ["PAID", "FAILED"],
  PAID: ["REVERSED"], // Terminal disbursement (unless reversed for chargeback)
  FAILED: ["ELIGIBLE", "PROCESSING"],
  REVERSED: [],
};

export function validateStateTransition(
  entityType: "B2B_ORDER" | "BUSINESS_ORDER" | "SETTLEMENT",
  fromStatus: string,
  toStatus: string
): { valid: boolean; reason?: string } {
  // Same status is a no-op / valid
  if (fromStatus === toStatus) {
    return { valid: true };
  }

  let table: Record<string, string[]>;
  switch (entityType) {
    case "B2B_ORDER":
      table = B2B_ORDER_TRANSITIONS;
      break;
    case "BUSINESS_ORDER":
      table = BUSINESS_ORDER_TRANSITIONS;
      break;
    case "SETTLEMENT":
      table = SETTLEMENT_TRANSITIONS;
      break;
    default:
      return { valid: false, reason: `Unknown entity type: ${entityType}` };
  }

  const allowed = table[fromStatus] || [];
  if (allowed.includes(toStatus)) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Illegal status transition for ${entityType} from "${fromStatus}" to "${toStatus}". Allowed transitions: [${allowed.join(
      ", "
    ) || "None (Terminal State)"}].`,
  };
}

export function assertValidTransition(
  entityType: "B2B_ORDER" | "BUSINESS_ORDER" | "SETTLEMENT",
  fromStatus: string,
  toStatus: string
): void {
  const check = validateStateTransition(entityType, fromStatus, toStatus);
  if (!check.valid) {
    throw new Error(`BUSINESS_RULE_VIOLATION: ${check.reason}`);
  }
}
