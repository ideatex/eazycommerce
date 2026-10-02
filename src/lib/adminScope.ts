import { redirect } from "next/navigation";
import { AuthEngine } from "@/lib/auth";
import { RBAC } from "@/lib/rbac";

/**
 * Resolves the signed-in admin and the business their data is scoped to.
 * Every admin page query must filter by this businessId; the layout guard alone
 * does not stop one tenant's admin from reading another tenant's rows.
 */
export async function requireAdminScope() {
  const user = await AuthEngine.getSessionUserFromCookies();
  if (!user || !RBAC.isAdminOrStaff(user.role) || !user.businessId) {
    redirect("/signin?callbackUrl=/admin");
  }
  return { user, businessId: user.businessId as string };
}
