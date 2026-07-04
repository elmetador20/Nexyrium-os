import React from "react";
import { Metadata } from "next";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";
import { getProjectDashboardAction } from "@/app/actions/projects";
import { ContentDashboard } from "@/features/project-management/components/content-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Content Writer Desk | NexyriumOS",
  description: "Pitch deck narrative and slide copywriting console.",
};

export default async function ContentPage() {
  const { profile } = await serverRequireRole(["CONTENT_WRITER", "PROJECT_MANAGER", "CEO", "SUPER_ADMIN"]);

  const res = await getProjectDashboardAction();
  const projects = res.success && res.data ? res.data.projects : [];

  return (
    <div className="bg-black min-h-screen">
      <ContentDashboard
        initialProjects={projects}
        allContent={{}}
        userRole={profile.roleName || "CONTENT_WRITER"}
      />
    </div>
  );
}
