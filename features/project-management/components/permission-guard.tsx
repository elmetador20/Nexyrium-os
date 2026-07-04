"use client";

import React, { createContext, useContext } from "react";

interface PermissionContextType {
  role: string;
  userId: string;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({
  role,
  userId,
  children
}: {
  role: string;
  userId: string;
  children: React.ReactNode;
}) {
  return (
    <PermissionContext.Provider value={{ role, userId }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return ctx;
}

export function PermissionGuard({
  allowedRoles,
  fallback = null,
  children
}: {
  allowedRoles: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { role } = usePermissions();
  if (!allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
