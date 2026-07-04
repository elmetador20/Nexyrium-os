import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserProfile } from "./lib/supabase/profile";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // 2. Handle public vs protected paths
  const isAuthPage = path === "/login" || path === "/signup";
  const isDashboardPage = path.startsWith("/dashboard");
  const isRootPage = path === "/";

  if (user) {
    try {
      // Fetch profile and role name by joining the roles table
      const profile = await getUserProfile(supabase, user.id);

      const roleName = profile?.roleName;
      const status = profile?.status;

      // Force sign out if no profile exists or status is not ACTIVE
      if (!profile || status !== "ACTIVE") {
        const statusParam = status || "PENDING_APPROVAL";
        const redirectRes = NextResponse.redirect(
          new URL(`/login?status=${statusParam}`, req.url)
        );

        // Clear cookies to delete session tokens
        redirectRes.cookies.delete("sb-access-token");
        redirectRes.cookies.delete("sb-refresh-token");

        // Also call signOut in the background
        await supabase.auth.signOut();

        return redirectRes;
      }

      // Role-to-dashboard mappings
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

      const targetRoute = roleRoutes[roleName];

      // Redirect authenticated active user to their dashboard if on auth pages or root
      if (isAuthPage || isRootPage) {
        if (targetRoute) {
          return NextResponse.redirect(new URL(targetRoute, req.url));
        }
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }

      // Redirect from bare '/dashboard' or '/dashboard/' to the role's default dashboard route
      if (path === "/dashboard" || path === "/dashboard/") {
        if (targetRoute) {
          return NextResponse.redirect(new URL(targetRoute, req.url));
        }
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    } catch (err) {
      console.error("Middleware error fetching user details:", err);
    }
  } else {
    // If not logged in:
    // Redirect to login if trying to access dashboard
    if (isDashboardPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // Redirect root to login
    if (isRootPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - next.svg, vercel.svg (default asset logos)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)",
  ],
};
