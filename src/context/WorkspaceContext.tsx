"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { initialOrganizations, VanigamOrganization } from "@/lib/b2b2c/mockVanigamData";
import { actionGetOrganizations } from "@/actions/vanigamActions";
import {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  WORKSPACE_MODULES,
  ModuleDefinition,
  hasPermission as checkPermission,
  canAccessModule,
  getAccessibleModules,
} from "@/lib/auth/rbacMatrix";

export interface WorkspaceMembership {
  organizationId: string;
  role: UserRole;
  customPermissions?: Permission[];
}

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  memberships: WorkspaceMembership[];
}

export const defaultDemoUser: WorkspaceUser = {
  id: "usr-master-admin",
  name: "Alexander Vance",
  email: "alexander@vanigam.com",
  memberships: [
    { organizationId: "org-platform", role: "SUPER_ADMIN" },
    { organizationId: "org-mfg-techflow", role: "INVENTORY_MANAGER" },
    { organizationId: "org-dist-globallink", role: "SALES_MANAGER" },
    { organizationId: "org-seller-velocity", role: "FINANCE_MANAGER" },
  ],
};

interface WorkspaceContextType {
  currentUser: WorkspaceUser;
  currentWorkspace: VanigamOrganization;
  allWorkspaces: VanigamOrganization[];
  currentRole: UserRole;
  currentPermissions: Permission[];
  accessibleModules: ModuleDefinition[];
  switchWorkspace: (orgId: string) => void;
  switchRole: (role: UserRole) => void;
  refreshWorkspaces: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  canAccess: (moduleKey: string) => boolean;
  isPlatformAdmin: boolean;
  isSupplier: boolean;
  isDistributor: boolean;
  isSeller: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentUser] = useState<WorkspaceUser>(defaultDemoUser);
  const [workspaces, setWorkspaces] = useState<VanigamOrganization[]>(initialOrganizations);
  const [currentWorkspace, setCurrentWorkspace] = useState<VanigamOrganization>(initialOrganizations[0]);
  const [overrideRole, setOverrideRole] = useState<UserRole | null>(null);

  const refreshWorkspaces = useCallback(async () => {
    try {
      const orgs = await actionGetOrganizations();
      if (orgs && orgs.length > 0) {
        setWorkspaces(orgs);
        // If currentWorkspace needs refreshing with updated fields
        const updatedCurrent = orgs.find((w) => w.id === currentWorkspace.id);
        if (updatedCurrent) {
          setCurrentWorkspace(updatedCurrent);
        }
      }
    } catch {
      // quiet fallback
    }
  }, [currentWorkspace.id]);

  // Initial load
  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  // Load active workspace from localStorage
  useEffect(() => {
    const savedOrgId = localStorage.getItem("vanigam_active_workspace_id");
    if (savedOrgId) {
      const found = workspaces.find((w) => w.id === savedOrgId);
      if (found) setCurrentWorkspace(found);
    }
  }, [workspaces]);

  // Determine role based on user's membership in the active workspace
  const currentRole: UserRole = useMemo(() => {
    if (overrideRole) return overrideRole;
    const membership = currentUser.memberships.find(
      (m) => m.organizationId === currentWorkspace.id
    );
    if (membership) return membership.role;
    if (currentWorkspace.organizationType === "PLATFORM") return "SUPER_ADMIN";
    return "ORG_OWNER";
  }, [currentUser, currentWorkspace, overrideRole]);

  // Derive permissions for current role and org
  const currentPermissions = useMemo(() => {
    return ROLE_PERMISSIONS[currentRole] || [];
  }, [currentRole]);

  // Derive accessible modules dynamically
  const accessibleModules = useMemo(() => {
    return getAccessibleModules(currentWorkspace.organizationType, currentRole, currentPermissions);
  }, [currentWorkspace.organizationType, currentRole, currentPermissions]);

  const switchWorkspace = (orgId: string) => {
    const found = workspaces.find((w) => w.id === orgId);
    if (found) {
      setCurrentWorkspace(found);
      setOverrideRole(null); // Reset any temporary role override when switching orgs
      localStorage.setItem("vanigam_active_workspace_id", orgId);
    }
  };

  const switchRole = (role: UserRole) => {
    setOverrideRole(role);
  };

  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(currentRole, permission, currentWorkspace.organizationType);
  };

  const canAccess = (moduleKey: string): boolean => {
    return canAccessModule(currentWorkspace.organizationType, currentRole, moduleKey, currentPermissions);
  };

  const isPlatformAdmin = currentWorkspace.organizationType === "PLATFORM" && currentRole === "SUPER_ADMIN";
  const isSupplier = currentWorkspace.organizationType === "SUPPLIER" || currentWorkspace.organizationType === "MANUFACTURER";
  const isDistributor = currentWorkspace.organizationType === "DISTRIBUTOR" || currentWorkspace.organizationType === "WHOLESALER";
  const isSeller = currentWorkspace.organizationType === "SELLER" || currentWorkspace.organizationType === "RETAILER";

  return (
    <WorkspaceContext.Provider
      value={{
        currentUser,
        currentWorkspace,
        allWorkspaces: workspaces,
        currentRole,
        currentPermissions,
        accessibleModules,
        switchWorkspace,
        switchRole,
        refreshWorkspaces,
        hasPermission,
        canAccess,
        isPlatformAdmin,
        isSupplier,
        isDistributor,
        isSeller,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
