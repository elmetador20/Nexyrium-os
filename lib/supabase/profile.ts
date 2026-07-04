/**
 * Safely fetches the user profile and role definition without using nested Joins.
 * This prevents PostgREST schema cache desynchronization errors.
 */
export async function getUserProfile(supabase: any, userId: string) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("status, role_id, full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return null;
    }

    let roleName = null;
    if (profile.role_id) {
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("name")
        .eq("id", profile.role_id)
        .maybeSingle();
      
      if (!roleError && roleData) {
        roleName = roleData.name;
      }
    }

    return {
      status: profile.status,
      roleName,
      fullName: profile.full_name || null,
      avatarUrl: profile.avatar_url || null,
    };
  } catch (err) {
    console.error("Error in getUserProfile helper:", err);
    return null;
  }
}
