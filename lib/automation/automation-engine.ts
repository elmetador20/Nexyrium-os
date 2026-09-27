import { EmployeeWorkload, Project, Task } from "@/features/project-management/types";
import { getBottlenecks, getOperationsHealth, RiskSeverity } from "@/lib/ai-agent/operations-intelligence";

export type AutomationEventType = "PROJECT_OVERDUE" | "DEADLINE_APPROACHING" | "EMPLOYEE_OVERLOADED" | "DEPARTMENT_BOTTLENECK" | "PROJECT_AT_RISK";
export type AutomationEntityType = "project" | "employee" | "department";

export type AutomationEvent = {
  id: string;
  ruleId: AutomationEventType;
  type: AutomationEventType;
  severity: RiskSeverity;
  title: string;
  description: string;
  entityType: AutomationEntityType;
  entityId: string;
  projectId?: string;
  userId?: string;
  department?: string;
  detectedAt: string;
  metadata: Record<string, unknown>;
};

type AutomationInput = { projects: Project[]; tasks: Task[]; workloads: EmployeeWorkload[]; now?: Date };

const ORDER: RiskSeverity[] = ["critical", "high", "medium", "low"];

function todayKey(now: Date) {
  return now.toISOString().slice(0, 10);
}

function eventId(ruleId: AutomationEventType, entityType: AutomationEntityType, entityId: string, window: string) {
  return `${ruleId}:${entityType}:${entityId}:${window}`;
}

function addEvent(events: AutomationEvent[], event: AutomationEvent) {
  if (!events.some((existing) => existing.id === event.id)) events.push(event);
}

/**
 * Read-only automation evaluator. Rules reuse Operations Intelligence rather
 * than recalculating risk, capacity, or bottlenecks. Event IDs are stable for
 * the daily evaluation window, so repeated evaluations are idempotent.
 */
export function evaluateAutomationRules({ projects, tasks, workloads, now = new Date() }: AutomationInput) {
  const detectedAt = now.toISOString();
  const window = todayKey(now);
  const events: AutomationEvent[] = [];
  const health = getOperationsHealth({ projects, tasks, workloads, now });
  const bottlenecks = getBottlenecks({ projects, tasks, workloads, now });

  for (const risk of health.risks) {
    const overdue = risk.risk_factors.find((factor) => factor.type === "overdue");
    if (overdue) addEvent(events, {
      id: eventId("PROJECT_OVERDUE", "project", risk.project_id, window), ruleId: "PROJECT_OVERDUE", type: "PROJECT_OVERDUE",
      severity: risk.severity, title: "Project is overdue", description: `${risk.project_name}: ${overdue.reason}`,
      entityType: "project", entityId: risk.project_id, projectId: risk.project_id, detectedAt,
      metadata: { projectName: risk.project_name, riskScore: risk.risk_score, riskFactors: risk.risk_factors },
    });
    const deadlineSoon = risk.risk_factors.find((factor) => factor.type === "deadline_soon");
    if (deadlineSoon) addEvent(events, {
      id: eventId("DEADLINE_APPROACHING", "project", risk.project_id, window), ruleId: "DEADLINE_APPROACHING", type: "DEADLINE_APPROACHING",
      severity: risk.severity, title: "Project deadline approaching", description: `${risk.project_name}: ${deadlineSoon.reason}`,
      entityType: "project", entityId: risk.project_id, projectId: risk.project_id, detectedAt,
      metadata: { projectName: risk.project_name, riskScore: risk.risk_score, riskFactors: risk.risk_factors },
    });
    if (risk.severity === "high" || risk.severity === "critical") addEvent(events, {
      id: eventId("PROJECT_AT_RISK", "project", risk.project_id, window), ruleId: "PROJECT_AT_RISK", type: "PROJECT_AT_RISK",
      severity: risk.severity, title: "Project needs operational attention", description: `${risk.project_name}: ${risk.risk_factors.map((factor) => factor.reason).join(" ")}`,
      entityType: "project", entityId: risk.project_id, projectId: risk.project_id, detectedAt,
      metadata: { projectName: risk.project_name, riskScore: risk.risk_score, riskFactors: risk.risk_factors },
    });
  }

  for (const bottleneck of bottlenecks) {
    if (bottleneck.type === "employee_capacity" && bottleneck.employee_id) addEvent(events, {
      id: eventId("EMPLOYEE_OVERLOADED", "employee", bottleneck.employee_id, window), ruleId: "EMPLOYEE_OVERLOADED", type: "EMPLOYEE_OVERLOADED",
      severity: bottleneck.severity, title: "Employee capacity needs review", description: bottleneck.reason,
      entityType: "employee", entityId: bottleneck.employee_id, userId: bottleneck.employee_id, detectedAt,
      metadata: { employeeName: bottleneck.employee_name, role: bottleneck.role, capacityLoad: bottleneck.capacity_load },
    });
    if (bottleneck.type === "department" && bottleneck.department) addEvent(events, {
      id: eventId("DEPARTMENT_BOTTLENECK", "department", bottleneck.department, window), ruleId: "DEPARTMENT_BOTTLENECK", type: "DEPARTMENT_BOTTLENECK",
      severity: bottleneck.severity, title: "Department bottleneck detected", description: bottleneck.reason,
      entityType: "department", entityId: bottleneck.department, department: bottleneck.department, detectedAt,
      metadata: { delayedTasks: bottleneck.delayed_tasks },
    });
  }

  return events.sort((left, right) => {
    const severity = ORDER.indexOf(left.severity) - ORDER.indexOf(right.severity);
    if (severity !== 0) return severity;
    const riskScore = Number(right.metadata.riskScore || 0) - Number(left.metadata.riskScore || 0);
    return riskScore || left.id.localeCompare(right.id);
  });
}
