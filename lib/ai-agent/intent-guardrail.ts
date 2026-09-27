export const NEXYRIUM_CAPABILITIES = ["PROJECT", "TASK", "EMPLOYEE", "OPERATIONS", "RISK", "PLANNING", "ACTION", "AUTOMATION", "CRM", "HELP", "SYSTEM_EXPLANATION", "PRODUCT_ADVICE", "GENERAL_CONVERSATION", "OUT_OF_SCOPE"] as const;
export type NexyriumCapability = typeof NEXYRIUM_CAPABILITIES[number];
export type IntentGuardrailDecision =
  | { allowed: true; capability: Exclude<NexyriumCapability, "OUT_OF_SCOPE">; scopeProbability: number; capabilityConfidence: number; model: string; latencyMs: number; inputTokens?: number; estimatedCost?: number }
  | { allowed: false; reason: "out_of_scope" | "uncertain" | "unavailable"; scopeProbability?: number; capabilityConfidence?: number; model?: string; latencyMs: number; inputTokens?: number; estimatedCost?: number; failureCategory?: string };
export type JevGuardrailMode = "shadow" | "enforce";

const ENDPOINT = "https://openrouter.ai/api/alpha/decisions";
const MODEL = "typesafe/jev-1.13";
const SCOPE_RESPONSE = "That's outside Nexyrium's current scope.";
const UNCERTAIN_RESPONSE = "I need a little more context about how this relates to your Nexyrium workspace.";
const UNAVAILABLE_RESPONSE = "AI request classification is temporarily unavailable. Please try again.";
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type RemoteAnswer = { type?: unknown; noul?: unknown; choice?: unknown; confidence?: unknown };

function boundedEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function jevGuardrailMode(): JevGuardrailMode {
  return process.env.JEV_GUARDRAIL_MODE?.trim().toLowerCase() === "enforce" ? "enforce" : "shadow";
}

function confidenceThreshold() { return boundedEnv("NEXYRIUM_INTENT_MIN_CONFIDENCE", 0.8, 0.5, 0.99); }
function timeoutMs() { return boundedEnv("JEV_GUARDRAIL_TIMEOUT_MS", 1_500, 250, 5_000); }
function isCapability(value: unknown): value is NexyriumCapability { return typeof value === "string" && (NEXYRIUM_CAPABILITIES as readonly string[]).includes(value); }
function probability(value: unknown) { return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null; }
function numberValue(value: unknown) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined; }
function failureCategory(status?: number) { return status === 401 || status === 403 ? "authentication" : status === 429 ? "rate_limited" : status && status >= 500 ? "provider" : status && status >= 400 ? "validation" : "unavailable"; }

export function intentGuardrailResponse(decision: Extract<IntentGuardrailDecision, { allowed: false }>) {
  return decision.reason === "out_of_scope" ? SCOPE_RESPONSE : decision.reason === "uncertain" ? UNCERTAIN_RESPONSE : UNAVAILABLE_RESPONSE;
}

/** Server-only Jev preflight. It evaluates only the user message and never invokes workspace tools. */
export async function classifyNexyriumIntent(message: string, fetchImpl: FetchLike = fetch): Promise<IntentGuardrailDecision> {
  const startedAt = performance.now();
  const finish = <T extends Omit<Extract<IntentGuardrailDecision, { allowed: false }>, "latencyMs"> | Omit<Extract<IntentGuardrailDecision, { allowed: true }>, "latencyMs">>(result: T) => ({ ...result, latencyMs: performance.now() - startedAt }) as IntentGuardrailDecision;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return finish({ allowed: false, reason: "unavailable", failureCategory: "missing_api_key" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const response = await fetchImpl(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        state: { message },
        questions: {
          isNexyrium: { type: "noul", instructions: "This request is being made inside Nexyrium, a workspace and operations system. Does it belong to operating, understanding, planning, or improving that workspace or product? Treat requests about projects, tasks, employees or team members, workload or capacity, operations, risks, bottlenecks, deadlines, planning, workspace actions, automation events or alerts, CRM/workspace records, how Nexyrium works, or extending Nexyrium as Nexyrium-related even when the user does not say 'Nexyrium'. Examples that are Nexyrium-related: 'Who is overloaded?', 'Which projects are at risk?', 'Show me overdue tasks.', 'Create a task for Rahul.', 'How is risk calculated?', 'Should we integrate Slack?', and 'How do I use the automation system?'. General knowledge, arithmetic, unrelated programming, science, politics, weather, or other external topics are not Nexyrium-related." },
          capability: { type: "choice", instructions: "Classify this request in the context of Nexyrium, a workspace and operations system. Do not require the user to name Nexyrium: requests about workspace projects, tasks, people, operations, risks, plans, actions, automation, CRM data, or product use are in scope. Choose OUT_OF_SCOPE only for requests unrelated to operating, understanding, planning, or improving the Nexyrium workspace/product.", criteria: {
            PROJECT: "Project status, project details, project deadlines, or why a project is delayed", TASK: "Tasks, overdue tasks, task status, or task management", EMPLOYEE: "Employees, team members, workload, capacity, or who is overloaded", OPERATIONS: "Workspace operations summary, operational health, or current operational status", RISK: "Project risks, bottlenecks, risk calculation, or overdue work", PLANNING: "Planning remaining work or recommended operational plans", ACTION: "Proposing an action available in the workspace, such as creating a task", AUTOMATION: "Automation events, alerts, or use of the automation system", CRM: "CRM or other workspace records", HELP: "How to use a Nexyrium workspace feature", SYSTEM_EXPLANATION: "How Nexyrium calculates, decides, or otherwise works", PRODUCT_ADVICE: "Advice about extending, improving, or integrating with Nexyrium", GENERAL_CONVERSATION: "A general but workspace-relevant Nexyrium conversation", OUT_OF_SCOPE: "General knowledge or another topic that is not about the Nexyrium workspace or product",
          } },
        },
      }),
    });
    if (!response.ok) return finish({ allowed: false, reason: "unavailable", failureCategory: failureCategory(response.status) });
    const body: unknown = await response.json();
    const root = body && typeof body === "object" ? body as { model?: unknown; answers?: Record<string, RemoteAnswer>; usage?: { input_tokens?: unknown; inputTokens?: unknown; cost?: unknown } } : null;
    const scope = probability(root?.answers?.isNexyrium?.noul);
    const capability = root?.answers?.capability?.choice;
    const capabilityConfidence = probability(root?.answers?.capability?.confidence);
    const model = typeof root?.model === "string" ? root.model : MODEL;
    const inputTokens = numberValue(root?.usage?.input_tokens ?? root?.usage?.inputTokens);
    const estimatedCost = numberValue(root?.usage?.cost);
    if (scope === null || !isCapability(capability) || capabilityConfidence === null) return finish({ allowed: false, reason: "unavailable", failureCategory: "malformed_response", model, inputTokens, estimatedCost });
    const threshold = confidenceThreshold();
    if (capability === "OUT_OF_SCOPE" && capabilityConfidence >= threshold) return finish({ allowed: false, reason: "out_of_scope", scopeProbability: scope, capabilityConfidence, model, inputTokens, estimatedCost });
    if (scope < 1 - threshold) return finish({ allowed: false, reason: "out_of_scope", scopeProbability: scope, capabilityConfidence, model, inputTokens, estimatedCost });
    if (scope < threshold || capabilityConfidence < threshold) return finish({ allowed: false, reason: "uncertain", scopeProbability: scope, capabilityConfidence, model, inputTokens, estimatedCost });
    return finish({ allowed: true, capability: capability as Exclude<NexyriumCapability, "OUT_OF_SCOPE">, scopeProbability: scope, capabilityConfidence, model, inputTokens, estimatedCost });
  } catch {
    return finish({ allowed: false, reason: "unavailable", failureCategory: controller.signal.aborted ? "timeout" : "network" });
  } finally { clearTimeout(timer); }
}
