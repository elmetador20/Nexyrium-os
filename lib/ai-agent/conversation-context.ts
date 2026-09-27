export type ConversationProject = { id: string; name: string; status?: string };
export type ConversationTask = { id: string; name: string; projectId?: string; department?: string };
export type ConversationUser = { id: string; name: string; role?: string };

export type ConversationContext = {
  projects: ConversationProject[];
  tasks: ConversationTask[];
  users: ConversationUser[];
  departments: string[];
  actionIds: string[];
};

export const EMPTY_CONVERSATION_CONTEXT: ConversationContext = {
  projects: [], tasks: [], users: [], departments: [], actionIds: [],
};

const LIMITS = { projects: 12, tasks: 12, users: 12, departments: 8, actionIds: 10 };

function text(value: unknown, max = 180) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function uniqueById<T extends { id: string }>(items: T[], limit: number) {
  return [...new Map(items.filter((item) => item.id).map((item) => [item.id, item])).values()].slice(-limit);
}

/** Sanitizes browser-held, short-term context. It is convenience data only. */
export function sanitizeConversationContext(value: unknown): ConversationContext {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const projects = Array.isArray(input.projects) ? input.projects.map((item) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const id = text(record.id); const name = text(record.name);
    return id && name ? { id, name, ...(text(record.status) ? { status: text(record.status)! } : {}) } : null;
  }).filter(Boolean) as ConversationProject[] : [];
  const tasks = Array.isArray(input.tasks) ? input.tasks.map((item) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const id = text(record.id); const name = text(record.name);
    return id && name ? { id, name, ...(text(record.projectId) ? { projectId: text(record.projectId)! } : {}), ...(text(record.department) ? { department: text(record.department)! } : {}) } : null;
  }).filter(Boolean) as ConversationTask[] : [];
  const users = Array.isArray(input.users) ? input.users.map((item) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const id = text(record.id); const name = text(record.name);
    return id && name ? { id, name, ...(text(record.role) ? { role: text(record.role)! } : {}) } : null;
  }).filter(Boolean) as ConversationUser[] : [];
  const departments = Array.isArray(input.departments) ? input.departments.map((item) => text(item)).filter(Boolean) as string[] : [];
  const actionIds = Array.isArray(input.actionIds) ? input.actionIds.map((item) => text(item)).filter(Boolean) as string[] : [];
  return {
    projects: uniqueById(projects, LIMITS.projects), tasks: uniqueById(tasks, LIMITS.tasks), users: uniqueById(users, LIMITS.users),
    departments: [...new Set(departments)].slice(-LIMITS.departments), actionIds: [...new Set(actionIds)].slice(-LIMITS.actionIds),
  };
}

function addProject(context: ConversationContext, record: Record<string, unknown>) {
  const id = text(record.id) || text(record.project_id); const name = text(record.name) || text(record.project_name);
  const status = text(record.status) || text(record.project_status);
  if (id && name) context.projects = uniqueById([...context.projects, { id, name, ...(status ? { status } : {}) }], LIMITS.projects);
}

function addTask(context: ConversationContext, record: Record<string, unknown>) {
  const id = text(record.id); const name = text(record.name);
  if (id && name) context.tasks = uniqueById([...context.tasks, { id, name, ...(text(record.project_id) ? { projectId: text(record.project_id)! } : {}), ...(text(record.department) ? { department: text(record.department)! } : {}) }], LIMITS.tasks);
}

function addUser(context: ConversationContext, record: Record<string, unknown>) {
  const id = text(record.userId) || text(record.employee_id) || text(record.id);
  const name = text(record.fullName) || text(record.employee_name) || text(record.name);
  if (id && name) context.users = uniqueById([...context.users, { id, name, ...(text(record.roleName) || text(record.role) ? { role: text(record.roleName) || text(record.role)! } : {}) }], LIMITS.users);
}

/** Extracts only entities explicitly present in tool output. */
export function mergeToolResultContext(current: ConversationContext, result: unknown): ConversationContext {
  const context = sanitizeConversationContext(current);
  if (Array.isArray(result)) {
    for (const item of result) if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      if (text(record.userId) || text(record.employee_id)) addUser(context, record);
      else addProject(context, record);
    }
    return context;
  }
  const record = result && typeof result === "object" ? result as Record<string, unknown> : {};
  const projectLists = [record.projects, record.risks];
  for (const list of projectLists) if (Array.isArray(list)) for (const item of list) if (item && typeof item === "object") addProject(context, item as Record<string, unknown>);
  if (record.project && typeof record.project === "object") addProject(context, record.project as Record<string, unknown>);
  if (Array.isArray(record.tasks)) for (const item of record.tasks) if (item && typeof item === "object") addTask(context, item as Record<string, unknown>);
  for (const list of [record.workloads, record.capacity]) if (Array.isArray(list)) for (const item of list) if (item && typeof item === "object") addUser(context, item as Record<string, unknown>);
  if (Array.isArray(record.events)) for (const item of record.events) {
    if (!item || typeof item !== "object") continue;
    const event = item as Record<string, unknown>;
    const metadata = event.metadata && typeof event.metadata === "object" ? event.metadata as Record<string, unknown> : {};
    if (event.entityType === "project" && text(event.projectId) && text(metadata.projectName)) {
      addProject(context, { id: event.projectId, name: metadata.projectName });
    }
    if (event.entityType === "employee" && text(event.userId) && text(metadata.employeeName)) {
      addUser(context, { userId: event.userId, fullName: metadata.employeeName, roleName: metadata.role });
    }
    const department = text(event.department);
    if (department) context.departments = [...new Set([...context.departments, department])].slice(-LIMITS.departments);
  }
  if (Array.isArray(record.bottlenecks)) for (const item of record.bottlenecks) {
    if (item && typeof item === "object") {
      const department = text((item as Record<string, unknown>).department);
      if (department) context.departments = [...new Set([...context.departments, department])].slice(-LIMITS.departments);
    }
  }
  return context;
}

export function addActionIds(current: ConversationContext, actionIds: string[]) {
  const context = sanitizeConversationContext(current);
  context.actionIds = [...new Set([...context.actionIds, ...actionIds.filter(Boolean)])].slice(-LIMITS.actionIds);
  return context;
}
