export type Permission =
  | "view:dashboard"
  | "manage:users"
  | "manage:roles"
  | "manage:settings"
  | "view:analytics"
  | "view:logs"
  | "approve:users"
  | "manage:projects"
  | "manage:clients";

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    "view:dashboard",
    "manage:users",
    "manage:roles",
    "manage:settings",
    "view:analytics",
    "view:logs",
    "approve:users",
    "manage:projects",
    "manage:clients",
  ],
  CEO: [
    "view:dashboard",
    "manage:users",
    "view:analytics",
    "view:logs",
    "approve:users",
    "manage:projects",
    "manage:clients",
  ],
  OPERATIONS_MANAGER: [
    "view:dashboard",
    "manage:users",
    "approve:users",
    "manage:projects",
    "manage:clients",
  ],
  PROJECT_MANAGER: ["view:dashboard", "manage:projects"],
  CLIENT: ["view:dashboard"],
};

/**
 * Checks if a specific role has permission to perform an action.
 */
export function hasPermission(roleName: string | null | undefined, permission: Permission): boolean {
  if (!roleName) return false;
  
  // Super Admin always has full access
  if (roleName === "SUPER_ADMIN") return true;

  const permissions = ROLE_PERMISSIONS[roleName];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Checks if a role has any of the specified permissions.
 */
export function hasAnyPermission(roleName: string | null | undefined, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(roleName, permission));
}
