import React from "react";
import { Metadata } from "next";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";
import { ReportsView } from "@/features/project-management/components/reports-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations Reports & Analytics | NexyriumOS",
  description: "Monitor execution speeds, checklist completion rates, and workload load metrics.",
};

export default async function ReportsPage() {
  const { profile } = await serverRequireRole(["PROJECT_MANAGER", "CEO", "SUPER_ADMIN"]);

  return (
    <div className="bg-black min-h-screen">
      <ReportsView />
    </div>
  );
}
