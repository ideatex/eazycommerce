import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr, num } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { Roles } from "@/lib/types";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"];

export async function PATCH(req: NextRequest) {
  return handle(async () => {
    const admin = await AuthEngine.requireAdmin("b2b");
    const body = await readJson(req);
    const id = reqStr(body.b2bProfileId, "B2B profile id", 64);

    const profile = await prisma.b2BProfile.findFirst({
      where: { id, user: { businessId: admin.businessId } },
    });
    if (!profile) throw new ApiError(404, "NOT_FOUND", "B2B account not found.");

    const data: { status?: string; creditLimit?: number; availableCredit?: number; paymentTermsDays?: number } = {};
    if (body.status !== undefined) {
      const status = reqStr(body.status, "Status", 20);
      if (!STATUSES.includes(status)) throw new ApiError(400, "VALIDATION", "Unknown B2B status.");
      data.status = status;
    }
    if (body.creditLimit !== undefined) {
      const limit = num(body.creditLimit, "Credit limit", { min: 0, max: 1_000_000_000 });
      // Credit already drawn stays drawn: availableCredit is re-derived, never trusted from the client.
      const used = Math.max(0, profile.creditLimit - profile.availableCredit);
      if (limit < used) {
        throw new ApiError(409, "BELOW_USED", `₹${used} of credit is currently in use; the limit cannot be lower.`);
      }
      data.creditLimit = limit;
      data.availableCredit = limit - used;
    }
    if (body.paymentTermsDays !== undefined) data.paymentTermsDays = num(body.paymentTermsDays, "Payment terms", { int: true, min: 0, max: 180 });
    if (Object.keys(data).length === 0) throw new ApiError(400, "VALIDATION", "Nothing to update.");

    await prisma.$transaction(async (tx) => {
      await tx.b2BProfile.update({ where: { id }, data });
      if (data.status) {
        await tx.user.update({
          where: { id: profile.userId },
          data: { role: data.status === "APPROVED" ? Roles.B2B : Roles.CUSTOMER },
        });
      }
    });

    await writeAudit({ businessId: admin.businessId, userId: admin.id, action: "B2B_UPDATED", entity: "B2BProfile", entityId: id, details: data });
    return ok({ id, ...data });
  });
}
