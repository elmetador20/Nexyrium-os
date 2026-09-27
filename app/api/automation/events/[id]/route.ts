import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";
import { automationUnavailableResponse, isMissingAutomationTable } from "@/lib/server/reliability";

const statuses = ["ACKNOWLEDGED", "DISMISSED", "RESOLVED"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { status } = await request.json();
    if (!statuses.includes(status)) return NextResponse.json({ error: "Unsupported event status." }, { status: 400 });
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = await getUserProfile(supabase, user.id);
    if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!['SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER', 'PROJECT_MANAGER'].includes(profile.roleName || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const timestamp = new Date().toISOString();
    const update = status === "ACKNOWLEDGED" ? { status, acknowledged_at: timestamp, acknowledged_by: user.id, updated_at: timestamp }
      : status === "DISMISSED" ? { status, dismissed_at: timestamp, dismissed_by: user.id, updated_at: timestamp }
      : { status, resolved_at: timestamp, updated_at: timestamp };
    const { data: event, error } = await supabase.from("automation_events").update(update).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    if (!event) return NextResponse.json({ error: "Automation event not found." }, { status: 404 });
    await supabase.from("activity_logs").insert({ id: crypto.randomUUID(), user_email: user.email || "system", action: `Automation Event ${status}`, details: `Automation event ${id} marked ${status}.`, ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Unknown", user_agent: request.headers.get("user-agent") || "Unknown", created_at: timestamp });
    return NextResponse.json({ success: true, event });
  } catch (error) {
    if (isMissingAutomationTable(error)) return automationUnavailableResponse();
    console.error("Automation event update failed", error);
    return NextResponse.json({ error: "Unable to update automation event." }, { status: 500 });
  }
}
