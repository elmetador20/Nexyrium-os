import React from "react";
import { Metadata } from "next";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";
import { getProjectDashboardAction } from "@/app/actions/projects";
import { FinanceDashboard } from "@/features/project-management/components/finance-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billing & Accounts | NexyriumOS",
  description: "Invoice history, payment collections, and earnings logs console.",
};

export default async function FinancePage() {
  const { profile } = await serverRequireRole(["FINANCE", "CEO", "SUPER_ADMIN"]);

  const res = await getProjectDashboardAction();
  const projects = res.success && res.data ? res.data.projects : [];

  return (
    <div className="bg-black min-h-screen">
      <FinanceDashboard
        initialProjects={projects}
        userRole={profile.roleName || "FINANCE"}
      />
    </div>
  );
}
