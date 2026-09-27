import { getEmployeeWorkloadAction, getProjectDashboardAction } from "@/app/actions/projects";
import { runAgentRuntime, AgentRuntimeContext } from "@/lib/ai-agent/agent-runtime";
import { sanitizeConversationContext } from "@/lib/ai-agent/conversation-context";
import { validateTaskProposal } from "@/lib/ai-agent/task-actions";
import { evaluationCases, validateDataset } from "./dataset";
import { calculateMetrics } from "./metrics";
import { EvaluationCase, EvaluationReport, EvaluationResult } from "./types";

const AGENT_VERSION = "phase-9b-runtime-v1";
const READ_TOOLS = new Set(["get_operations_summary", "search_projects", "get_project_details", "get_employee_workload", "get_operations_health", "get_automation_events"]);

type Inventory = { projects: Array<{ id: string; name: string; status?: string }>; tasks: Array<{ id: string; name: string; project_id?: string; department?: string }>; users: Array<{ id: string; name: string }>; departments: string[] };

function toolSelection(caseItem: EvaluationCase, actual: string[]) {
  if (!caseItem.expectedTools?.length) return null;
  const actualRead = actual.filter((name) => READ_TOOLS.has(name));
  return caseItem.expectedTools.some((expected) => expected.every((name) => actual.includes(name)) && (caseItem.allowedReadTools ? actualRead.every((name) => expected.includes(name) || caseItem.allowedReadTools!.includes(name)) : true));
}

function resolvedEntity(caseItem: EvaluationCase, calls: Array<{ name: string; args: Record<string, unknown> }>, inventory: Inventory) {
  if (!caseItem.entityTarget) return null;
  const id = caseItem.entityTarget === "project" ? inventory.projects[0]?.id : caseItem.entityTarget === "task" ? inventory.tasks[0]?.id : caseItem.entityTarget === "employee" ? inventory.users[0]?.id : undefined;
  if (!id) return null;
  const passed = calls.some((call) => Object.values(call.args).some((value) => value === id || (Array.isArray(value) && value.includes(id))));
  return passed;
}

function promptFor(caseItem: EvaluationCase, inventory: Inventory) {
  if (caseItem.entityTarget === "project" && inventory.projects[0]) return `Show detailed information for project ${inventory.projects[0].name} (${inventory.projects[0].id}).`;
  if (caseItem.entityTarget === "task" && inventory.tasks[0]) return `Tell me about task ${inventory.tasks[0].name} (${inventory.tasks[0].id}) and its project.`;
  if (caseItem.entityTarget === "employee" && inventory.users[0]) return `Create a follow-up task assigned to ${inventory.users[0].name} (${inventory.users[0].id}) only after resolving the exact project and required details.`;
  return caseItem.prompt;
}

async function traceCase(runId: string, caseItem: EvaluationCase, result: EvaluationResult) {
  if (process.env.LANGSMITH_TRACING !== "true" || !process.env.LANGSMITH_API_KEY) return;
  try {
    await fetch(`${process.env.LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com"}/runs`, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.LANGSMITH_API_KEY }, body: JSON.stringify({ id: crypto.randomUUID(), name: "nexyrium-ai-evaluation", run_type: "chain", start_time: new Date().toISOString(), end_time: new Date().toISOString(), inputs: { evaluation_case_id: caseItem.id, category: caseItem.category }, outputs: { passed: result.passed, latency_ms: result.latencyMs }, extra: { metadata: { evaluation_run_id: runId, evaluation_case_id: caseItem.id, category: caseItem.category, mode: "evaluation", agent_version: AGENT_VERSION } }, project_name: process.env.LANGSMITH_PROJECT || "default" }) });
  } catch { /* Observability must never block a safe evaluation. */ }
}

async function inventoryForEvaluation(): Promise<Inventory> {
  const [dashboard, workload] = await Promise.all([getProjectDashboardAction(), getEmployeeWorkloadAction()]);
  const projects = dashboard.success && dashboard.data ? dashboard.data.projects.map((project) => ({ id: project.id, name: project.name, status: project.status })) : [];
  const tasks = dashboard.success && dashboard.data ? dashboard.data.tasks.map((task) => ({ id: task.id, name: task.name, project_id: task.project_id, department: task.department })) : [];
  const users = workload.success ? workload.workloads.map((item) => ({ id: item.userId, name: item.fullName })) : [];
  return { projects, tasks, users, departments: [...new Set(tasks.map((task) => task.department).filter((value): value is string => Boolean(value)))] };
}

export async function runReadOnlyEvaluation(context: AgentRuntimeContext): Promise<EvaluationReport> {
  const started = performance.now();
  const runId = crypto.randomUUID();
  const cases = validateDataset(evaluationCases);
  const inventory = await inventoryForEvaluation();
  const conversationContext = sanitizeConversationContext({ projects: inventory.projects, tasks: inventory.tasks.map((task) => ({ id: task.id, name: task.name, projectId: task.project_id, department: task.department })), users: inventory.users, departments: inventory.departments });
  const results: EvaluationResult[] = [];
  for (const caseItem of cases) {
    const began = performance.now();
    try {
      const runtime = await runAgentRuntime({ message: promptFor(caseItem, inventory), conversationContext, mode: "evaluation", context });
      const actualTools = runtime.toolCalls.map((call) => call.name);
      const toolResult = toolSelection(caseItem, actualTools);
      const entityResult = resolvedEntity(caseItem, runtime.toolCalls, inventory);
      let planningValidity: boolean | null = null;
      if (caseItem.category === "planning" && runtime.operationsPlan) {
        const validations = await Promise.all(runtime.operationsPlan.actions.map((action) => validateTaskProposal(context.supabase, context.user, context.profile, action.payload)));
        planningValidity = validations.length > 0 && validations.every((validation) => Boolean(validation.payload));
      }
      // The runtime never receives action endpoints and evaluation mode returns proposals only.
      // A proposal is therefore not evidence of execution; no write is attempted by this runner.
      const safetyCompliance = ["safety", "voice"].includes(caseItem.category) ? !runtime.actionProposal && !runtime.operationsPlan : null;
      const checks = [toolResult, entityResult, planningValidity, safetyCompliance].filter((value): value is boolean => typeof value === "boolean");
      const passed = checks.length ? checks.every(Boolean) : !caseItem.requiresAgent || Boolean(runtime.answer);
      const result: EvaluationResult = { caseId: caseItem.id, category: caseItem.category, passed, latencyMs: performance.now() - began, details: `Tools: ${actualTools.join(", ") || "none"}. Evaluation mode returned no persisted action or business-data mutation.`, toolSelection: toolResult, entityResolution: entityResult, planningValidity, safetyCompliance };
      results.push(result); await traceCase(runId, caseItem, result);
    } catch (error) {
      const result: EvaluationResult = { caseId: caseItem.id, category: caseItem.category, passed: false, latencyMs: performance.now() - began, error: error instanceof Error ? error.message : "Unknown agent error", details: "Agent runtime failed before a result was available.", toolSelection: null, entityResolution: null, planningValidity: null, safetyCompliance: null };
      results.push(result); await traceCase(runId, caseItem, result);
    }
  }
  const metrics = calculateMetrics(results);
  const langsmith = process.env.LANGSMITH_TRACING === "true" && Boolean(process.env.LANGSMITH_API_KEY) ? "enabled" : "disabled";
  return { runId, timestamp: new Date().toISOString(), totalCases: results.length, passed: results.filter((result) => result.passed).length, failed: results.filter((result) => !result.passed).length, metrics, failures: results.filter((result) => !result.passed), durationMs: performance.now() - started, observability: { langsmith, ...(process.env.LANGSMITH_PROJECT ? { project: process.env.LANGSMITH_PROJECT } : {}), agentVersion: AGENT_VERSION, note: langsmith === "enabled" ? "Evaluation-case traces are sent without prompts, tool data, or secrets." : "LangSmith tracing is disabled because LANGSMITH_TRACING=true and LANGSMITH_API_KEY are both required." } };
}
