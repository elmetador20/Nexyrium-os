import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";

export async function serverRequireRole(allowedRoles: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile(supabase, user.id);
  if (!profile || profile.status !== "ACTIVE") {
    redirect(`/login?status=${profile?.status || "PENDING_APPROVAL"}`);
  }

  if (!allowedRoles.includes(profile.roleName || "")) {
    redirect("/unauthorized");
  }

  return { user, profile };
}
