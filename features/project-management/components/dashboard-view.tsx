"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Plus, 
  Users, 
  CheckSquare, 
  FolderGit2, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  ClipboardList,
  UserCheck,
  Zap,
  Activity,
  AlertCircle
} from "lucide-react";
import { ProjectDashboardData, Project, Task, TimelineEvent, EmployeeWorkload } from "../types";
import { CreateProjectModal } from "./create-project-modal";
import { getEmployeeWorkloadAction, updateProjectAction } from "../../../app/actions/projects";
import { formatFriendlyDate } from "../utils/date";
import { CountUp } from "@/components/ui/count-up";

interface DashboardViewProps {
  initialData: ProjectDashboardData;
  userRole: string;
  userId: string;
  allUsers: any[];
  allRoles: any[];
}

export function DashboardView({
  initialData,
  userRole,
  userId,
  allUsers
}: DashboardViewProps) {
  const router = useRouter();
  const [data, setData] = useState<ProjectDashboardData>(initialData);
  const [activeTab, setActiveTab] = useState<"center" | "workload" | "deadlines">("center");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [workloads, setWorkloads] = useState<EmployeeWorkload[]>([]);
  const [toastMsg, setToastMsg] = useState("");
  const [loadingWorkload, setLoadingWorkload] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    if (activeTab === "workload") {
      fetchWorkloads();
    }
  }, [activeTab]);

  const fetchWorkloads = async () => {
    setLoadingWorkload(true);
    try {
      const res = await getEmployeeWorkloadAction();
      if (res.success && res.workloads) {
        setWorkloads(res.workloads);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWorkload(false);
    }
  };

  const handleCreateProject = async (values: any) => {
    const { createProjectAction } = await import("../../../app/actions/projects");
    const res = await createProjectAction({
      name: values.name,
      startupName: values.startupName,
      clientId: values.clientId || null,
      serviceType: values.serviceType,
      priority: values.priority,
      description: values.description,
      deadline: values.deadline,
      projectManagerId: values.projectManagerId || null,
      researcherId: values.researcherId || null,
      contentWriterId: values.contentWriterId || null,
      designerId: values.designerId || null,
      qaId: values.qaId || null,
      notes: values.notes
    });

    if (res.success) {
      showToast(`Engagement "${values.name}" launched successfully!`);
      setIsCreateOpen(false);
      
      const { getProjectDashboardAction } = await import("../../../app/actions/projects");
      const updated = await getProjectDashboardAction();
      if (updated.success && updated.data) {
        setData(updated.data);
      }
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const { stats, projects, tasks, recentActivities } = data;

  // Deadline Tracker Risk Calculation helper
  const calculateDeadlineRisk = (deadlineStr: string | null) => {
    if (!deadlineStr) return { label: "No Deadline", color: "text-zinc-500 bg-zinc-900 border-zinc-800", days: 999 };
    const dl = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = dl.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 365.25/365 * 24 * 3600));

    if (days < 0) {
      return { label: "Overdue", color: "text-red-500 bg-red-950/20 border-red-800/30", days };
    } else if (days === 0 || days === 1) {
      return { label: "Critical", color: "text-amber-500 bg-amber-950/20 border-amber-800/30 animate-pulse", days };
    } else if (days <= 3) {
      return { label: "At Risk", color: "text-orange-400 bg-orange-950/20 border-orange-800/20", days };
    } else {
      return { label: "On Track", color: "text-emerald-500 bg-emerald-950/20 border-emerald-950/40", days };
    }
  };

  // Find alternative employee suggestion
  const getAlternativeEmployee = (overloadedRole: string, currentId: string) => {
    const list = workloads.filter(w => w.roleName === overloadedRole && w.userId !== currentId && !w.isOverloaded);
    if (list.length > 0) {
      // Return the one with lowest capacity
      return list.sort((a, b) => a.capacityLoad - b.capacityLoad)[0];
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-10 max-w-7xl mx-auto select-none bg-zinc-950 text-white min-h-screen">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-black text-xs px-5 py-4 rounded-xl shadow-2xl font-bold border border-amber-400 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-4.5 w-4.5 text-black" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Panel with Gold Accents */}
      <div className="border border-zinc-700 bg-zinc-900 p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">Nexyrium Command Console</span>
          <h2 className="text-page-title text-white">
            Operations Workspace
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-xl">
            Complete management suite for startup pipeline tracks, employee capacity, and delivery review.
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition shadow-[0_0_20px_rgba(245,179,1,0.15)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            <span>Launch Project</span>
          </button>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-zinc-700 text-xs gap-1.5">
        {[
          { id: "center", label: "Command Center", icon: Activity },
          { id: "workload", label: "Employee Workload Matrix", icon: Users },
          { id: "deadlines", label: "Operations Deadline Tracker", icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold cursor-pointer transition-all ${
                isActive 
                  ? "border-amber-500 text-amber-500 bg-zinc-900/40" 
                  : "border-transparent text-zinc-550 hover:text-zinc-300 hover:bg-zinc-900/10"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: COMMAND CENTER */}
      {activeTab === "center" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* KPI Metrics */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 text-xs">
            {[
              { label: "Active Projects", val: stats.activeProjects, icon: FolderGit2, color: "text-amber-500 border-t-amber-500", isNumber: true },
              { label: "Due Today", val: stats.projectsDueToday, icon: Clock, color: "text-orange-500 border-t-orange-500", isNumber: true },
              { label: "Delayed Milestones", val: stats.delayedProjects, icon: AlertTriangle, color: "text-red-500 border-t-red-500", isNumber: true },
              { label: "Completed (Week)", val: stats.completedThisWeek, icon: CheckCircle2, color: "text-emerald-500 border-t-emerald-500", isNumber: true },
              { label: "Avg Delivery speed", val: stats.averageDeliveryTime, icon: TrendingUp, color: "text-purple-500 border-t-purple-500", isNumber: false }
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className={`border border-zinc-700 bg-zinc-900 p-8 rounded-2xl border-t-2 ${kpi.color} space-y-3 flex flex-col justify-between shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)]`}>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">{kpi.label}</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-card-value text-white">
                      {kpi.isNumber ? <CountUp value={Number(kpi.val) || 0} /> : kpi.val}
                    </span>
                    <Icon className="h-5 w-5 text-zinc-500" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Department Queue Pipelines */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Department Pipelines</span>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 text-xs">
              {[
                { label: "Research Queue", val: stats.waitingForResearch, route: "/dashboard/research", bg: "bg-zinc-900 hover:border-cyan-500/40 text-cyan-400 border-zinc-700" },
                { label: "Content Queue", val: stats.waitingForContent, route: "/dashboard/content", bg: "bg-zinc-900 hover:border-amber-500/40 text-amber-400 border-zinc-700" },
                { label: "Design Queue", val: stats.waitingForDesign, route: "/dashboard/design", bg: "bg-zinc-900 hover:border-fuchsia-500/40 text-fuchsia-400 border-zinc-700" },
                { label: "QA Checkoff", val: stats.waitingForQA, route: "/dashboard/qa", bg: "bg-zinc-900 hover:border-purple-500/40 text-purple-400 border-zinc-700" },
                { label: "Client Review", val: stats.waitingForReview, route: "/dashboard/projects", bg: "bg-zinc-900 hover:border-blue-500/40 text-blue-400 border-zinc-700" }
              ].map((pipe, idx) => (
                <div 
                  key={idx} 
                  onClick={() => router.push(pipe.route)}
                  className={`border p-6 rounded-xl flex items-center justify-between cursor-pointer transition duration-200 shadow-md ${pipe.bg}`}
                >
                  <span className="font-bold">{pipe.label}</span>
                  <span className="font-mono text-[18px] font-extrabold">{pipe.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Projects and activity grid */}
          <div className="grid gap-8 md:grid-cols-3 text-xs">
            <div className="md:col-span-2 border border-zinc-700 bg-zinc-900 p-8 rounded-2xl space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-750 pb-4">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">Active Client Tracks</h3>
                <button 
                  onClick={() => router.push("/dashboard/projects")}
                  className="text-xs text-amber-500 font-bold hover:text-amber-400 flex items-center gap-1 cursor-pointer transition"
                >
                  <span>All Projects</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
                {projects.slice(0, 5).map((p: Project) => (
                  <div 
                    key={p.id}
                    onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                    className="p-4 border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition duration-200"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs leading-tight truncate">{p.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-1">Startup: <span className="text-zinc-200 font-medium">{p.startup_name}</span></p>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] bg-zinc-900 text-amber-500 border border-zinc-700 px-2 py-0.5 rounded-lg font-mono uppercase font-bold">{p.status}</span>
                        <span className="text-[10px] text-zinc-400 font-mono block mt-1">{p.progress}%</span>
                      </div>
                      <div className="w-16 bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-750">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-zinc-700 bg-zinc-900 p-8 rounded-2xl space-y-6 shadow-xl">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-750 pb-4">Operational Activity Feed</h3>
              
              <div className="space-y-5 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
                {recentActivities.slice(0, 8).map((act: TimelineEvent) => (
                  <div key={act.id} className="space-y-1.5 p-3 bg-zinc-950/20 border border-zinc-800/40 rounded-xl">
                    <div className="flex items-center justify-between text-[9px] text-zinc-400">
                      <span className="font-bold text-amber-500 font-mono uppercase tracking-wider">{act.event}</span>
                      <span>{formatFriendlyDate(act.created_at || new Date().toISOString())}</span>
                    </div>
                    <p className="text-[11px] text-zinc-350 leading-relaxed">{act.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: WORKLOAD MATRIX */}
      {activeTab === "workload" && (
        <div className="space-y-6 animate-in fade-in duration-300 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Team Load Allocations</span>
            <button 
              onClick={fetchWorkloads}
              className="text-xs text-amber-500 font-bold hover:text-amber-400 flex items-center gap-1 cursor-pointer transition"
            >
              <span>Refresh Matrix</span>
            </button>
          </div>

          {loadingWorkload ? (
            <div className="h-60 flex items-center justify-center text-zinc-400">
              Loading workload profiles...
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workloads.map((emp) => {
                const alt = emp.isOverloaded ? getAlternativeEmployee(emp.roleName, emp.userId) : null;
                return (
                  <div key={emp.userId} className={`border border-zinc-700 bg-zinc-900 p-8 rounded-2xl space-y-5 relative shadow-lg transition duration-200 hover:border-zinc-600 ${
                    emp.isOverloaded ? "ring-1 ring-red-500/20 border-red-500/30" : ""
                  }`}>
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white leading-tight">{emp.fullName}</h4>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{emp.roleName}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold font-mono rounded-lg ${
                        emp.isOverloaded 
                          ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                          : "bg-zinc-950 text-zinc-400 border border-zinc-700"
                      }`}>
                        {emp.capacityLoad}% Cap
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-750">
                        <div className={`h-2 rounded-full transition-all duration-300 ${
                          emp.capacityLoad > 85 ? "bg-red-500" : emp.capacityLoad > 60 ? "bg-amber-500" : "bg-emerald-500"
                        }`} style={{ width: `${emp.capacityLoad}%` }} />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center py-2.5 border-y border-zinc-800">
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-medium">Projects</span>
                        <span className="font-mono text-xs font-bold text-white block mt-0.5">{emp.activeProjectsCount}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-medium">Tasks</span>
                        <span className="font-mono text-xs font-bold text-white block mt-0.5">{emp.activeTasksCount}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-medium">Completed</span>
                        <span className="font-mono text-xs font-bold text-emerald-400 block mt-0.5">{emp.completedTasksCount}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-medium">Overdue</span>
                        <span className="font-mono text-xs font-bold text-red-400 block mt-0.5">{emp.overdueTasksCount}</span>
                      </div>
                    </div>

                    {/* Efficiency & Speed */}
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                      <span>Efficiency: <strong className="text-zinc-200">{emp.efficiency}%</strong></span>
                      <span>Avg Completion: <strong className="text-zinc-200">{emp.avgCompletionDays}d</strong></span>
                    </div>

                    {/* Overloaded warning & Recommendation */}
                    {emp.isOverloaded && (
                      <div className="mt-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-red-400 font-bold text-[10px]">
                          <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
                          <span>EXCESSIVE WORKLOAD DETECTED</span>
                        </div>
                        {alt ? (
                          <div className="text-[10px] text-zinc-450">
                            Suggested alternative: <strong className="text-amber-500 font-bold">{alt.fullName}</strong> ({alt.capacityLoad}% Cap)
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-500">
                            No other specialists currently available.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DEADLINE TRACKER */}
      {activeTab === "deadlines" && (
        <div className="space-y-5 animate-in fade-in duration-300 text-xs">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Operations Risk Index</span>

          <div className="border border-zinc-700 bg-zinc-900 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 bg-zinc-900/60 border-b border-zinc-700 grid grid-cols-5 font-bold text-zinc-400 select-none text-[10px] uppercase tracking-wider">
              <span className="col-span-2">Task Details</span>
              <span>Project Target</span>
              <span>Assigned To</span>
              <span className="text-right">Risk Index</span>
            </div>

            <div className="divide-y divide-zinc-800">
              {tasks.map((task) => {
                const proj = projects.find(p => p.id === task.project_id);
                const risk = calculateDeadlineRisk(task.deadline);
                return (
                  <div key={task.id} className="p-5 grid grid-cols-5 items-center hover:bg-zinc-950/20 transition duration-150">
                    <div className="col-span-2 min-w-0 pr-4">
                      <span className="font-bold text-zinc-200 text-xs leading-tight block truncate">{task.name}</span>
                      <span className="text-[10px] text-zinc-450 block truncate mt-1">{task.description}</span>
                    </div>

                    <span className="text-zinc-350 font-medium truncate pr-4">{proj ? proj.name : "N/A"}</span>

                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 uppercase font-mono text-[10px]">
                        {task.assigned_user?.fullName ? task.assigned_user.fullName[0] : "?"}
                      </div>
                      <span className="text-zinc-300 font-semibold truncate">{task.assigned_user?.fullName || "Unassigned"}</span>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider ${risk.color}`}>
                        {risk.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {risk.days < 0 
                          ? `${Math.abs(risk.days)} days overdue` 
                          : risk.days === 999 
                            ? "No limit" 
                            : `${risk.days} days remaining`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      <CreateProjectModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        allUsers={allUsers}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
