export const ROLE_HIERARCHY: Record<string, number> = {
  "SUPER_ADMIN": 100,
  "CEO": 90,
  "OPERATIONS_MANAGER": 80,
  "PROJECT_MANAGER": 70,
  "RESEARCHER": 50,
  "CONTENT_WRITER": 50,
  "DESIGNER": 50,
  "QA": 50,
  "FINANCE": 50,
  "CLIENT": 10
};

export function isAdminOrManager(role?: string): boolean {
  if (!role) return false;
  return ["SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER", "PROJECT_MANAGER"].includes(role);
}

export function canEditDepartmentWorkspace(
  role?: string, 
  department?: "research" | "content" | "design" | "qa"
): boolean {
  if (!role) return false;
  if (["SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER", "PROJECT_MANAGER"].includes(role)) {
    return true;
  }
  
  if (department === "research" && role === "RESEARCHER") return true;
  if (department === "content" && role === "CONTENT_WRITER") return true;
  if (department === "design" && role === "DESIGNER") return true;
  if (department === "qa" && role === "QA") return true;
  
  return false;
}
