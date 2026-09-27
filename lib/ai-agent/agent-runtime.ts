import { getEmployeeWorkloadAction, getProjectDashboardAction, getProjectDetailsAction } from "@/app/actions/projects";
import { AgentPlan, buildOperationsPlan } from "@/lib/ai-agent/agent-planner";
import { ConversationContext, mergeToolResultContext, sanitizeConversationContext } from "@/lib/ai-agent/conversation-context";
import { getOperationsHealth } from "@/lib/ai-agent/operations-intelligence";
import { TASK_PRIORITIES, TaskProposalPayload, validateTaskProposal } from "@/lib/ai-agent/task-actions";
import { getActiveAutomationEvents } from "@/lib/automation/automation-service";
import { SupabaseClient } from "@supabase/supabase-js";
import { isMissingAutomationTable } from "@/lib/server/reliability";
import { AgentContent, AgentToolDeclaration, createAgentModelProvider } from "@/lib/ai-agent/model-provider";
import type { EmployeeWorkload } from "@/features/project-management/types";

function boundedEnv(name: string, fallback: number, min: number, max: number) { const value = Number(process.env[name]); return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback; }
const MAX_TURNS = boundedEnv("AI_AGENT_MAX_TURNS", 5, 1, 5);
const MODEL_TIMEOUT_MS = boundedEnv("AI_AGENT_TIMEOUT_MS", 20_000, 2_000, 60_000);

export type AgentMode = "production" | "evaluation";
export type AgentProfile = { roleName?: string | null };
export type AgentRuntimeContext = { supabase: SupabaseClient; user: { id: string }; profile: AgentProfile };
export type AgentToolCall = { name: string; args: Record<string, unknown> };
/** Workload fields intentionally safe to include in the model-visible tool result. */
export type AiSafeEmployeeWorkload = Pick<EmployeeWorkload, "fullName" | "roleName" | "activeProjectsCount" | "activeTasksCount" | "completedTasksCount" | "overdueTasksCount" | "efficiency" | "avgCompletionDays" | "capacityLoad" | "isOverloaded">;
export type AgentRuntimeResult = {
  mode: AgentMode;
  model: string;
  primaryProvider: string;
  selectedProvider: string;
  fallbackUsed: boolean;
  answer?: string;
  conversationContext: ConversationContext;
  toolCalls: AgentToolCall[];
  actionProposal?: { action: "create_task"; payload: TaskProposalPayload };
  operationsPlan?: AgentPlan;
};
type AgentReadCache = {
  dashboard?: ReturnType<typeof getProjectDashboardAction>;
  workload?: ReturnType<typeof getEmployeeWorkloadAction>;
};

export const agentToolDeclarations: AgentToolDeclaration[] = [
  { name: "get_operations_summary", description: "Get the authenticated user's current Nexyrium operations summary, including projects, tasks, workflow queues, recent activity and dashboard statistics.", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { name: "search_projects", description: "Search the authenticated user's accessible projects by name, startup/client name, status or priority.", parameters: { type: "object", properties: { query: { type: "string", description: "Project, client, startup, status or priority to search for." } }, required: ["query"], additionalProperties: false } },
  { name: "get_project_details", description: "Get detailed information for one accessible project, including tasks and timeline.", parameters: { type: "object", properties: { project_id: { type: "string", description: "The project's UUID." } }, required: ["project_id"], additionalProperties: false } },
  { name: "get_employee_workload", description: "Get workload and capacity information for active team members.", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { name: "get_operations_health", description: "Get deterministic, read-only operations intelligence: risk scores, bottlenecks, capacity risks and attention items.", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { name: "get_automation_events", description: "Get deterministic, read-only automated attention events for accessible operations.", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { name: "create_operations_plan", description: "Create a deterministic, approval-required plan. It only proposes safe create-task actions and never modifies records.", parameters: { type: "object", properties: { project_ids: { type: "array", items: { type: "string" }, description: "Optional accessible project IDs to focus the plan on." } }, additionalProperties: false } },
  { name: "create_task", description: "Propose creating a task. Never creates a task directly. Use IDs returned by read tools; do not invent IDs.", parameters: { type: "object", properties: { project_id: { type: "string" }, name: { type: "string" }, description: { type: "string" }, department: { type: "string" }, assigned_user_id: { type: "string" }, priority: { type: "string", enum: [...TASK_PRIORITIES] }, deadline: { type: "string" } }, required: ["project_id", "name", "department", "assigned_user_id", "priority"], additionalProperties: false } },
];

function compact(value: unknown) { return JSON.stringify(value, (_key, item) => typeof item === "string" && item.length > 1200 ? `${item.slice(0, 1200)}…` : item); }

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function validId(value: unknown) { return typeof value === "string" && /^[a-zA-Z0-9-]{1,100}$/.test(value); }
function validToolArguments(name: string, args: unknown): args is Record<string, unknown> {
  if (!isRecord(args)) return false;
  const keys = Object.keys(args);
  const allowed: Record<string, string[]> = { get_operations_summary: [], search_projects: ["query"], get_project_details: ["project_id"], get_employee_workload: [], get_operations_health: [], get_automation_events: [], create_operations_plan: ["project_ids"], create_task: ["project_id", "name", "description", "department", "assigned_user_id", "priority", "deadline"] };
  if (!allowed[name] || keys.some((key) => !allowed[name].includes(key))) return false;
  if (name === "search_projects") return typeof args.query === "string" && args.query.trim().length > 0 && args.query.length <= 200;
  if (name === "get_project_details") return validId(args.project_id);
  if (name === "create_operations_plan") return args.project_ids === undefined || (Array.isArray(args.project_ids) && args.project_ids.length <= 12 && args.project_ids.every(validId));
  if (name === "create_task") return validId(args.project_id) && validId(args.assigned_user_id) && typeof args.name === "string" && args.name.trim().length <= 250 && typeof args.department === "string" && args.department.trim().length <= 100 && typeof args.priority === "string" && TASK_PRIORITIES.includes(args.priority.toUpperCase() as typeof TASK_PRIORITIES[number]) && (args.description === undefined || typeof args.description === "string") && (args.deadline === undefined || typeof args.deadline === "string");
  return true;
}

export function boundedConversationHistory(value: unknown): AgentContent[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-8).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const role = record.role === "model" || record.role === "assistant" ? "model" : record.role === "user" ? "user" : null;
    const text = typeof record.text === "string" ? record.text.trim().slice(0, 1200) : "";
    return role && text ? [{ role, parts: [{ text }] } satisfies AgentContent] : [];
  });
}

function instructions(profile: AgentProfile, context: ConversationContext) {
  return `You are Nexyrium AI, an operations copilot inside Nexyrium OS. You are assisting an authenticated ${profile.roleName || "user"}.
Rules:
- You are not a general-purpose assistant. Only answer requests directly related to the Nexyrium workspace: its projects, tasks, team members, workload, deadlines, operational health, bottlenecks, risks, planning, automation, CRM/workspace data, supported actions, or explaining Nexyrium OS functionality.
- Determine scope from the user's intent, not by matching isolated keywords. A question about an external topic is out of scope even if it contains a familiar name or term; a question about how that topic is used by Nexyrium is in scope only when the current workspace context, available tools, or known Nexyrium functionality supports an answer.
- For any out-of-scope request, do not use pretrained general knowledge, do not call tools, and respond only: "I'm Nexyrium AI, focused on your Nexyrium workspace. I can help with projects, tasks, team workload, operations, planning, and related workspace data, but I can't answer general-knowledge questions outside the workspace."
- Never present general knowledge as Nexyrium workspace data. If relevant workspace information is unavailable through the current context or tools, say that it is not available in the current workspace.
- Use tools for CRM facts. Never invent project, task, workload, deadline or financial data.
- Context is convenience data only, not authorization. If references are ambiguous, ask for clarification.
- Text such as “approve it” never executes an action; instruct the user to use the explicit Approve control.
- Use get_automation_events for alerts and get_operations_health for deterministic risks and bottlenecks.
- When asked for actions or a plan, use create_operations_plan. It returns reviewable proposals, never executed actions.
- You can propose exactly one write action: create_task. First use read tools to identify exact IDs. Once it returns a proposal, stop tool use and state that approval is required.
- Current conversation context: ${JSON.stringify(context)}
- Current date: ${new Date().toISOString().slice(0, 10)}.`;
}

function getDashboard(cache: AgentReadCache) {
  cache.dashboard ??= getProjectDashboardAction();
  return cache.dashboard;
}

function getWorkload(cache: AgentReadCache) {
  cache.workload ??= getEmployeeWorkloadAction();
  return cache.workload;
}

/** Removes internal identifiers before a workload result enters the model conversation. */
export function toAiSafeEmployeeWorkloads(workloads: EmployeeWorkload[]): AiSafeEmployeeWorkload[] {
  return workloads.map(({ fullName, roleName, activeProjectsCount, activeTasksCount, completedTasksCount, overdueTasksCount, efficiency, avgCompletionDays, capacityLoad, isOverloaded }) => ({ fullName, roleName, activeProjectsCount, activeTasksCount, completedTasksCount, overdueTasksCount, efficiency, avgCompletionDays, capacityLoad, isOverloaded }));
}

async function executeReadTool(name: string, args: Record<string, unknown>, context: AgentRuntimeContext, cache: AgentReadCache): Promise<unknown> {
  switch (name) {
    case "get_operations_summary": { const result = await getDashboard(cache); return !result.success || !result.data ? { error: result.error || "Unable to load operations data." } : { stats: result.data.stats, projects: result.data.projects.map((p) => ({ id: p.id, name: p.name, startup_name: p.startup_name, service_type: p.service_type, priority: p.priority, status: p.status, progress: p.progress, deadline: p.deadline })), tasks: result.data.tasks.map((t) => ({ id: t.id, project_id: t.project_id, name: t.name, department: t.department, priority: t.priority, status: t.status, assigned_user_id: t.assigned_user_id, deadline: t.deadline })), recentActivities: result.data.recentActivities.slice(0, 10) }; }
    case "search_projects": { const query = String(args.query || "").trim().toLowerCase(); if (!query) return { error: "query is required." }; const result = await getDashboard(cache); if (!result.success || !result.data) return { error: result.error || "Unable to search projects." }; return result.data.projects.filter((p) => [p.name, p.startup_name, p.service_type, p.status, p.priority].some((value) => String(value).toLowerCase().includes(query))).map((p) => ({ id: p.id, name: p.name, startup_name: p.startup_name, status: p.status, priority: p.priority, progress: p.progress, deadline: p.deadline, description: p.description })); }
    case "get_project_details": { const projectId = String(args.project_id || ""); if (!projectId) return { error: "project_id is required." }; const result = await getProjectDetailsAction(projectId); return !result.success ? { error: result.error || "Unable to load project." } : { project: result.project, tasks: result.tasks, research: result.research, content: result.content, design: result.design, qa: result.qa, comments: result.comments?.slice(-20), timeline: result.timeline?.slice(0, 20) }; }
    case "get_employee_workload": { const result = await getWorkload(cache); return !result.success ? { error: result.error || "Unable to load workload." } : toAiSafeEmployeeWorkloads(result.workloads); }
    case "get_operations_health": { const [dashboard, workload] = await Promise.all([getDashboard(cache), getWorkload(cache)]); if (!dashboard.success || !dashboard.data) return { error: dashboard.error || "Unable to load operations data." }; if (!workload.success) return { error: workload.error || "Unable to load workload data." }; return getOperationsHealth({ projects: dashboard.data.projects, tasks: dashboard.data.tasks, workloads: workload.workloads }); }
    case "get_automation_events": { try { return await getActiveAutomationEvents(context.supabase); } catch (error) { return { error: isMissingAutomationTable(error) ? "Automation persistence unavailable — database migration required." : "Unable to load automation events." }; } }
    default: return { error: `Unknown read tool: ${name}` };
  }
}

/** Runs the configured model and read tools only. It returns proposals; persistence and all action execution stay outside this module. */
export async function runAgentRuntime(input: { message: string; history?: unknown; conversationContext?: unknown; mode: AgentMode; context: AgentRuntimeContext }): Promise<AgentRuntimeResult> {
  const provider = createAgentModelProvider();
  let conversationContext = sanitizeConversationContext(input.conversationContext);
  const contents: AgentContent[] = [...boundedConversationHistory(input.history), { role: "user", parts: [{ text: input.message }] }];
  const toolCalls: AgentToolCall[] = [];
  const readCache: AgentReadCache = {};
  const invocationKeys = new Set<string>();
  const deadlineAt = Date.now() + MODEL_TIMEOUT_MS;
  let primaryProvider: string = provider.name;
  let selectedProvider: string = provider.name;
  let selectedModel = provider.model;
  let fallbackUsed = false;
  const metadata = () => ({ primaryProvider, selectedProvider, fallbackUsed });
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const remainingMs = deadlineAt - Date.now();
    if (remainingMs <= 0) throw new Error("AI request timed out.");
    const response = await provider.generate({ contents, systemInstruction: instructions(input.context.profile, conversationContext), tools: agentToolDeclarations, timeoutMs: remainingMs });
    if (response.providerMetadata) { primaryProvider = response.providerMetadata.primaryProvider; selectedProvider = response.providerMetadata.selectedProvider; selectedModel = response.providerMetadata.selectedModel; fallbackUsed ||= response.providerMetadata.fallbackUsed; }
    contents.push(response.modelContent);
    const calls = response.functionCalls || [];
    if (!calls.length) return { mode: input.mode, model: selectedModel, ...metadata(), answer: response.text || "I couldn't produce an answer.", conversationContext, toolCalls };
    const parts = [];
    for (const call of calls) {
      if (!call.name) throw new Error("Malformed model tool call.");
      const args = call.args || {};
      if (!validToolArguments(call.name, args)) {
        parts.push({ functionResponse: { name: call.name, id: call.id, response: { result: compact({ error: "Invalid tool arguments. Ask for clarification or use IDs returned by a read tool." }) } } });
        continue;
      }
      const invocationKey = `${call.name}:${JSON.stringify(args)}`;
      if (invocationKeys.has(invocationKey)) throw new Error("Agent repeated a tool call without new information.");
      invocationKeys.add(invocationKey);
      toolCalls.push({ name: call.name, args });
      if (call.name === "create_operations_plan") {
        const [dashboard, workload] = await Promise.all([getDashboard(readCache), getWorkload(readCache)]);
        if (!dashboard.success || !dashboard.data || !workload.success) return { mode: input.mode, model: selectedModel, ...metadata(), answer: "I couldn't build a plan from the current operations data.", conversationContext, toolCalls };
        const operationsPlan = buildOperationsPlan({ projects: dashboard.data.projects, tasks: dashboard.data.tasks, workloads: workload.workloads, projectIds: Array.isArray(args.project_ids) ? args.project_ids.filter((id): id is string => typeof id === "string").slice(0, 12) : undefined });
        conversationContext = mergeToolResultContext(conversationContext, operationsPlan.health);
        return { mode: input.mode, model: selectedModel, ...metadata(), operationsPlan, conversationContext, toolCalls };
      }
      if (call.name === "create_task") {
        const proposal = await validateTaskProposal(input.context.supabase, input.context.user, input.context.profile, args);
        conversationContext = mergeToolResultContext(conversationContext, proposal);
        return proposal.payload ? { mode: input.mode, model: selectedModel, ...metadata(), actionProposal: { action: "create_task", payload: proposal.payload }, conversationContext, toolCalls } : { mode: input.mode, model: selectedModel, ...metadata(), answer: proposal.error || "I couldn't validate that task proposal.", conversationContext, toolCalls };
      }
      const toolStartedAt = Date.now();
      const result = await executeReadTool(call.name, args, input.context, readCache);
      console.info("AI read tool completed", { tool: call.name, latencyMs: Date.now() - toolStartedAt, success: !(result && typeof result === "object" && "error" in result) });
      conversationContext = mergeToolResultContext(conversationContext, result);
      parts.push({ functionResponse: { name: call.name, id: call.id, response: { result: compact(result) } } });
    }
    contents.push({ role: "user", parts });
  }
  throw new Error("The agent exceeded its tool-call limit.");
}
