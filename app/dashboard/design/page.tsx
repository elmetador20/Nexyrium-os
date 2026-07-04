import React from "react";
import { Metadata } from "next";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";
import { getProjectDashboardAction, getAllDesignRecordsAction } from "@/app/actions/projects";
import { DesignDashboard } from "@/features/project-management/components/design-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Design Studio | NexyriumOS",
  description: "Canva design assets and presentation releases workspace.",
};

export default async function DesignPage() {
  const { profile } = await serverRequireRole(["DESIGNER", "PROJECT_MANAGER", "CEO", "SUPER_ADMIN"]);

  const res = await getProjectDashboardAction();
  const designRes = await getAllDesignRecordsAction();
  
  const projects = res.success && res.data ? res.data.projects : [];
  const allDesign = designRes.success ? designRes.records : {};

  return (
    <div className="bg-black min-h-screen">
      <DesignDashboard
        initialProjects={projects}
        allDesign={allDesign}
        userRole={profile.roleName || "DESIGNER"}
      />
    </div>
  );
}
