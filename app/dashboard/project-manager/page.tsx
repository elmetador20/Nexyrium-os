import React from "react";
import { getProjectDashboardAction, getAllProfilesAction } from "@/app/actions/projects";
import { DashboardView } from "@/features/project-management/components/dashboard-view";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";

export const dynamic = "force-dynamic";

export default async function ProjectManagerPage() {
  // Enforce role authorization: Only PROJECT_MANAGER is allowed
  const { user, profile } = await serverRequireRole(["PROJECT_MANAGER"]);

  // Fetch unified dashboard statistics & workload metrics
  const statsRes = await getProjectDashboardAction();
  if (!statsRes.success || !statsRes.data) {
    throw new Error(statsRes.error || "Failed to load dashboard metrics.");
  }

  // Fetch all users list to populate client/team selection lists
  const profilesRes = await getAllProfilesAction();
  const allUsers = profilesRes.success ? profilesRes.users : [];

  return (
    <div className="bg-black min-h-screen">
      <DashboardView
        initialData={statsRes.data}
        userRole={profile.roleName || "PROJECT_MANAGER"}
        userId={user.id}
        allUsers={allUsers as any[]}
        allRoles={[]}
      />
    </div>
  );
}
