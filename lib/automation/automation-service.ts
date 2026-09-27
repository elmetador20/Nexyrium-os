import { SupabaseClient } from "@supabase/supabase-js";
import { AutomationEvent } from "@/lib/automation/automation-engine";
import { evaluateCurrentOperations } from "@/lib/automation/evaluate-current-operations";

type StoredEvent = { id: string; event_key: string; status: string; severity: string; metadata: Record<string, unknown> };
type SummaryRow = { status: string; severity: string; first_detected_at: string; resolved_at: string | null };
const conditionKey = (event: AutomationEvent) => `${event.ruleId}:${event.entityType}:${event.entityId}`;

export async function runAutomationService(supabase: SupabaseClient) {
  const evaluation = await evaluateCurrentOperations(); // throws on incomplete data; never resolves events on failure
  const { data: stored, error: storedError } = await supabase.from("automation_events").select("id,event_key,status,severity,metadata");
  if (storedError) throw storedError;
  const existing = new Map((stored || []).map((event: StoredEvent) => [event.event_key, event]));
  const seen = new Set<string>();
  const newEvents: AutomationEvent[] = [], updatedEvents: AutomationEvent[] = [], resolvedEvents: StoredEvent[] = [];

  for (const event of evaluation.events) {
    const eventKey = conditionKey(event);
    seen.add(eventKey);
    const prior = existing.get(eventKey);
    const row = {
      rule_id: event.ruleId, event_type: event.type, severity: event.severity, title: event.title, description: event.description,
      entity_type: event.entityType, entity_id: event.entityId, project_id: event.projectId || null, user_id: event.userId || null,
      department: event.department || null, event_key: eventKey, detected_at: event.detectedAt, last_detected_at: event.detectedAt,
      metadata: { ...event.metadata, candidateId: event.id, previousSeverity: prior?.severity || null }, updated_at: event.detectedAt,
      // A resolved condition becoming true again is an active, new attention item. A dismissed event remains dismissed.
      ...(prior?.status === "RESOLVED" ? { status: "ACTIVE", resolved_at: null } : {}),
    };
    const { error } = await supabase.from("automation_events").upsert(row, { onConflict: "event_key" });
    if (error) throw error; // unique index makes concurrent invocations safe
    if (!prior || prior.status === "RESOLVED") newEvents.push(event);
    else updatedEvents.push(event);
  }

  for (const event of stored || []) {
    const item = event as StoredEvent;
    if (seen.has(item.event_key) || !["ACTIVE", "ACKNOWLEDGED"].includes(item.status)) continue;
    const { error } = await supabase.from("automation_events").update({ status: "RESOLVED", resolved_at: evaluation.evaluatedAt, updated_at: evaluation.evaluatedAt }).eq("id", item.id);
    if (error) throw error;
    resolvedEvents.push(item);
  }

  const { data: activeRows, error: activeError } = await supabase.from("automation_events").select("*").in("status", ["ACTIVE", "ACKNOWLEDGED"]).order("last_detected_at", { ascending: false });
  if (activeError) throw activeError;
  const activeEvents = activeRows || [];
  const summary = { total: activeEvents.length, critical: 0, high: 0, medium: 0, low: 0 };
  for (const event of activeEvents) summary[event.severity as keyof Omit<typeof summary, "total">]++;
  return { ...evaluation, newEvents, updatedEvents, resolvedEvents, activeEvents, summary };
}

export async function getDailyAutomationSummary(supabase: SupabaseClient, date = new Date().toISOString().slice(0, 10)) {
  const start = `${date}T00:00:00.000Z`, end = `${date}T23:59:59.999Z`;
  const { data, error } = await supabase.from("automation_events").select("status,severity,first_detected_at,resolved_at,metadata");
  if (error) throw error;
  const rows = data || [];
  const typedRows = rows as SummaryRow[];
  const active = typedRows.filter((row) => ["ACTIVE", "ACKNOWLEDGED"].includes(row.status));
  return {
    date, new: typedRows.filter((row) => row.first_detected_at >= start && row.first_detected_at <= end).length,
    resolved: typedRows.filter((row) => row.resolved_at && row.resolved_at >= start && row.resolved_at <= end).length,
    active: active.length, critical: active.filter((row) => row.severity === "critical").length,
    high: active.filter((row) => row.severity === "high").length, medium: active.filter((row) => row.severity === "medium").length,
    low: active.filter((row) => row.severity === "low").length,
  };
}

export async function getActiveAutomationEvents(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("automation_events").select("*").in("status", ["ACTIVE", "ACKNOWLEDGED"]).order("last_detected_at", { ascending: false });
  if (error) throw error;
  return { events: data || [], summary: await getDailyAutomationSummary(supabase) };
}
