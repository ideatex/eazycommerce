import { Roles } from "@/lib/types";

export type AdminPermission =
  | "products"
  | "categories"
  | "inventory"
  | "orders"
  | "customers"
  | "reviews"
  | "coupons"
  | "content"
  | "b2b"
  | "settings"
  | "themes"
  | "audit";

const ADMIN_ROLES: string[] = [Roles.SUPER_ADMIN, Roles.ADMIN];
const STAFF_PERMISSIONS: AdminPermission[] = [
  "products",
  "categories",
  "inventory",
  "orders",
  "customers",
  "reviews",
  "coupons",
  "content",
];

export const RBAC = {
  /** Anyone allowed inside the admin panel shell. */
  isAdminOrStaff(role?: string | null): boolean {
    return !!role && (ADMIN_ROLES.includes(role) || role === Roles.STAFF);
  },

  isAdmin(role?: string | null): boolean {
    return !!role && ADMIN_ROLES.includes(role);
  },

  /** Staff get day-to-day operations; settings, themes and B2B credit are admin-only. */
  can(role: string | null | undefined, permission: AdminPermission): boolean {
    if (!role) return false;
    if (ADMIN_ROLES.includes(role)) return true;
    return role === Roles.STAFF && STAFF_PERMISSIONS.includes(permission);
  },
};
