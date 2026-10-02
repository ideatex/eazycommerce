import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prismaDB";
import { getDefaultBusiness } from "@/lib/business";
import { RBAC, type AdminPermission } from "@/lib/rbac";
import type { SessionUser } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

/**
 * Resolves the signed-in user from the NextAuth session cookie and re-reads the
 * account from the database, so deactivated users or changed roles take effect
 * immediately rather than when the JWT expires.
 */
export const AuthEngine = {
  async getSessionUserFromCookies(): Promise<SessionUser | null> {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch {
      return null;
    }
    const id = (session?.user as { id?: string } | undefined)?.id;
    if (!id) return null;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, name: true, role: true, isActive: true, businessId: true },
    });
    if (!user || !user.isActive || !user.email) return null;

    // Admin/staff accounts always belong to the store they manage.
    if (!user.businessId && RBAC.isAdminOrStaff(user.role)) {
      const business = await getDefaultBusiness();
      await prisma.user.update({ where: { id: user.id }, data: { businessId: business.id } });
      user.businessId = business.id;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || user.name || user.email,
      role: user.role,
      businessId: user.businessId,
    };
  },

  /** Guard for API route handlers: throws ApiError(401/403). */
  async requireAdmin(permission?: AdminPermission): Promise<SessionUser> {
    const user = await AuthEngine.getSessionUserFromCookies();
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Authentication required.");
    if (!RBAC.isAdminOrStaff(user.role)) {
      throw new ApiError(403, "FORBIDDEN", "Admin access required.");
    }
    if (permission && !RBAC.can(user.role, permission)) {
      throw new ApiError(403, "FORBIDDEN", `Your role cannot manage ${permission}.`);
    }
    return user;
  },

  async requireUser(): Promise<SessionUser> {
    const user = await AuthEngine.getSessionUserFromCookies();
    if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue.");
    return user;
  },
};
