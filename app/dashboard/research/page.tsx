import React from "react";
import { Metadata } from "next";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";
import { getProjectDashboardAction } from "@/app/actions/projects";
import { ResearchDashboard } from "@/features/project-management/components/research-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research Desk | NexyriumOS",
  description: "Market intelligence and sector database console.",
};

export default async function ResearchPage() {
  const { profile } = await serverRequireRole(["RESEARCHER", "PROJECT_MANAGER", "CEO", "SUPER_ADMIN"]);

  const res = await getProjectDashboardAction();
  const projects = res.success && res.data ? res.data.projects : [];

  return (
    <div className="bg-black min-h-screen">
      <ResearchDashboard
        initialProjects={projects}
        allResearch={{}}
        userRole={profile.roleName || "RESEARCHER"}
      />
    </div>
  );
}
