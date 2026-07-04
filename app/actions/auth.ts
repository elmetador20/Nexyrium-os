"use server";


import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, LoginInput, SignupInput } from "@/lib/schemas/auth";
import { getUserProfile } from "@/lib/supabase/profile";

/**
 * Log in Action
 */
export async function loginAction(values: LoginInput) {
  // Validate input
  const validation = loginSchema.safeParse(values);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const supabase = await createClient();

  // Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (authError) {
    return { error: authError.message };
  }

  const userId = authData.user.id;

  try {
    // Read the user profile and role from the database using our secure joinless helper
    const profile = await getUserProfile(supabase, userId);

    if (!profile) {
      // If no profile row exists, sign the user out and show pending/no account error
      await supabase.auth.signOut();
      return {
        error: "Your user profile could not be found. Please contact the administrator.",
      };
    }

    const status = profile.status;
    const roleName = profile.roleName;

    // Handle account status checks
    if (status === "PENDING_APPROVAL") {
      await supabase.auth.signOut();
      return {
        status: "PENDING_APPROVAL",
        error:
          "Your account has been created successfully and is awaiting administrator approval. You will receive access once your account has been approved.",
      };
    }

    if (status === "REJECTED") {
      await supabase.auth.signOut();
      return {
        status: "REJECTED",
        error: "Your account request has been declined. Please contact the administrator for more information.",
      };
    }

    if (status === "SUSPENDED") {
      await supabase.auth.signOut();
      return {
        status: "SUSPENDED",
        error: "Your account has been temporarily suspended. Please contact your administrator.",
      };
    }

    // Account is ACTIVE, return role-specific redirect path
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

    return { success: true, redirectUrl: targetRoute };
  } catch (err: any) {
    console.error("Database auth check error:", err);
    await supabase.auth.signOut();
    return { error: "An unexpected database error occurred during login. Please try again." };
  }
}

/**
 * Sign up Action
 */
export async function signupAction(values: SignupInput) {
  // Validate input
  const validation = signupSchema.safeParse(values);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const supabase = await createClient();

  // Create authentication user in Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        role_name: values.role, // store requested role in auth metadata, read by DB trigger
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // Note: The SQL trigger 'on_auth_user_created' automatically handles the
  // creation of the public.users record with the requested role and PENDING_APPROVAL status.
  // We can return a success indicator to the frontend.
  return {
    success: true,
    email: values.email,
    needsEmailConfirmation: authData.user?.identities?.length === 0 || !authData.session,
  };
}

/**
 * Log out Action
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}
