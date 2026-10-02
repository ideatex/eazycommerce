import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, str } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { getDefaultBusiness } from "@/lib/business";
import { revalidateStorefront } from "@/lib/revalidate";

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const COMMERCE_MODES = ["B2C", "B2B", "HYBRID"];

const TEXT_FIELDS = [
  "name",
  "legalName",
  "state",
  "currency",
  "currencySymbol",
  "email",
  "phone",
  "address",
  "city",
  "postalCode",
] as const;

export async function PATCH(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("settings");
    const body = await readJson(req);
    const business = user.businessId
      ? await prisma.business.findUnique({ where: { id: user.businessId } })
      : await getDefaultBusiness();
    if (!business) throw new ApiError(404, "NOT_FOUND", "Business record not found.");

    const data: Record<string, string | null> = {};
    for (const key of TEXT_FIELDS) {
      if (body[key] === undefined) continue;
      const value = str(body[key]);
      if (value === undefined) throw new ApiError(400, "VALIDATION", `${key} must be text.`);
      if (value.length > 300) throw new ApiError(400, "VALIDATION", `${key} is too long.`);
      data[key] = value || null;
    }
    if (data.name === null) throw new ApiError(400, "VALIDATION", "Store name cannot be empty.");
    for (const required of ["state", "currency", "currencySymbol"] as const) {
      if (required in data && data[required] === null)
        throw new ApiError(400, "VALIDATION", `${required} cannot be empty.`);
    }
    if (typeof data.email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      throw new ApiError(400, "VALIDATION", "Enter a valid contact email.");
    if (typeof data.currency === "string" && !/^[A-Z]{3}$/.test(data.currency))
      throw new ApiError(400, "VALIDATION", "Currency must be a 3-letter ISO code such as INR.");

    if (body.gstin !== undefined) {
      const gstin = (str(body.gstin) || "").toUpperCase();
      if (gstin && !GSTIN_RE.test(gstin)) throw new ApiError(400, "VALIDATION", "GSTIN format is invalid.");
      data.gstin = gstin || null;
    }
    if (body.commerceMode !== undefined) {
      const mode = str(body.commerceMode) || "";
      if (!COMMERCE_MODES.includes(mode))
        throw new ApiError(400, "VALIDATION", "Commerce mode must be B2C, B2B or HYBRID.");
      data.commerceMode = mode;
    }

    const updated = await prisma.business.update({ where: { id: business.id }, data });
    await writeAudit({ businessId: business.id, userId: user.id, action: "SETTINGS_UPDATED", entity: "Business", entityId: business.id, details: data });
    revalidateStorefront();
    return ok(updated);
  });
}
