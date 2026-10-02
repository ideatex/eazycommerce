import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Admin changes must show up on the public storefront without waiting for a
 * rebuild. Call after any mutation that affects catalogue, content or theme.
 */
export function revalidateStorefront() {
  try {
    revalidatePath("/", "layout");
    // Site-wide settings (store name, SEO, logos) are cached briefly; expire them immediately.
    revalidateTag("site-settings", { expire: 0 });
  } catch (err) {
    // revalidatePath throws outside a Next request scope (e.g. scripts/tests).
    console.warn("[revalidate] skipped:", (err as Error).message);
  }
}
