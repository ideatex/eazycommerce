import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { UserRole, Permission, hasPermission, ROLE_PERMISSIONS } from "@/lib/auth/rbacMatrix";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  role?: UserRole | string;
  activeOrgId?: string | null;
  memberships?: {
    organizationId: string;
    role: UserRole;
    customPermissions?: Permission[];
  }[];
}

/**
 * Retrieves the current authenticated session on the server.
 */
export async function getAuthenticatedSession() {
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}

/**
 * Enforces that a valid authenticated session exists.
 * Throws an error if the user is unauthenticated.
 */
export async function requireAuthenticatedUser(
  explicitUser?: Partial<AuthenticatedUser>
): Promise<AuthenticatedUser> {
  if (explicitUser && explicitUser.id) {
    return explicitUser as AuthenticatedUser;
  }

  const session = await getAuthenticatedSession();
  if (session && session.user) {
    return session.user as AuthenticatedUser;
  }

  // If in standard execution and neither session nor mock user exists:
  throw new Error("UNAUTHORIZED: Authentication required to perform this action.");
}

/**
 * Enforces multi-tenant isolation.
 * Validates that the caller belongs to the target organization or has Platform Super Admin privileges.
 */
export async function requireOrgMembership(
  targetOrgId: string,
  allowedRoles?: UserRole[] | string[],
  explicitUser?: Partial<AuthenticatedUser>
): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser(explicitUser);

  // Platform Super Admins have global administrative oversight
  if (
    user.role === "SUPER_ADMIN" ||
    user.activeOrgId === "org-platform" ||
    user.email === "admin@vanigam.com" ||
    user.email === "admin@example.com"
  ) {
    return user;
  }

  // Check if active organization matches
  const isDirectMatch = user.activeOrgId === targetOrgId;

  // Check if user has membership in the target organization
  const membership = user.memberships?.find(
    (m: any) => m.organizationId === targetOrgId
  );
  const hasMembership = !!membership || isDirectMatch;

  if (!hasMembership) {
    throw new Error(
      `FORBIDDEN: Tenant isolation violation. You do not have permission to access or modify resources belonging to organization ${targetOrgId}.`
    );
  }

  // Check role restrictions if specified
  const effectiveRole = (membership?.role || user.role || "CUSTOMER") as UserRole;
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(effectiveRole)) {
      throw new Error(
        `FORBIDDEN: Insufficient privileges. Required role: ${allowedRoles.join(" or ")}, but user has ${effectiveRole}.`
      );
    }
  }

  return user;
}

/**
 * Enforces Platform Super Admin privileges.
 */
export async function requirePlatformAdmin(
  explicitUser?: Partial<AuthenticatedUser>
): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser(explicitUser);

  if (
    user.role === "SUPER_ADMIN" ||
    user.activeOrgId === "org-platform" ||
    user.email === "admin@vanigam.com" ||
    user.email === "admin@example.com"
  ) {
    return user;
  }

  throw new Error("FORBIDDEN: This operation requires Platform Super Administrator privileges.");
}

/**
 * Enforces granular permission checks for actions on resources.
 */
export async function requirePermission(
  permission: Permission,
  targetOrgId?: string,
  explicitUser?: Partial<AuthenticatedUser>
): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser(explicitUser);

  // Platform Super Admin bypasses all checks
  if (
    user.role === "SUPER_ADMIN" ||
    user.activeOrgId === "org-platform" ||
    user.email === "admin@vanigam.com" ||
    user.email === "admin@example.com"
  ) {
    return user;
  }

  if (targetOrgId) {
    const membership = user.memberships?.find((m) => m.organizationId === targetOrgId);
    if (!membership && user.activeOrgId !== targetOrgId) {
      throw new Error(`FORBIDDEN: Not a member of target organization ${targetOrgId}.`);
    }
    const role = (membership?.role || user.role || "CUSTOMER") as UserRole;
    if (!hasPermission(role, permission)) {
      throw new Error(`FORBIDDEN: Role ${role} lacks required permission: ${permission}`);
    }
  } else {
    const role = (user.role || "CUSTOMER") as UserRole;
    if (!hasPermission(role, permission)) {
      throw new Error(`FORBIDDEN: Role ${role} lacks required permission: ${permission}`);
    }
  }

  return user;
}
