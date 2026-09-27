import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";
import { validateTaskProposal } from "@/lib/ai-agent/task-actions";

export const runtime = "nodejs";

function safeError(error: unknown) {
  console.error("AI task action failed", error);
  return "I couldn't create the task. Please try again.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actionId = typeof body?.action_id === "string" ? body.action_id : "";
    if (!actionId) return NextResponse.json({ error: "An action ID is required." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = await getUserProfile(supabase, user.id);
    if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: action, error: actionError } = await supabase
      .from("ai_agent_actions")
      .select("action_id, action_type, payload, status, task_id, expires_at")
      .eq("action_id", actionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (actionError || !action || action.action_type !== "create_task") {
      return NextResponse.json({ error: "This task proposal is no longer available." }, { status: 404 });
    }
    if (action.status === "SUCCEEDED") {
      return NextResponse.json({ success: true, duplicate: true, task_id: action.task_id, message: "Task was already created." });
    }
    if (action.status === "CANCELLED") return NextResponse.json({ error: "This task proposal was cancelled." }, { status: 409 });
    if (new Date(action.expires_at).getTime() <= Date.now()) {
      await supabase.from("ai_agent_actions").update({ status: "CANCELLED", failure_reason: "Proposal expired" }).eq("action_id", actionId).eq("user_id", user.id).eq("status", "PENDING");
      return NextResponse.json({ error: "This task proposal has expired. Please ask Nexyrium AI again." }, { status: 410 });
    }

    // Claim the action before inserting. The conditional update makes a double
    // click/retry harmless: only one request can transition PENDING to PROCESSING.
    const { data: claimed, error: claimError } = await supabase
      .from("ai_agent_actions")
      .update({ status: "PROCESSING" })
      .eq("action_id", actionId)
      .eq("user_id", user.id)
      .eq("status", "PENDING")
      .select("action_id")
      .maybeSingle();
    if (claimError) return NextResponse.json({ error: safeError(claimError) }, { status: 500 });
    if (!claimed) {
      const { data: latest } = await supabase.from("ai_agent_actions").select("status, task_id").eq("action_id", actionId).eq("user_id", user.id).maybeSingle();
      if (latest?.status === "SUCCEEDED") return NextResponse.json({ success: true, duplicate: true, task_id: latest.task_id, message: "Task was already created." });
      return NextResponse.json({ error: "This approval is already being processed. Please wait a moment." }, { status: 409 });
    }

    const { payload, error: validationError } = await validateTaskProposal(supabase, user, profile, {
      project_id: action.payload.projectId,
      name: action.payload.name,
      description: action.payload.description,
      department: action.payload.department,
      assigned_user_id: action.payload.assignedUserId,
      priority: action.payload.priority,
      deadline: action.payload.deadline,
    });
    if (validationError || !payload) {
      await supabase.from("ai_agent_actions").update({ status: "FAILED", failure_reason: validationError || "Validation failed" }).eq("action_id", actionId);
      return NextResponse.json({ error: validationError || "The proposal is no longer valid." }, { status: 400 });
    }

    const taskId = crypto.randomUUID();
    const { error: insertError } = await supabase.from("tasks").insert({
      id: taskId, project_id: payload.projectId, name: payload.name, description: payload.description,
      department: payload.department, assigned_user_id: payload.assignedUserId, priority: payload.priority,
      status: "To Do", estimated_hours: 0, deadline: payload.deadline,
    });
    if (insertError) throw insertError;

    const { data: task, error: verifyError } = await supabase.from("tasks")
      .select("id, name, project_id, assigned_user_id, deadline").eq("id", taskId).maybeSingle();
    if (verifyError || !task) throw verifyError || new Error("Task verification failed");

    const { error: completionError } = await supabase.from("ai_agent_actions").update({
      status: "SUCCEEDED", task_id: task.id, executed_at: new Date().toISOString(), failure_reason: null,
    }).eq("action_id", actionId).eq("user_id", user.id);
    if (completionError) throw completionError;

    // Reuse the existing audit mechanism. Failure here is logged server-side but
    // never changes the confirmed task result.
    const { error: auditError } = await supabase.from("activity_logs").insert({
      id: crypto.randomUUID(), user_email: user.email || "system", action: "AI Task Created",
      details: JSON.stringify({ action_id: actionId, action: "create_task", status: "success", task_id: task.id, project_id: payload.projectId }),
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Unknown",
      user_agent: request.headers.get("user-agent") || "Unknown Agent", created_at: new Date().toISOString(),
    });
    if (auditError) console.error("AI task audit log failed", auditError);

    return NextResponse.json({ success: true, task_id: task.id, task_name: task.name, project_name: payload.projectName, assigned_user: payload.assignedUserName, deadline: task.deadline });
  } catch (error) {
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
}
