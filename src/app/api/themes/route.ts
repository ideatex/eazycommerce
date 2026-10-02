import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { getDefaultBusiness } from "@/lib/business";
import { revalidateStorefront } from "@/lib/revalidate";

const THEME_PRESETS = ["minimal", "luxe", "fashion", "tech", "grocery", "b2b"];
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const RADIUS_RE = /^[0-9]{1,2}(\.[0-9]{1,3})?(rem|px)$/;
// Font stacks are written into CSS, so only plain family names and commas are accepted.
const FONT_RE = /^[A-Za-z0-9 ,'"-]{1,120}$/;
const CARD_STYLES = ["subtle_border", "elevated", "flat", "outlined"];

export async function PUT(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("themes");
    const body = await readJson(req);

    const presetName = reqStr(body.presetName, "Preset", 40);
    if (!THEME_PRESETS.includes(presetName)) throw new ApiError(400, "VALIDATION", "Unknown theme preset.");
    const primaryColor = reqStr(body.primaryColor, "Primary colour", 9);
    const accentColor = reqStr(body.accentColor, "Accent colour", 9);
    if (!COLOR_RE.test(primaryColor) || !COLOR_RE.test(accentColor))
      throw new ApiError(400, "VALIDATION", "Colours must be hex values like #0f172a.");
    const borderRadius = reqStr(body.borderRadius, "Border radius", 12);
    if (!RADIUS_RE.test(borderRadius)) throw new ApiError(400, "VALIDATION", "Border radius must look like 0.5rem or 4px.");
    const fontFamily = reqStr(body.fontFamily, "Font family", 120);
    if (!FONT_RE.test(fontFamily)) throw new ApiError(400, "VALIDATION", "Font family contains unsupported characters.");
    const cardStyle = reqStr(body.cardStyle, "Card style", 40);
    if (!CARD_STYLES.includes(cardStyle)) throw new ApiError(400, "VALIDATION", "Unknown card style.");

    // The store is taken from the signed-in admin, never from the request body.
    const businessId = user.businessId ?? (await getDefaultBusiness()).id;

    const theme = await prisma.$transaction(async (tx) => {
      await tx.themeConfig.updateMany({ where: { businessId, isActive: true }, data: { isActive: false } });
      return tx.themeConfig.create({
        data: { businessId, presetName, primaryColor, accentColor, borderRadius, fontFamily, cardStyle, isActive: true },
      });
    });

    await writeAudit({ businessId, userId: user.id, action: "THEME_UPDATED", entity: "ThemeConfig", entityId: theme.id, details: { presetName } });
    revalidateStorefront();
    return ok(theme);
  });
}
