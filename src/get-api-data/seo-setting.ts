import { prisma } from "@/lib/prismaDB";
import { cachedSetting } from "@/lib/cachedQuery";

/** Site-wide SEO settings from the database; null when none are stored or the database is unreachable. */
export const getSeoSettings = cachedSetting("seo-setting", () => prisma.seoSetting.findFirst(), null);

const loadSiteName = cachedSetting<string | null>(
  "site-name",
  async () => {
    const seo = await prisma.seoSetting.findFirst({ select: { siteName: true } });
    if (seo?.siteName) return seo.siteName;
    const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" }, select: { name: true } });
    return business?.name ?? null;
  },
  null
);

/** Display name: SEO setting, then the store name from Admin → Settings, then the environment. */
export async function getSiteName(): Promise<string> {
  return (await loadSiteName()) || process.env.SITE_NAME || "Vanigam Commerce";
}

const loadHeaderLogos = cachedSetting<{ headerLogo: string | null; emailLogo: string | null }>(
  "header-logos",
  async () => (await prisma.headerSetting.findFirst({ select: { headerLogo: true, emailLogo: true } })) ?? { headerLogo: null, emailLogo: null },
  { headerLogo: null, emailLogo: null }
);

export async function getLogo(): Promise<string> {
  return (await loadHeaderLogos()).headerLogo || "/images/logo/logo.svg";
}

export async function getEmailLogo(): Promise<string> {
  return (await loadHeaderLogos()).emailLogo || "/images/logo/logo.svg";
}
