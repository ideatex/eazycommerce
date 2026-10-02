import { prisma } from "@/lib/prismaDB";

/** Header branding. Falls back to the bundled logo when no custom header is stored. */
export async function getHeaderSettings() {
  try {
    const setting = await prisma.headerSetting.findFirst();
    return {
      id: setting?.id ?? 0,
      headerText: setting?.headerText ?? null,
      headerLogo: setting?.headerLogo || "/images/logo/logo.svg",
      emailLogo: setting?.emailLogo || "/images/logo/logo.svg",
      createdAt: setting?.createdAt ?? new Date(0),
      updatedAt: setting?.updatedAt ?? new Date(0),
    };
  } catch (err) {
    // Branding is cosmetic: render the page with the default logo rather than failing it.
    console.error("[header-setting] could not load header settings:", err);
    return null;
  }
}
