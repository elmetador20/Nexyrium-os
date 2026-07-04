"use client";

import React, { useState } from "react";
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  ArrowRight,
  TrendingUp,
  Briefcase,
  Layers,
  X
} from "lucide-react";
import { Task, Project, TaskStatus, ProjectPriority } from "../types";
import { createTaskAction, updateTaskStatusAction } from "../../../app/actions/projects";

interface TasksViewProps {
  initialTasks: Task[];
  initialProjects: Project[];
  allUsers: any[];
  userRole: string;
}

export function TasksView({
  initialTasks,
  initialProjects,
  allUsers,
  userRole
}: TasksViewProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Filter tasks based on user role
  const filteredTasks = tasks.filter((t) => {
    // Admin, PM, CEO, and Operations see everything
    if (["SUPER_ADMIN", "PROJECT_MANAGER", "CEO", "OPERATIONS_MANAGER"].includes(userRole)) {
      return true;
    }
    // Contributors only see tasks for their department
    if (userRole === "DESIGNER") {
      return t.department === "Design";
    }
    if (userRole === "RESEARCHER") {
      return t.department === "Research";
    }
    if (userRole === "CONTENT_WRITER") {
      return t.department === "Content Writing";
    }
    if (userRole === "QA") {
      return t.department === "QA";
    }
    return false;
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleUpdateStatus = async (id: string, nextStatus: TaskStatus) => {
    const res = await updateTaskStatusAction(id, nextStatus);
    if (res.success) {
      showToast(`Task moved to: ${nextStatus}`);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const projectId = formData.get("projectId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const department = formData.get("department") as string;
    const assignedUserId = formData.get("assignedUserId") as string;
    const priority = formData.get("priority") as ProjectPriority;
    const deadline = formData.get("deadline") as string;
    const estimatedHours = Number(formData.get("estimatedHours") || 0);

    const res = await createTaskAction(projectId, {
      name,
      description,
      department,
      assignedUserId: assignedUserId || null,
      priority,
      deadline,
      estimatedHours
    });

    setIsSubmitting(false);

    if (res.success) {
      showToast("Operations task assigned successfully.");
      setIsCreateOpen(false);
      
      // Reload mock tasks locally for demonstration
      const newTask: Task = {
        id: `task-${Math.random()}`,
        project_id: projectId,
        name,
        description,
        department,
        assigned_user_id: assignedUserId || null,
        assigned_user: allUsers.find(u => u.id === assignedUserId) || null,
        priority,
        status: "To Do",
        estimated_hours: estimatedHours,
        deadline: deadline || null,
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTasks(prev => [...prev, newTask]);
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const columns: TaskStatus[] = ["To Do", "In Progress", "Review", "Completed"];

  return (
    <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto select-none bg-zinc-950 text-white min-h-screen text-xs">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-black text-xs px-5 py-4 rounded-xl shadow-2xl font-bold border border-amber-400 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4.5 w-4.5 text-black" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Operational Tickets</span>
          <h2 className="text-page-title text-white mt-1">Operational Tasks</h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">Distribute detailed technical checklists across Research, Content, and Design departments.</p>
        </div>

        {["SUPER_ADMIN", "PROJECT_MANAGER", "CEO", "OPERATIONS_MANAGER"].includes(userRole) && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Kanban Grid */}
      <div className="grid gap-5 md:grid-cols-4 select-none">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col);
          return (
            <div key={col} className="border border-zinc-700 bg-zinc-900 p-5 rounded-2xl flex flex-col min-h-[480px] shadow-xl">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4 shrink-0">
                <span className="font-extrabold text-white uppercase text-[10px] tracking-wider font-mono">{col}</span>
                <span className="px-2.5 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 font-mono font-bold rounded-lg">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-3.5 overflow-y-auto pr-1.5 custom-scrollbar">
                {colTasks.map((task) => (
                  <div key={task.id} className="p-4.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3.5 hover:border-zinc-550 transition duration-150">
                    <div className="space-y-1.5">
                      <span className="font-bold text-zinc-200 leading-tight block">{task.name}</span>
                      <p className="text-[10px] text-zinc-450 leading-relaxed">{task.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-[9px] border-t border-zinc-850 pt-3 font-mono font-semibold uppercase">
                      <span className="text-zinc-500 font-bold">{task.department}</span>
                      <span className={`px-2 py-0.5 rounded-lg border ${
                        task.priority === "URGENT"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : task.priority === "HIGH"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                      }`}>{task.priority}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-850">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <User className="h-4 w-4 text-zinc-605" />
                        <span className="text-[10px] font-semibold truncate max-w-[90px]">
                          {task.assigned_user?.fullName || "Unassigned"}
                        </span>
                      </div>

                      {/* Quick stage transition button */}
                      {col !== "Completed" && (
                        <button
                          onClick={() => {
                            const stages: TaskStatus[] = ["To Do", "In Progress", "Review", "Completed"];
                            const next = stages[stages.indexOf(col) + 1];
                            handleUpdateStatus(task.id, next);
                          }}
                          className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition cursor-pointer"
                          title="Advance stage"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="py-12 text-center text-zinc-600 text-[10px] border border-dashed border-zinc-800 rounded-xl select-none font-bold uppercase tracking-wider font-mono">
                    Empty.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Creator Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <span className="font-bold text-sm font-mono uppercase tracking-wider text-white">Create Operational Task</span>
              <button onClick={() => setIsCreateOpen(false)} className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-8 overflow-y-auto space-y-6 custom-scrollbar text-xs">
              
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Client Project</label>
                  <select name="projectId" required className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none cursor-pointer focus:border-amber-500 transition">
                    {initialProjects.map(p => (
                      <option key={p.id} value={p.id} className="bg-zinc-900">{p.startup_name} - {p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Task Title *</label>
                  <input type="text" name="name" required placeholder="e.g. Conduct Pachama competitive analysis" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Department</label>
                  <select name="department" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none cursor-pointer focus:border-amber-500 transition">
                    <option value="Research" className="bg-zinc-900">Research</option>
                    <option value="Content Writing" className="bg-zinc-900">Content Writing</option>
                    <option value="Design" className="bg-zinc-900">Design</option>
                    <option value="QA" className="bg-zinc-900">QA</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Assign To</label>
                  <select name="assignedUserId" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none cursor-pointer focus:border-amber-500 transition">
                    <option value="" className="bg-zinc-900">Unassigned</option>
                    {allUsers.filter(u => u.roleName !== "CLIENT").map(u => (
                      <option key={u.id} value={u.id} className="bg-zinc-900">{u.fullName} ({u.roleName})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Priority</label>
                  <select name="priority" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none cursor-pointer focus:border-amber-500 transition">
                    <option value="LOW" className="bg-zinc-900">LOW</option>
                    <option value="MEDIUM" className="bg-zinc-900">MEDIUM</option>
                    <option value="HIGH" className="bg-zinc-900">HIGH</option>
                    <option value="URGENT" className="bg-zinc-900">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Task Deadline</label>
                  <input type="date" name="deadline" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none cursor-pointer focus:border-amber-500 transition" />
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Estimated Effort (Hours)</label>
                  <input type="number" name="estimatedHours" placeholder="e.g. 5" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Task Directive Description</label>
                <textarea name="description" rows={3} placeholder="Paste precise guidelines for execution..." className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none resize-none focus:border-amber-500 transition" />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4.5 py-2.5 border border-zinc-700 hover:bg-zinc-805 text-zinc-400 rounded-xl font-bold transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl transition cursor-pointer text-xs"
                >
                  {isSubmitting ? "Assigning..." : "Assign Task"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
