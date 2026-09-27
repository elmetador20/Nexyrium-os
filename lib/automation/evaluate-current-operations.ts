import { getEmployeeWorkloadAction, getProjectDashboardAction } from "@/app/actions/projects";
import { evaluateAutomationRules } from "@/lib/automation/automation-engine";

/** Loads existing, access-scoped CRM datasets once, then evaluates read-only rules. */
export async function evaluateCurrentOperations() {
  const [dashboard, workload] = await Promise.all([getProjectDashboardAction(), getEmployeeWorkloadAction()]);
  if (!dashboard.success || !dashboard.data) throw new Error(dashboard.error || "Unable to load operations data.");
  if (!workload.success) throw new Error(workload.error || "Unable to load workload data.");
  const evaluatedAt = new Date().toISOString();
  return {
    evaluatedAt,
    events: evaluateAutomationRules({ projects: dashboard.data.projects, tasks: dashboard.data.tasks, workloads: workload.workloads, now: new Date(evaluatedAt) }),
  };
}
