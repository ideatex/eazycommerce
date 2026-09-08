import { prisma } from "@/lib/prismaDB";
import { unstable_cache } from "next/cache";

// get all header settings
export const getHeaderSettings = unstable_cache(
  async () => {
    try {
      const { getCmsHeaderSettings } = await import("@/services/cmsService");
      return await getCmsHeaderSettings();
    } catch {
      return null;
    }
  },
  ['header-setting'], { tags: ['header-setting'] }
);
