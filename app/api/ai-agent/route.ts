import { NextResponse } from "next/server";
import { runAgentRuntime } from "@/lib/ai-agent/agent-runtime";
import { addActionIds } from "@/lib/ai-agent/conversation-context";
import { validateTaskProposal } from "@/lib/ai-agent/task-actions";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";
import { enforceRateLimit, rateLimitedResponse, requestIdentity, safeErrorCategory } from "@/lib/server/reliability";
import { classifyNexyriumIntent, intentGuardrailResponse, jevGuardrailMode } from "@/lib/ai-agent/intent-guardrail";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = await getUserProfile(supabase, user.id);
    if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const retryAfter = enforceRateLimit(`ai-agent:${requestIdentity(request, user.id)}`, 20, 60_000);
    if (retryAfter) return rateLimitedResponse(retryAfter);
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });
    if (message.length > 4_000) return NextResponse.json({ error: "Please keep your message under 4,000 characters." }, { status: 400 });

    const requestId = crypto.randomUUID();
    const guardrail = await classifyNexyriumIntent(message);
    const guardrailMode = jevGuardrailMode();
    console.info("AI intent guardrail", { requestId, mode: guardrailMode, allowed: guardrail.allowed, capability: guardrail.allowed ? guardrail.capability : undefined, reason: guardrail.allowed ? undefined : guardrail.reason, scopeProbability: guardrail.allowed ? guardrail.scopeProbability : guardrail.scopeProbability, capabilityConfidence: guardrail.allowed ? guardrail.capabilityConfidence : guardrail.capabilityConfidence, latencyMs: guardrail.latencyMs, inputTokens: guardrail.inputTokens, estimatedCost: guardrail.estimatedCost, failureCategory: guardrail.allowed ? undefined : guardrail.failureCategory, groqInvoked: guardrailMode === "shadow" || guardrail.allowed });
    if (guardrailMode === "enforce" && !guardrail.allowed) return NextResponse.json({ answer: intentGuardrailResponse(guardrail) });

    const result = await runAgentRuntime({ message, history: body?.history, conversationContext: body?.conversation_context, mode: "production", context: { supabase, user, profile } });
    if (result.operationsPlan) {
      const proposedActions = [];
      for (const action of result.operationsPlan.actions) {
        const validation = await validateTaskProposal(supabase, user, profile, action.payload);
        if (!validation.payload) continue;
        const actionId = crypto.randomUUID();
        const { error } = await supabase.from("ai_agent_actions").insert({ action_id: actionId, user_id: user.id, action_type: "create_task", payload: validation.payload, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() });
        if (error) return NextResponse.json({ error: "Action plans are not available yet. Please contact an administrator to apply the AI action migration." }, { status: 503 });
        proposedActions.push({ ...action, action_id: actionId, payload: validation.payload });
      }
      return NextResponse.json({ type: "operations_plan_proposal", plan: { ...result.operationsPlan, actions: proposedActions }, conversation_context: addActionIds(result.conversationContext, proposedActions.map((action) => action.action_id)) });
    }
    if (result.actionProposal) {
      const actionId = crypto.randomUUID();
      const { payload } = result.actionProposal;
      const { error } = await supabase.from("ai_agent_actions").insert({ action_id: actionId, user_id: user.id, action_type: "create_task", payload, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() });
      if (error) return NextResponse.json({ error: "Task proposals are not available yet. Please contact an administrator to apply the AI action migration." }, { status: 503 });
      return NextResponse.json({ type: "task_creation_proposal", action: "create_task", action_id: actionId, project_id: payload.projectId, project_name: payload.projectName, task_name: payload.name, description: payload.description, department: payload.department, assigned_user: payload.assignedUserName, priority: payload.priority, deadline: payload.deadline, conversation_context: addActionIds(result.conversationContext, [actionId]) });
    }
    return NextResponse.json({ answer: result.answer || "I couldn't produce an answer.", conversation_context: result.conversationContext });
  } catch (error) {
    const category = safeErrorCategory(error);
    console.error("AI agent execution failed", { category, error: error instanceof Error ? error.message : "unknown" });
    const message = category === "timeout" ? "The AI request timed out. Please try again." : category === "rate_limited" ? "The AI service is busy. Please try again shortly." : category === "validation" ? "I couldn't safely process that request. Please clarify the details." : "The AI service is temporarily unavailable. Please try again.";
    return NextResponse.json({ error: message }, { status: category === "rate_limited" ? 429 : category === "validation" ? 400 : 502 });
  }
}
