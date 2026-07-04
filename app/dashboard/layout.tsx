import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";
import { DashboardShell } from "@/features/project-management/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Verify session authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch verified profile role name
  const profile = await getUserProfile(supabase, user.id);
  if (!profile || profile.status !== "ACTIVE") {
    redirect("/unauthorized");
  }

  return (
    <DashboardShell
      userRole={profile.roleName || "CLIENT"}
      userEmail={user.email || ""}
      userName={profile.fullName || user.email || ""}
    >
      {children}
    </DashboardShell>
  );
}
