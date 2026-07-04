import React from "react";
import { Metadata } from "next";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";
import { getProjectDashboardAction, getAllProfilesAction } from "@/app/actions/projects";
import { TasksView } from "@/features/project-management/components/tasks-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tasks Board | NexyriumOS",
  description: "Organize and prioritize detailed operational checklists across all departments.",
};

export default async function TasksPage() {
  const { profile } = await serverRequireRole([
    "PROJECT_MANAGER", 
    "CEO", 
    "SUPER_ADMIN", 
    "RESEARCHER", 
    "CONTENT_WRITER", 
    "DESIGNER", 
    "QA", 
    "FINANCE"
  ]);

  const res = await getProjectDashboardAction();
  const projects = res.success && res.data ? res.data.projects : [];
  const tasks = res.success && res.data ? res.data.tasks : [];

  const profilesRes = await getAllProfilesAction();
  const allUsers = profilesRes.success ? profilesRes.users : [];

  return (
    <div className="bg-black min-h-screen">
      <TasksView
        initialTasks={tasks}
        initialProjects={projects}
        allUsers={allUsers}
        userRole={profile.roleName || "DESIGNER"}
      />
    </div>
  );
}
