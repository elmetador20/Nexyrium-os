import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";

export async function POST(request: Request) {
  try {
    const { action_id: actionId } = await request.json();
    if (typeof actionId !== "string") return NextResponse.json({ error: "An action ID is required." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = await getUserProfile(supabase, user.id);
    if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase.from("ai_agent_actions").update({ status: "CANCELLED" })
      .eq("action_id", actionId).eq("user_id", user.id).eq("status", "PENDING").select("action_id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "This proposal can no longer be cancelled." }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AI task cancellation failed", error);
    return NextResponse.json({ error: "I couldn't cancel that proposal." }, { status: 500 });
  }
}
