import React from "react";
import { Metadata } from "next";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";
import { getProjectDashboardAction } from "@/app/actions/projects";
import { ClientPortal } from "@/features/project-management/components/client-portal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client Portal | NexyriumOS",
  description: "Download release deliverables, view invoice retainers, and request slide modifications.",
};

export default async function ClientPage() {
  const { user, profile } = await serverRequireRole(["CLIENT", "PROJECT_MANAGER", "CEO", "SUPER_ADMIN"]);

  const res = await getProjectDashboardAction();
  let projects = res.success && res.data ? res.data.projects : [];

  // Client role sees only their own assigned projects
  if (profile.roleName === "CLIENT") {
    projects = projects.filter(p => p.client_id === user.id);
  }

  return (
    <div className="bg-black min-h-screen">
      <ClientPortal
        initialProjects={projects}
        userEmail={user.email || ""}
      />
    </div>
  );
}
