import { prisma } from "@/lib/prismaDB";

/** Site-wide SEO settings from the database; null when none are stored. */
export async function getSeoSettings() {
  try {
    return await prisma.seoSetting.findFirst();
  } catch (err) {
    console.error("[seo-setting] could not load SEO settings:", err);
    return null;
  }
}

/** Display name: SEO setting, then the store name from Admin → Settings, then the environment. */
export async function getSiteName(): Promise<string> {
  try {
    const seo = await prisma.seoSetting.findFirst({ select: { siteName: true } });
    if (seo?.siteName) return seo.siteName;
    const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" }, select: { name: true } });
    if (business?.name) return business.name;
  } catch (err) {
    console.error("[seo-setting] could not load site name:", err);
  }
  return process.env.SITE_NAME || "Vanigam Commerce";
}

export async function getLogo(): Promise<string> {
  try {
    const header = await prisma.headerSetting.findFirst({ select: { headerLogo: true } });
    return header?.headerLogo || "/images/logo/logo.svg";
  } catch {
    return "/images/logo/logo.svg";
  }
}

export async function getEmailLogo(): Promise<string> {
  try {
    const header = await prisma.headerSetting.findFirst({ select: { emailLogo: true } });
    return header?.emailLogo || "/images/logo/logo.svg";
  } catch {
    return "/images/logo/logo.svg";
  }
}
