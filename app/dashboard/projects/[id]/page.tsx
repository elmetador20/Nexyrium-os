import React from "react";
import { getProjectDetailsAction, getAllProfilesAction } from "@/app/actions/projects";
import { ProjectDetailsView } from "@/features/project-management/components/project-details-view";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectWorkspacePage({ params }: ProjectPageProps) {
  // Require active role authentication
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

  const { id } = await params;

  // Retrieve single workspace details
  const details = await getProjectDetailsAction(id);
  if (!details.success || !details.project) {
    throw new Error(details.error || "Project workspace not found.");
  }

  // Get all system profiles for assignees selectors
  const profilesRes = await getAllProfilesAction();
  const allUsers = profilesRes.success ? profilesRes.users : [];

  return (
    <ProjectDetailsView
      project={details.project}
      initialTasks={details.tasks || []}
      initialResearch={details.research}
      initialContent={details.content}
      initialDesign={details.design}
      initialQa={details.qa}
      initialDeliverables={details.deliverables || []}
      initialComments={details.comments || []}
      initialTimeline={details.timeline || []}
      userRole={profile.roleName || "CLIENT"}
      userId={user.id}
      allUsers={allUsers as any[]}
    />
  );
}
