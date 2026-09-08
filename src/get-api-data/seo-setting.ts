import { prisma } from "@/lib/prismaDB";
import { unstable_cache } from "next/cache";

// get all seo settings
export const getSeoSettings = unstable_cache(
  async () => {
    try {
      const { getCmsSeoSettings } = await import("@/services/cmsService");
      return await getCmsSeoSettings();
    } catch {
      return null;
    }
  },
  ['seo-setting'], { tags: ['seo-setting'] }
);

export const getSiteName = unstable_cache(
  async () => {
    try {
      const { getCmsSeoSettings } = await import("@/services/cmsService");
      const seo = await getCmsSeoSettings();
      return seo.siteName || process.env.SITE_NAME || "Vanigam Commerce";
    } catch {
      return process.env.SITE_NAME ? process.env.SITE_NAME : "Vanigam Commerce";
    }
  },
  ['site-name'], { tags: ['site-name'] }
);

// get logo 
export const getLogo = unstable_cache(
  async () => {
    try {
      const { getCmsHeaderSettings } = await import("@/services/cmsService");
      const header = await getCmsHeaderSettings();
      return header.headerLogo || "/images/logo/logo.svg";
    } catch {
      return "/images/logo/logo.svg";
    }
  },
  ['header-logo'], { tags: ['header-logo'] }
);

// get email logo
export const getEmailLogo = unstable_cache(
  async () => {
    try {
      const { getCmsHeaderSettings } = await import("@/services/cmsService");
      const header = await getCmsHeaderSettings();
      return header.emailLogo || "/images/logo/logo.svg";
    } catch {
      return "/images/logo/logo.svg";
    }
  },
  ['email-logo'], { tags: ['email-logo'] }
);
