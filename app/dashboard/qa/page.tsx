import React from "react";
import { Metadata } from "next";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";
import { getProjectDashboardAction, getAllQARecordsAction, getAllDesignRecordsAction } from "@/app/actions/projects";
import { QADashboard } from "@/features/project-management/components/qa-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quality Assurance Desk | NexyriumOS",
  description: "Checklist audit, narrative approval, and release console.",
};

export default async function QAPage() {
  const { profile } = await serverRequireRole(["QA", "PROJECT_MANAGER", "CEO", "SUPER_ADMIN"]);

  const res = await getProjectDashboardAction();
  const qaRes = await getAllQARecordsAction();
  const designRes = await getAllDesignRecordsAction();

  const projects = res.success && res.data ? res.data.projects : [];
  const allQA = qaRes.success ? qaRes.records : {};
  const allDesign = designRes.success ? designRes.records : {};

  return (
    <div className="bg-black min-h-screen">
      <QADashboard
        initialProjects={projects}
        allQA={allQA}
        allDesign={allDesign}
        userRole={profile.roleName || "QA"}
      />
    </div>
  );
}
