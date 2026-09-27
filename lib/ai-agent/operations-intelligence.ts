import { EmployeeWorkload, Project, Task } from "@/features/project-management/types";

/**
 * Deterministic Operations Intelligence rules. These are deliberately simple,
 * data-backed rules—not a predictive model—and their points are returned with
 * every result so the AI can explain them.
 *
 * Risk severity: low 0-24, medium 25-49, high 50-74, critical 75+.
 */
export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type RiskFactor = {
  type: "overdue" | "severely_overdue" | "deadline_soon" | "blocked_work" | "department_bottleneck" | "over_capacity";
  points: number;
  reason: string;
};

export type ProjectRisk = {
  project_id: string;
  project_name: string;
  project_status: string;
  risk_score: number;
  severity: RiskSeverity;
  risk_factors: RiskFactor[];
};

export type Bottleneck = {
  type: "department" | "project_status" | "employee_capacity";
  department?: string;
  status?: string;
  employee_id?: string;
  employee_name?: string;
  role?: string;
  delayed_projects?: number;
  delayed_tasks?: number;
  capacity_load?: number;
  severity: RiskSeverity;
  reason: string;
};

export type AttentionItem = {
  type: "project_risk" | "employee_capacity" | "bottleneck";
  severity: RiskSeverity;
  title: string;
  reason: string;
  project_id?: string;
  employee_id?: string;
  risk_score?: number;
};

export type OperationsHealth = {
  summary: {
    active_projects: number;
    delayed_projects: number;
    completed_projects: number;
    projects_due_soon: number;
    overloaded_employees: number;
    total_active_tasks: number;
  };
  risks: ProjectRisk[];
  bottlenecks: Bottleneck[];
  capacity: Array<{
    employee_id: string;
    employee_name: string;
    role: string;
    capacity_load: number;
    overloaded: boolean;
    severity: RiskSeverity;
  }>;
  attention_items: AttentionItem[];
};

type IntelligenceInput = {
  projects: Project[];
  tasks: Task[];
  workloads: EmployeeWorkload[];
  now?: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function dayStart(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function deadlineDay(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const day = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(day) ? null : day;
}

function daysFromToday(deadline: string | null | undefined, today: number) {
  const day = deadlineDay(deadline);
  return day === null ? null : Math.round((day - today) / DAY_MS);
}

function isActiveProject(project: Project) {
  return project.status !== "Completed" && project.status !== "Cancelled";
}

export function severityForRisk(score: number): RiskSeverity {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function severityForCapacity(capacityLoad: number): RiskSeverity {
  if (capacityLoad > 100) return "critical";
  if (capacityLoad >= 85) return "high";
  if (capacityLoad >= 70) return "medium";
  return "low";
}

function delayedDepartmentCounts(tasks: Task[], today: number) {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.status === "Completed" || daysFromToday(task.deadline, today) === null || (daysFromToday(task.deadline, today) as number) >= 0) continue;
    if (task.department) counts.set(task.department, (counts.get(task.department) || 0) + 1);
  }
  return counts;
}

export function getBottlenecks({ projects, tasks, workloads, now = new Date() }: IntelligenceInput): Bottleneck[] {
  const today = dayStart(now);
  const bottlenecks: Bottleneck[] = [];
  const delayedByDepartment = delayedDepartmentCounts(tasks, today);

  // Two or more overdue tasks in a department is reported as a potential—not
  // causal—bottleneck. Project status is separately grouped when multiple
  // active projects are already overdue in the same workflow stage.
  for (const [department, delayedTasks] of delayedByDepartment) {
    if (delayedTasks < 2) continue;
    bottlenecks.push({
      type: "department", department, delayed_tasks: delayedTasks,
      severity: delayedTasks >= 4 ? "high" : "medium",
      reason: `Potential bottleneck: ${delayedTasks} overdue task${delayedTasks === 1 ? "" : "s"} are in ${department}.`,
    });
  }

  const delayedByStatus = new Map<string, number>();
  for (const project of projects) {
    const days = daysFromToday(project.deadline, today);
    if (!isActiveProject(project) || days === null || days >= 0) continue;
    delayedByStatus.set(project.status, (delayedByStatus.get(project.status) || 0) + 1);
  }
  for (const [status, delayedProjects] of delayedByStatus) {
    if (delayedProjects < 2) continue;
    bottlenecks.push({
      type: "project_status", status, delayed_projects: delayedProjects,
      severity: delayedProjects >= 4 ? "high" : "medium",
      reason: `Potential bottleneck: ${delayedProjects} overdue projects are currently in ${status}.`,
    });
  }

  for (const workload of workloads) {
    if (workload.capacityLoad < 85) continue;
    bottlenecks.push({
      type: "employee_capacity", employee_id: workload.userId, employee_name: workload.fullName,
      role: workload.roleName, capacity_load: workload.capacityLoad,
      severity: severityForCapacity(workload.capacityLoad),
      reason: `Potential capacity bottleneck: ${workload.fullName} (${workload.roleName}) is at ${workload.capacityLoad}% capacity.`,
    });
  }

  return bottlenecks;
}

export function getOperationsHealth({ projects, tasks, workloads, now = new Date() }: IntelligenceInput): OperationsHealth {
  const today = dayStart(now);
  const activeProjects = projects.filter(isActiveProject);
  const delayedProjects = activeProjects.filter((project) => {
    const days = daysFromToday(project.deadline, today);
    return days !== null && days < 0;
  });
  const projectsDueSoon = activeProjects.filter((project) => {
    const days = daysFromToday(project.deadline, today);
    return days !== null && days >= 0 && days <= 2;
  });
  const bottlenecks = getBottlenecks({ projects, tasks, workloads, now });
  const delayedTaskDepartments = new Set(bottlenecks.filter((item) => item.type === "department").map((item) => item.department));
  const workloadByUserId = new Map(workloads.map((workload) => [workload.userId, workload]));

  const risks = activeProjects.map((project): ProjectRisk => {
    const factors: RiskFactor[] = [];
    const days = daysFromToday(project.deadline, today);
    if (days !== null && days < 0) {
      factors.push({ type: "overdue", points: 25, reason: "Project deadline has passed." });
      if (days <= -30) factors.push({ type: "severely_overdue", points: 15, reason: `Project is ${Math.abs(days)} days overdue.` });
    } else if (days !== null && days <= 2) {
      factors.push({ type: "deadline_soon", points: 15, reason: `Project deadline is in ${days} day${days === 1 ? "" : "s"}.` });
    }

    if (tasks.some((task) => task.project_id === project.id && task.status === "Blocked")) {
      factors.push({ type: "blocked_work", points: 20, reason: "The project has at least one blocked task." });
    }
    if (delayedTaskDepartments.has(project.status)) {
      factors.push({ type: "department_bottleneck", points: 15, reason: `The ${project.status} queue has multiple overdue tasks.` });
    }
    const responsibleUsers = [project.project_manager_id, project.researcher_id, project.content_writer_id, project.designer_id, project.qa_id];
    if (responsibleUsers.some((id) => id && (workloadByUserId.get(id)?.capacityLoad || 0) > 100)) {
      factors.push({ type: "over_capacity", points: 15, reason: "A project team member is above 100% capacity." });
    }

    const riskScore = factors.reduce((total, factor) => total + factor.points, 0);
    return { project_id: project.id, project_name: project.name, project_status: project.status, risk_score: riskScore, severity: severityForRisk(riskScore), risk_factors: factors };
  }).filter((risk) => risk.risk_score > 0).sort((a, b) => b.risk_score - a.risk_score);

  const capacity = workloads.filter((workload) => workload.capacityLoad >= 70).map((workload) => ({
    employee_id: workload.userId, employee_name: workload.fullName, role: workload.roleName,
    capacity_load: workload.capacityLoad, overloaded: workload.isOverloaded, severity: severityForCapacity(workload.capacityLoad),
  })).sort((a, b) => b.capacity_load - a.capacity_load);

  const attentionItems: AttentionItem[] = [
    ...risks.filter((risk) => risk.severity === "high" || risk.severity === "critical").map((risk) => ({
      type: "project_risk" as const, severity: risk.severity, title: `${risk.project_name} requires attention`,
      project_id: risk.project_id, risk_score: risk.risk_score,
      reason: risk.risk_factors.map((factor) => factor.reason).join(" "),
    })),
    ...capacity.filter((item) => item.severity === "high" || item.severity === "critical").map((item) => ({
      type: "employee_capacity" as const, severity: item.severity, employee_id: item.employee_id,
      title: `${item.employee_name} is at ${item.capacity_load}% capacity`,
      reason: `${item.role} capacity is at or above the existing overload threshold.`,
    })),
    ...bottlenecks.map((item) => ({
      type: "bottleneck" as const, severity: item.severity, title: "Potential operational bottleneck", reason: item.reason,
    })),
  ].sort((a, b) => ["critical", "high", "medium", "low"].indexOf(a.severity) - ["critical", "high", "medium", "low"].indexOf(b.severity));

  return {
    summary: {
      active_projects: activeProjects.length, delayed_projects: delayedProjects.length,
      completed_projects: projects.filter((project) => project.status === "Completed").length,
      projects_due_soon: projectsDueSoon.length,
      overloaded_employees: workloads.filter((workload) => workload.isOverloaded).length,
      total_active_tasks: tasks.filter((task) => task.status !== "Completed").length,
    },
    risks, bottlenecks, capacity, attention_items: attentionItems,
  };
}
