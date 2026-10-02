import { prisma } from "@/lib/prismaDB";
import { cachedSetting } from "@/lib/cachedQuery";

/** Header branding. Falls back to the bundled logo when no custom header is stored or the database is unreachable. */
export const getHeaderSettings = cachedSetting(
  "header-setting",
  async () => {
    const setting = await prisma.headerSetting.findFirst();
    return {
      id: setting?.id ?? 0,
      headerText: setting?.headerText ?? null,
      headerLogo: setting?.headerLogo || "/images/logo/logo.svg",
      emailLogo: setting?.emailLogo || "/images/logo/logo.svg",
      createdAt: setting?.createdAt ?? new Date(0),
      updatedAt: setting?.updatedAt ?? new Date(0),
    };
  },
  null
);
