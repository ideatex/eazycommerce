import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { getDefaultBusiness } from "@/lib/business";
import { revalidateStorefront } from "@/lib/revalidate";
import { SECTION_TYPES } from "@/lib/storefrontSections";


export async function PUT(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("content");
    const body = await readJson(req);
    if (!Array.isArray(body.sections) || body.sections.length === 0 || body.sections.length > 50)
      throw new ApiError(400, "VALIDATION", "sections must be a non-empty list.");

    const businessId = user.businessId ?? (await getDefaultBusiness()).id;

    const rows = body.sections.map((raw: unknown, index: number) => {
      const s = (raw ?? {}) as Record<string, unknown>;
      if (typeof s.id !== "string" || !s.id) throw new ApiError(400, "VALIDATION", `Section ${index + 1} is missing an id.`);
      if (typeof s.sectionType !== "string" || !(SECTION_TYPES as readonly string[]).includes(s.sectionType))
        throw new ApiError(400, "VALIDATION", `Section ${index + 1} has an unknown type.`);
      if (typeof s.isActive !== "boolean") throw new ApiError(400, "VALIDATION", `Section ${index + 1}: isActive must be true or false.`);

      const configJson = typeof s.configJson === "string" ? s.configJson : "{}";
      try {
        const parsed = JSON.parse(configJson);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      } catch {
        throw new ApiError(400, "VALIDATION", `Section ${index + 1}: parameters must be a valid JSON object.`);
      }
      const title = typeof s.title === "string" ? s.title.trim().slice(0, 300) : "";
      const subtitle = typeof s.subtitle === "string" ? s.subtitle.trim().slice(0, 1000) : "";
      return { id: s.id, title: title || null, subtitle: subtitle || null, configJson, isActive: s.isActive, sortOrder: index };
    });

    const sections = await prisma.$transaction(async (tx) => {
      const owned = await tx.storefrontSection.findMany({
        where: { businessId, id: { in: rows.map((r: { id: string }) => r.id) } },
        select: { id: true },
      });
      if (owned.length !== rows.length) throw new ApiError(404, "NOT_FOUND", "One or more sections no longer exist. Reload the page.");

      for (const r of rows) {
        await tx.storefrontSection.update({
          where: { id: r.id },
          data: { title: r.title, subtitle: r.subtitle, configJson: r.configJson, isActive: r.isActive, sortOrder: r.sortOrder },
        });
      }
      return tx.storefrontSection.findMany({ where: { businessId }, orderBy: { sortOrder: "asc" } });
    });

    await writeAudit({ businessId, userId: user.id, action: "CONTENT_UPDATED", entity: "StorefrontSection", details: { count: rows.length } });
    revalidateStorefront();
    return ok({ sections });
  });
}
