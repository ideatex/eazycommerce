/**
 * VANIGAM B2B2C PLATFORM — RBAC & DYNAMIC MODULE MATRIX
 * 
 * Core architectural module separating:
 * 1. Organization Type (PLATFORM, MANUFACTURER, SUPPLIER, DISTRIBUTOR, SELLER, RETAILER)
 * 2. User Role (SUPER_ADMIN, ORG_OWNER, ORG_ADMIN, INVENTORY_MANAGER, SALES_MANAGER, FINANCE_MANAGER, CUSTOMER)
 * 3. Granular Action Permissions
 * 4. Dynamic Module Availability
 */

export type UserRole =
  | "SUPER_ADMIN"
  | "ORG_OWNER"
  | "ORG_ADMIN"
  | "INVENTORY_MANAGER"
  | "SALES_MANAGER"
  | "FINANCE_MANAGER"
  | "CUSTOMER";

export type Permission =
  | "dashboard.view"
  | "governance.view"
  | "governance.manage"
  | "b2b_orders.view"
  | "b2b_orders.create"
  | "b2b_orders.approve"
  | "orders.view"
  | "orders.manage"
  | "orders.returns"
  | "catalog.view"
  | "catalog.manage"
  | "content.view"
  | "content.manage"
  | "finance.view"
  | "commissions.manage"
  | "payouts.execute"
  | "team.view"
  | "team.manage"
  | "settings.manage";

export interface ModuleDefinition {
  key: string;
  label: string;
  href: string;
  iconName: string;
  requiredPermission: Permission;
  allowedOrgTypes: string[];
  description: string;
}

/**
 * Standard Role-to-Permissions definitions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "dashboard.view",
    "governance.view",
    "governance.manage",
    "b2b_orders.view",
    "b2b_orders.create",
    "b2b_orders.approve",
    "orders.view",
    "orders.manage",
    "orders.returns",
    "catalog.view",
    "catalog.manage",
    "content.view",
    "content.manage",
    "finance.view",
    "commissions.manage",
    "payouts.execute",
    "team.view",
    "team.manage",
    "settings.manage",
  ],
  ORG_OWNER: [
    "dashboard.view",
    "b2b_orders.view",
    "b2b_orders.create",
    "b2b_orders.approve",
    "orders.view",
    "orders.manage",
    "orders.returns",
    "catalog.view",
    "catalog.manage",
    "content.view",
    "content.manage",
    "finance.view",
    "team.view",
    "team.manage",
    "settings.manage",
  ],
  ORG_ADMIN: [
    "dashboard.view",
    "b2b_orders.view",
    "b2b_orders.create",
    "b2b_orders.approve",
    "orders.view",
    "orders.manage",
    "orders.returns",
    "catalog.view",
    "catalog.manage",
    "content.view",
    "content.manage",
    "finance.view",
    "team.view",
    "settings.manage",
  ],
  INVENTORY_MANAGER: [
    "dashboard.view",
    "catalog.view",
    "catalog.manage",
    "b2b_orders.view",
    "orders.view",
  ],
  SALES_MANAGER: [
    "dashboard.view",
    "catalog.view",
    "content.view",
    "b2b_orders.view",
    "b2b_orders.create",
    "orders.view",
    "orders.manage",
    "orders.returns",
  ],
  FINANCE_MANAGER: [
    "dashboard.view",
    "finance.view",
    "orders.view",
    "b2b_orders.view",
  ],
  CUSTOMER: [
    "dashboard.view",
  ],
};

/**
 * Registered Business Workspace Modules with Organization and Permission requirements
 */
export const WORKSPACE_MODULES: ModuleDefinition[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin",
    iconName: "dashboard",
    requiredPermission: "dashboard.view",
    allowedOrgTypes: ["PLATFORM", "MANUFACTURER", "SUPPLIER", "DISTRIBUTOR", "WHOLESALER", "DEALER", "RETAILER", "SELLER"],
    description: "Operational control tower and performance metrics",
  },
  {
    key: "governance",
    label: "Business Governance",
    href: "/admin/businesses",
    iconName: "governance",
    requiredPermission: "governance.view",
    allowedOrgTypes: ["PLATFORM"], // STRICTLY PLATFORM SUPER ADMIN ONLY
    description: "Enterprise KYC, registration verification, and network topology",
  },
  {
    key: "b2b_orders",
    label: "B2B Purchase Orders",
    href: "/admin/b2b-orders",
    iconName: "b2b_orders",
    requiredPermission: "b2b_orders.view",
    allowedOrgTypes: ["PLATFORM", "MANUFACTURER", "SUPPLIER", "DISTRIBUTOR", "WHOLESALER", "DEALER", "SELLER"],
    description: "Wholesale procurement, credit terms, and supply-chain PO routing",
  },
  {
    key: "orders",
    label: "Customer & Split Orders",
    href: "/admin/orders",
    iconName: "orders",
    requiredPermission: "orders.view",
    allowedOrgTypes: ["PLATFORM", "DISTRIBUTOR", "RETAILER", "SELLER"],
    description: "Unified consumer orders and automated multi-seller basket decompositions",
  },
  {
    key: "catalog",
    label: "Master Catalog & Offers",
    href: "/admin/catalog",
    iconName: "catalog",
    requiredPermission: "catalog.view",
    allowedOrgTypes: ["PLATFORM", "MANUFACTURER", "SUPPLIER", "DISTRIBUTOR", "WHOLESALER", "DEALER", "RETAILER", "SELLER"],
    description: "Master catalog management, SKUs, and commercial seller offers",
  },
  {
    key: "cms",
    label: "Storefront CMS & Content",
    href: "/admin/cms",
    iconName: "cms",
    requiredPermission: "content.view",
    allowedOrgTypes: ["PLATFORM", "MANUFACTURER", "SUPPLIER", "DISTRIBUTOR", "WHOLESALER", "DEALER", "RETAILER", "SELLER"],
    description: "Manage hero banners, carousel sliders, promotional countdowns, header announcements, blog posts, and SEO",
  },
  {
    key: "finance",
    label: "Commissions & Payouts",
    href: "/admin/finance",
    iconName: "finance",
    requiredPermission: "finance.view",
    allowedOrgTypes: ["PLATFORM", "MANUFACTURER", "SUPPLIER", "DISTRIBUTOR", "RETAILER", "SELLER"],
    description: "Take-rate commission policies, seller settlements, and escrow disbursements",
  },
];

/**
 * Checks if a specific role possesses a permission
 */
export function hasPermission(role: UserRole, permission: Permission, orgType?: string): boolean {
  if (role === "SUPER_ADMIN" || orgType === "PLATFORM") {
    return true;
  }
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

/**
 * Evaluates whether a user with a given role in a given organization type can access a module
 */
export function canAccessModule(
  orgType: string,
  role: UserRole,
  moduleKey: string,
  customPermissions?: Permission[]
): boolean {
  const mod = WORKSPACE_MODULES.find((m) => m.key === moduleKey);
  if (!mod) return false;

  // 1. Organization Type check
  if (!mod.allowedOrgTypes.includes(orgType)) {
    return false;
  }

  // 2. Permission check
  const activePermissions = customPermissions || ROLE_PERMISSIONS[role] || [];
  if (role === "SUPER_ADMIN" || orgType === "PLATFORM") {
    return true;
  }

  return activePermissions.includes(mod.requiredPermission);
}

/**
 * Returns all accessible module definitions for an organization context
 */
export function getAccessibleModules(
  orgType: string,
  role: UserRole,
  customPermissions?: Permission[]
): ModuleDefinition[] {
  return WORKSPACE_MODULES.filter((mod) =>
    canAccessModule(orgType, role, mod.key, customPermissions)
  );
}
