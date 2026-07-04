import React from "react";
import { Metadata } from "next";
import { serverRequireRole } from "@/features/project-management/utils/server-guard";
import { getProjectDashboardAction } from "@/app/actions/projects";
import { CalendarView } from "@/features/project-management/components/calendar-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule Calendar | NexyriumOS",
  description: "Monitor target startup delivery dates and operational milestones.",
};

export default async function CalendarPage() {
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

  return (
    <div className="bg-black min-h-screen">
      <CalendarView
        projects={projects}
        tasks={tasks}
      />
    </div>
  );
}
