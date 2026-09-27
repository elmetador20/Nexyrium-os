import { EmployeeWorkload, Project, ProjectPriority, Task } from "@/features/project-management/types";
import { getOperationsHealth, OperationsHealth, RiskSeverity } from "@/lib/ai-agent/operations-intelligence";

export type AgentPlanAction = {
  id: string;
  type: "create_task";
  reason: string;
  risk: "low" | "medium" | "high";
  requiresApproval: true;
  payload: {
    project_id: string;
    name: string;
    description: string;
    department: string;
    assigned_user_id: string;
    priority: ProjectPriority;
    deadline: string | null;
  };
};

export type AgentPlan = {
  title: string;
  summary: string;
  priority: RiskSeverity;
  reasoning: string[];
  actions: AgentPlanAction[];
  health: OperationsHealth;
};

type PlannerInput = {
  projects: Project[];
  tasks: Task[];
  workloads: EmployeeWorkload[];
  now?: Date;
  projectIds?: string[];
};

const WORKFLOW_OWNER: Partial<Record<Project["status"], { department: string; owner: keyof Project }>> = {
  Research: { department: "Research", owner: "researcher_id" },
  "Content Writing": { department: "Content Writing", owner: "content_writer_id" },
  Design: { department: "Design", owner: "designer_id" },
  QA: { department: "QA", owner: "qa_id" },
};

function planPriority(severity: RiskSeverity): ProjectPriority {
  if (severity === "critical") return "URGENT";
  if (severity === "high") return "HIGH";
  if (severity === "medium") return "MEDIUM";
  return "LOW";
}

function actionRisk(severity: RiskSeverity): AgentPlanAction["risk"] {
  return severity === "critical" || severity === "high" ? "high" : severity;
}

function usableProjectDeadline(deadline: string, now: Date) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? deadline : null;
  return date && date >= now.toISOString().slice(0, 10) ? date : null;
}

/**
 * Converts deterministic health findings into a deliberately small plan.
 * It never mutates data. A task is proposed only for an actual high-risk
 * project whose current workflow owner and department are present in CRM data.
 */
export function buildOperationsPlan({ projects, tasks, workloads, now = new Date(), projectIds }: PlannerInput): AgentPlan {
  const health = getOperationsHealth({ projects, tasks, workloads, now });
  const requestedProjectIds = projectIds?.length ? new Set(projectIds) : null;
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const reasoning = [
    ...health.risks.slice(0, 3).map((risk) => `${risk.project_name}: ${risk.risk_factors.map((factor) => factor.reason).join(" ")}`),
    ...health.bottlenecks.slice(0, 2).map((bottleneck) => bottleneck.reason),
  ].slice(0, 5);
  const actions: AgentPlanAction[] = [];

  for (const risk of health.risks) {
    if (actions.length >= 3 || (risk.severity !== "high" && risk.severity !== "critical")) continue;
    if (requestedProjectIds && !requestedProjectIds.has(risk.project_id)) continue;
    const project = projectsById.get(risk.project_id);
    if (!project) continue;
    const workflow = WORKFLOW_OWNER[project.status];
    const assignedUserId = workflow ? project[workflow.owner] : null;
    if (!workflow || typeof assignedUserId !== "string" || !assignedUserId) continue;

    const blockedTask = tasks.find((task) => task.project_id === project.id && task.status === "Blocked");
    const name = blockedTask ? `Unblock: ${blockedTask.name}` : `Follow up: ${project.name}`;
    const reason = risk.risk_factors.map((factor) => factor.reason).join(" ");
    actions.push({
      id: `plan-create-task-${project.id}`,
      type: "create_task",
      reason,
      risk: actionRisk(risk.severity),
      requiresApproval: true,
      payload: {
        project_id: project.id,
        name,
        description: `Operations follow-up for ${project.name}. ${reason}`,
        department: workflow.department,
        assigned_user_id: assignedUserId,
        priority: planPriority(risk.severity),
        // Preserve a real project deadline only when it has not already passed.
        // The planner does not invent replacement dates for overdue work.
        deadline: usableProjectDeadline(project.deadline, now),
      },
    });
  }

  const selectedRisks = requestedProjectIds ? health.risks.filter((risk) => requestedProjectIds.has(risk.project_id)) : health.risks;
  const priority = selectedRisks[0]?.severity || health.attention_items[0]?.severity || "low";
  return {
    title: actions.length ? "Recommended action plan" : "Operations review plan",
    summary: actions.length
      ? `The operations engine identified ${actions.length} safe follow-up action${actions.length === 1 ? "" : "s"} for the highest-priority issues.`
      : "The operations engine found issues to review, but not enough verified ownership information to propose a safe task.",
    priority,
    reasoning,
    actions,
    health,
  };
}
