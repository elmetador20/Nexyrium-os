import { ProjectPriority } from "@/features/project-management/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const TASK_CREATOR_ROLES = ["SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER", "PROJECT_MANAGER"] as const;

export type TaskProposalPayload = {
  projectId: string;
  projectName: string;
  name: string;
  description: string;
  department: string;
  assignedUserId: string;
  assignedUserName: string;
  priority: ProjectPriority;
  deadline: string | null;
};

function isProjectMember(project: Record<string, unknown>, userId: string) {
  return ["client_id", "project_manager_id", "researcher_id", "content_writer_id", "designer_id", "qa_id"]
    .some((field) => project[field] === userId);
}

export function isValidDeadline(deadline: unknown): deadline is string {
  if (typeof deadline !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return false;
  const date = new Date(`${deadline}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === deadline;
}

export async function validateTaskProposal(
  supabase: SupabaseClient,
  user: { id: string },
  profile: { roleName?: string | null },
  input: Record<string, unknown>,
): Promise<{ payload?: TaskProposalPayload; error?: string }> {
  if (!TASK_CREATOR_ROLES.includes(profile.roleName as typeof TASK_CREATOR_ROLES[number])) {
    return { error: "Your role is not allowed to create tasks." };
  }

  const projectId = typeof input.project_id === "string" ? input.project_id.trim() : "";
  const assignedUserId = typeof input.assigned_user_id === "string" ? input.assigned_user_id.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const department = typeof input.department === "string" ? input.department.trim() : "";
  const priority = typeof input.priority === "string" ? input.priority.toUpperCase() : "";
  const deadline = input.deadline == null || input.deadline === "" ? null : input.deadline;

  if (!projectId || !assignedUserId || !name || !department || !TASK_PRIORITIES.includes(priority as ProjectPriority)) {
    return { error: "A task needs a project, name, assignee, department, and a valid priority before it can be proposed." };
  }
  if (name.length > 250 || description.length > 5000 || department.length > 100) {
    return { error: "One or more task fields are too long." };
  }
  if (deadline !== null && !isValidDeadline(deadline)) {
    return { error: "The deadline must be a real date in YYYY-MM-DD format." };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, client_id, project_manager_id, researcher_id, content_writer_id, designer_id, qa_id")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError || !project) return { error: "I couldn't find the selected project." };
  if (!TASK_CREATOR_ROLES.includes(profile.roleName as typeof TASK_CREATOR_ROLES[number]) && !isProjectMember(project, user.id)) {
    return { error: "You do not have access to the selected project." };
  }

  const { data: assignee, error: assigneeError } = await supabase
    .from("users")
    .select("id, full_name, email, status")
    .eq("id", assignedUserId)
    .maybeSingle();
  if (assigneeError || !assignee || assignee.status !== "ACTIVE") {
    return { error: "I couldn't find an active employee for the selected assignee." };
  }

  return {
    payload: {
      projectId: project.id,
      projectName: project.name,
      name,
      description,
      department,
      assignedUserId: assignee.id,
      assignedUserName: assignee.full_name || assignee.email || "Assigned user",
      priority: priority as ProjectPriority,
      deadline,
    },
  };
}
