import React from "react";
import { Metadata } from "next";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";
import { CeoDashboard } from "@/features/project-management/components/ceo-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CEO Executive Insights | NexyriumOS",
  description: "Enterprise ARR analytics, deals win rate, and client pipeline size metrics.",
};

export default async function CeoPage() {
  const { profile } = await serverRequireRole(["CEO", "SUPER_ADMIN"]);

  return (
    <div className="bg-black min-h-screen">
      <CeoDashboard />
    </div>
  );
}
