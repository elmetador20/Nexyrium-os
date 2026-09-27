import { NextResponse } from "next/server";
import { runAutomationService } from "@/lib/automation/automation-service";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";
import { automationUnavailableResponse, isMissingAutomationTable } from "@/lib/server/reliability";

export const runtime = "nodejs";

async function evaluate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getUserProfile(supabase, user.id);
  if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!['SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER', 'PROJECT_MANAGER'].includes(profile.roleName || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json(await runAutomationService(supabase));
  } catch (error) {
    if (isMissingAutomationTable(error)) return automationUnavailableResponse();
    console.error("Automation evaluation failed", error);
    return NextResponse.json({ error: "Unable to evaluate operations." }, { status: 500 });
  }
}

export async function GET() { return evaluate(); }
export async function POST() { return evaluate(); }
