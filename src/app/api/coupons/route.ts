import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr, str, num } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

const CODE_RE = /^[A-Z0-9_-]{3,32}$/;

function parseDate(v: unknown, field: string): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new ApiError(400, "VALIDATION", `${field} is not a valid date.`);
  return d;
}

function checkDiscount(type: string, value: number) {
  if (type === "PERCENTAGE" && (value <= 0 || value > 100))
    throw new ApiError(400, "VALIDATION", "Percentage discount must be between 0 and 100.");
  if (type === "FIXED" && value <= 0)
    throw new ApiError(400, "VALIDATION", "Fixed discount must be greater than 0.");
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("coupons");
    const body = await readJson(req);

    const code = reqStr(body.code, "Coupon code", 32).toUpperCase();
    if (!CODE_RE.test(code))
      throw new ApiError(400, "VALIDATION", "Code must be 3-32 characters: letters, numbers, - or _.");

    const discountType = reqStr(body.discountType, "Discount type", 20);
    if (!["PERCENTAGE", "FIXED"].includes(discountType))
      throw new ApiError(400, "VALIDATION", "Discount type must be PERCENTAGE or FIXED.");
    const discountValue = num(body.discountValue, "Discount value", { min: 0 });
    checkDiscount(discountType, discountValue);

    const startDate = parseDate(body.startDate, "Start date") ?? null;
    const endDate = parseDate(body.endDate, "End date") ?? null;
    if (startDate && endDate && endDate < startDate)
      throw new ApiError(400, "VALIDATION", "End date must be after the start date.");

    const coupon = await prisma.coupon.create({
      data: {
        businessId: user.businessId,
        code,
        description: str(body.description) || null,
        discountType,
        discountValue,
        minOrderValue: body.minOrderValue === undefined ? 0 : num(body.minOrderValue, "Minimum order value", { min: 0 }),
        maxDiscount: body.maxDiscount === undefined || body.maxDiscount === null ? null : num(body.maxDiscount, "Maximum discount", { min: 0 }),
        usageLimit: body.usageLimit === undefined || body.usageLimit === null ? null : num(body.usageLimit, "Usage limit", { int: true, min: 1 }),
        startDate,
        endDate,
        isActive: body.isActive === undefined ? true : body.isActive === true,
      },
    });

    await writeAudit({ businessId: user.businessId, userId: user.id, action: "COUPON_CREATED", entity: "Coupon", entityId: coupon.id, details: { code } });
    return ok(coupon, 201);
  });
}

export async function PUT(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("coupons");
    const body = await readJson(req);
    const id = reqStr(body.id, "Coupon id", 64);

    const existing = await prisma.coupon.findFirst({ where: { id, businessId: user.businessId } });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Coupon not found.");

    const data: Record<string, unknown> = {};
    if (body.description !== undefined) data.description = str(body.description) || null;
    if (body.discountValue !== undefined) {
      const v = num(body.discountValue, "Discount value", { min: 0 });
      checkDiscount(existing.discountType, v);
      data.discountValue = v;
    }
    if (body.minOrderValue !== undefined) data.minOrderValue = num(body.minOrderValue, "Minimum order value", { min: 0 });
    if (body.maxDiscount !== undefined)
      data.maxDiscount = body.maxDiscount === null ? null : num(body.maxDiscount, "Maximum discount", { min: 0 });
    if (body.usageLimit !== undefined)
      data.usageLimit = body.usageLimit === null ? null : num(body.usageLimit, "Usage limit", { int: true, min: 1 });
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") throw new ApiError(400, "VALIDATION", "isActive must be true or false.");
      data.isActive = body.isActive;
    }
    if (typeof data.usageLimit === "number" && data.usageLimit < existing.timesUsed)
      throw new ApiError(400, "VALIDATION", `Usage limit cannot be below the ${existing.timesUsed} redemptions already made.`);

    const updated = await prisma.coupon.update({ where: { id }, data });
    await writeAudit({ businessId: user.businessId, userId: user.id, action: "COUPON_UPDATED", entity: "Coupon", entityId: id, details: data });
    return ok(updated);
  });
}

export async function DELETE(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("coupons");
    const id = reqStr(req.nextUrl.searchParams.get("id"), "Coupon id", 64);

    const existing = await prisma.coupon.findFirst({ where: { id, businessId: user.businessId } });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Coupon not found.");

    await prisma.coupon.delete({ where: { id } });
    await writeAudit({ businessId: user.businessId, userId: user.id, action: "COUPON_DELETED", entity: "Coupon", entityId: id, details: { code: existing.code } });
    return ok({ id });
  });
}
