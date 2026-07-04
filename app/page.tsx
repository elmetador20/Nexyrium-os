import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/supabase/profile";

export default async function HomePage() {
  const supabase = await createClient();

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, redirect to login
  if (!user) {
    redirect("/login");
  }

  try {
    // Query profile and role using our secure helper
    const profile = await getUserProfile(supabase, user.id);

    const roleName = profile?.roleName;
    const status = profile?.status;

    // If status is not active, the middleware handles the logout,
    // but we can double-safe check here.
    if (!profile || status !== "ACTIVE") {
      redirect(`/login?status=${status || "PENDING_APPROVAL"}`);
    }

    // Role routes
    const roleRoutes: Record<string, string> = {
      SUPER_ADMIN: "/dashboard/admin",
      CEO: "/dashboard/ceo",
      OPERATIONS_MANAGER: "/dashboard/operations",
      PROJECT_MANAGER: "/dashboard/projects",
      RESEARCHER: "/dashboard/research",
      CONTENT_WRITER: "/dashboard/content",
      DESIGNER: "/dashboard/design",
      QA: "/dashboard/qa",
      FINANCE: "/dashboard/finance",
      CLIENT: "/dashboard/client",
    };

    const targetRoute = roleRoutes[roleName] || "/unauthorized";
    redirect(targetRoute);
  } catch (err) {
    console.error("HomePage redirect error:", err);
    // If table query fails (e.g. before schema is seeded), redirect to login
    redirect("/login");
  }
}
