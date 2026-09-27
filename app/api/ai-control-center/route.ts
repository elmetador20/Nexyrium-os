import { NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";
import { getOperationsHealth } from "@/lib/ai-agent/operations-intelligence";
import { getEmployeeWorkloadAction, getProjectDashboardAction } from "@/app/actions/projects";
import { getDailyAutomationSummary } from "@/lib/automation/automation-service";
import { isMissingAutomationTable } from "@/lib/server/reliability";

const ROLES = ["SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER", "PROJECT_MANAGER"];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = await getUserProfile(supabase, user.id);
    if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!ROLES.includes(profile.roleName || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [dashboard, workload, automation, pending, history, activity] = await Promise.all([
      getProjectDashboardAction(), getEmployeeWorkloadAction(),
      supabase.from("automation_events").select("*").order("last_detected_at", { ascending: false }).limit(50),
      supabase.from("ai_agent_actions").select("action_id,action_type,payload,status,task_id,expires_at,created_at,executed_at,failure_reason").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("automation_events").select("*").order("updated_at", { ascending: false }).limit(50),
      supabase.from("activity_logs").select("id,action,details,user_email,created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    const errors: Record<string, string> = {};
    if (!dashboard.success || !dashboard.data) errors.health = dashboard.error || "Unable to load operational health.";
    if (!workload.success) errors.health = errors.health || workload.error || "Unable to load workload.";
    const automationMigrationRequired = isMissingAutomationTable(automation.error) || isMissingAutomationTable(history.error);
    if (automationMigrationRequired) errors.automation = "Automation persistence unavailable — database migration required.";
    else if (automation.error) errors.automation = "Unable to load automation events.";
    if (pending.error) errors.actions = "Unable to load action proposals.";
    if (history.error) errors.history = "Unable to load automation history.";
    if (activity.error) errors.activity = "Unable to load recent activity.";
    const health = dashboard.data && workload.success ? getOperationsHealth({ projects: dashboard.data.projects, tasks: dashboard.data.tasks, workloads: workload.workloads }) : null;
    const now = Date.now();
    const actions = pending.data || [];
    const pendingActions = actions.filter((item: any) => item.status === "PENDING" && new Date(item.expires_at).getTime() > now);
    const expiredActions = actions.filter((item: any) => item.status === "PENDING" && new Date(item.expires_at).getTime() <= now);
    const activeEvents = (automation.data || []).filter((event: any) => ["ACTIVE", "ACKNOWLEDGED"].includes(event.status));
    let summary = { date: new Date().toISOString().slice(0, 10), new: 0, resolved: 0, active: 0, critical: 0, high: 0, medium: 0, low: 0 };
    if (!automation.error && !history.error) {
      try { summary = await getDailyAutomationSummary(supabase); }
      catch (error) { errors.automation = isMissingAutomationTable(error) ? "Automation persistence unavailable — database migration required." : "Unable to load automation summary."; }
    }
    return NextResponse.json({
      updatedAt: new Date().toISOString(), health, automation: { activeEvents, summary, unavailable: Boolean(automationMigrationRequired) }, pendingActions, expiredActions,
      recentActions: actions.filter((item: any) => item.status !== "PENDING").slice(0, 20), history: history.data || [], recentActivity: activity.data || [], errors,
    });
  } catch (error) {
    console.error("AI control center failed", error);
    return NextResponse.json({ error: "Unable to load the AI Operations Control Center." }, { status: 500 });
  }
}
