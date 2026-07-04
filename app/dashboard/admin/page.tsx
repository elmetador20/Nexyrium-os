import { getUserProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminDashboardContent } from "@/features/admin/components/admin-dashboard-content";
import { getUsersAction, getRolesAction, getAdminStatsAction } from "@/app/actions/admin";
import type { Metadata } from "next";
import { UserProfile, Role, DashboardStats } from "@/features/admin/types";

export const metadata: Metadata = {
  title: "Super Admin Command Center | NexyriumOS",
  description: "Linear/Stripe inspired administrative command console for NexyriumOS.",
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  // Get active session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile and verify Super Admin role on the server (100% Secure)
  const profile = await getUserProfile(supabase, user.id);
  const roleName = profile?.roleName;

  if (roleName !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  // Pre-fetch initial page datasets
  const usersResponse = await getUsersAction();
  const rolesResponse = await getRolesAction();
  const statsResponse = await getAdminStatsAction();

  const initialUsers = (usersResponse.success ? usersResponse.users : []) as UserProfile[];
  const initialRoles = (rolesResponse.success ? rolesResponse.roles : []) as Role[];
  
  const initialStats: DashboardStats = statsResponse.success 
    ? (statsResponse.stats as DashboardStats)
    : {
        totalClients: 0,
        activeProjects: 0,
        projectsDueToday: 0,
        projectsDelayed: 0,
        revenueThisMonth: 0,
        pendingPayments: 0,
        pendingUserApprovals: 0,
        totalEmployees: 0,
        avgCompletionTime: "N/A",
        teamUtilization: 0,
        monthlyRevenue: [],
        projectStatusDistribution: [],
        departmentProductivity: [],
        recentActivities: [],
      };

  return (
    <AdminDashboardContent
      email={user.email!}
      role={roleName}
      initialUsers={initialUsers}
      initialRoles={initialRoles}
      initialStats={initialStats}
    />
  );
}
