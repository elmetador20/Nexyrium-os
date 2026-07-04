import React from "react";
import { getProjectDashboardAction, getAllProfilesAction } from "@/app/actions/projects";
import { ProjectsListView } from "@/features/project-management/components/projects-list-view";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";

export const dynamic = "force-dynamic";

export default async function ProjectsDashboardPage() {
  // Require an authenticated profile with one of the active operating roles
  const { user, profile } = await serverRequireRole([
    "SUPER_ADMIN", 
    "CEO", 
    "PROJECT_MANAGER", 
    "OPERATIONS_MANAGER", 
    "RESEARCHER", 
    "CONTENT_WRITER", 
    "DESIGNER", 
    "QA", 
    "CLIENT"
  ]);

  // Fetch all dashboard project list
  const statsRes = await getProjectDashboardAction();
  if (!statsRes.success || !statsRes.data) {
    throw new Error(statsRes.error || "Failed to load projects list.");
  }

  // Fetch all profiles for options assignees dropdown
  const profilesRes = await getAllProfilesAction();
  const allUsers = profilesRes.success ? profilesRes.users : [];

  return (
    <ProjectsListView
      initialProjects={statsRes.data.projects}
      userRole={profile.roleName || "CLIENT"}
      userId={user.id}
      allUsers={allUsers as any[]}
    />
  );
}
