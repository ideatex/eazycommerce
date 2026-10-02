import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, str } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { Roles } from "@/lib/types";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const admin = await AuthEngine.requireAdmin("customers");
    const { id } = await ctx.params;
    const body = await readJson(req);

    // Scoped to this store's customers only; admin/staff accounts are not editable here.
    const customer = await prisma.user.findFirst({
      where: { id, businessId: admin.businessId, role: { in: [Roles.CUSTOMER, Roles.B2B] } },
      select: { id: true },
    });
    if (!customer) throw new ApiError(404, "NOT_FOUND", "Customer not found.");

    if (body.isActive !== undefined && typeof body.isActive !== "boolean")
      throw new ApiError(400, "VALIDATION", "isActive must be true or false.");
    if (body.notes !== undefined && typeof body.notes !== "string")
      throw new ApiError(400, "VALIDATION", "notes must be text.");
    if (typeof body.notes === "string" && body.notes.length > 4000)
      throw new ApiError(400, "VALIDATION", "Notes are too long.");

    await prisma.$transaction(async (tx) => {
      if (typeof body.isActive === "boolean") {
        await tx.user.update({ where: { id }, data: { isActive: body.isActive as boolean } });
      }
      if (body.notes !== undefined) {
        const notes = str(body.notes) || null;
        await tx.customerProfile.upsert({
          where: { userId: id },
          create: { userId: id, notes },
          update: { notes },
        });
      }
    });

    await writeAudit({
      businessId: admin.businessId,
      userId: admin.id,
      action: "CUSTOMER_UPDATED",
      entity: "User",
      entityId: id,
      details: { isActive: body.isActive, notesUpdated: body.notes !== undefined },
    });
    return ok({ id });
  });
}
