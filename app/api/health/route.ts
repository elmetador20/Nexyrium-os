import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMissingAutomationTable } from "@/lib/server/reliability";

export async function GET() {
  let supabase: "ok" | "unavailable" = "ok";
  let automationPersistence: "ok" | "migration_required" | "unavailable" = "ok";
  try {
    const client = await createClient();
    const { error } = await client.from("automation_events").select("id", { head: true, count: "exact" }).limit(1);
    if (error) { supabase = "unavailable"; automationPersistence = isMissingAutomationTable(error) ? "migration_required" : "unavailable"; }
  } catch { supabase = "unavailable"; automationPersistence = "unavailable"; }
  return NextResponse.json({ application: "ok", supabase, groq: process.env.GROQ_API_KEY ? "configured" : "not_configured", langsmith: process.env.LANGSMITH_TRACING === "true" && process.env.LANGSMITH_API_KEY ? "configured" : "not_configured", automationPersistence, voice: "browser_dependent" }, { status: supabase === "ok" || automationPersistence === "migration_required" ? 200 : 503 });
}
