import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";
import { getActiveAutomationEvents } from "@/lib/automation/automation-service";
import { automationUnavailableResponse, isMissingAutomationTable } from "@/lib/server/reliability";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = await getUserProfile(supabase, user.id);
    if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!['SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER', 'PROJECT_MANAGER'].includes(profile.roleName || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(await getActiveAutomationEvents(supabase));
  } catch (error) {
    if (isMissingAutomationTable(error)) return automationUnavailableResponse();
    console.error("Automation event history failed", error);
    return NextResponse.json({ error: "Unable to load automation events." }, { status: 500 });
  }
}
