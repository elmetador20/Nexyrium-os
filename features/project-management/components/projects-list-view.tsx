"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutGrid, 
  List, 
  Kanban, 
  Search, 
  Filter, 
  Plus, 
  ArrowUpRight, 
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  FolderPlus
} from "lucide-react";
import { Project, ProjectStatus, ProjectPriority, ProjectServiceType } from "../types";
import { CreateProjectModal } from "./create-project-modal";
import { isAdminOrManager } from "../utils/rbac";
import { updateProjectAction } from "../../../app/actions/projects";

interface ProjectsListViewProps {
  initialProjects: Project[];
  userRole: string;
  userId: string;
  allUsers: any[];
}

export function ProjectsListView({
  initialProjects,
  userRole,
  userId,
  allUsers
}: ProjectsListViewProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "cards">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const filteredProjects = projects.filter(p => {
    if (userRole === "CLIENT" && p.client_id !== userId) {
      return false;
    }
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.startup_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesService = serviceFilter === "ALL" || p.service_type === serviceFilter;
    const matchesPriority = priorityFilter === "ALL" || p.priority === priorityFilter;
    return matchesSearch && matchesService && matchesPriority;
  });

  const kanbanColumns: { label: string; status: ProjectStatus; color: string }[] = [
    { label: "Received", status: "Received", color: "border-t-zinc-400 text-zinc-400 bg-zinc-500/5" },
    { label: "Research", status: "Research", color: "border-t-cyan-500 text-cyan-400 bg-cyan-500/5" },
    { label: "Content", status: "Content Writing", color: "border-t-amber-500 text-amber-400 bg-amber-500/5" },
    { label: "Design", status: "Design", color: "border-t-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/5" },
    { label: "QA", status: "QA", color: "border-t-purple-500 text-purple-400 bg-purple-500/5" },
    { label: "Review", status: "Client Review", color: "border-t-blue-500 text-blue-400 bg-blue-500/5" },
    { label: "Completed", status: "Completed", color: "border-t-emerald-500 text-emerald-400 bg-emerald-500/5" },
  ];

  const handleStageShift = async (projId: string, newStatus: ProjectStatus) => {
    const res = await updateProjectAction(projId, { status: newStatus });
    if (res.success) {
      showToast(`Project stage updated to "${newStatus}"`);
      setProjects(prev => prev.map(p => {
        if (p.id === projId) {
          const progressStages: Record<ProjectStatus, number> = {
            "Received": 5,
            "Research": 20,
            "Content Writing": 40,
            "Design": 65,
            "QA": 80,
            "Client Review": 90,
            "Revision": 85,
            "Completed": 100,
            "Cancelled": 0
          };
          return { ...p, status: newStatus, progress: progressStages[newStatus] };
        }
        return p;
      }));
    } else {
      showToast(`Error updating project: ${res.error}`);
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
      showToast(`Project "${values.name}" created!`);
      setIsNewProjectOpen(false);
      const { getProjectDashboardAction } = await import("../../../app/actions/projects");
      const updated = await getProjectDashboardAction();
      if (updated.success && updated.data) {
        setProjects(updated.data.projects);
      }
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto select-none bg-zinc-950 text-white min-h-screen">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-black text-xs px-5 py-4 rounded-xl shadow-2xl font-bold border border-amber-400 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-4.5 w-4.5 text-black" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-page-title text-white">Client Engagements Board</h1>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">Track deliverables, slide copy status, and QA approvals across company projects.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-1 shrink-0">
            <button onClick={() => setViewMode("kanban")} className={`p-2 rounded-lg transition duration-200 flex items-center justify-center cursor-pointer ${viewMode === "kanban" ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-zinc-200"}`}>
              <Kanban className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition duration-200 flex items-center justify-center cursor-pointer ${viewMode === "table" ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-zinc-200"}`}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("cards")} className={`p-2 rounded-lg transition duration-200 flex items-center justify-center cursor-pointer ${viewMode === "cards" ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-zinc-200"}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {isAdminOrManager(userRole) && (
            <button onClick={() => setIsNewProjectOpen(true)} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition duration-200 cursor-pointer">
              <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
              <span>Create Project</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search startup name or deck title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 focus:border-amber-500 text-zinc-100 placeholder-zinc-550 text-xs rounded-xl outline-none transition"
          />
        </div>
        
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-3.5 py-2 rounded-xl text-xs text-zinc-400">
            <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-semibold">Service:</span>
            <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="bg-transparent border-0 text-white outline-none focus:ring-0 cursor-pointer text-xs font-bold">
              <option value="ALL" className="bg-zinc-900">All Tracks</option>
              <option value="Pitch Deck" className="bg-zinc-900">Pitch Deck</option>
              <option value="Financial Model" className="bg-zinc-900">Financial Model</option>
              <option value="Business Plan" className="bg-zinc-900">Business Plan</option>
              <option value="Investor Outreach" className="bg-zinc-900">Investor Outreach</option>
              <option value="Grant Proposal" className="bg-zinc-900">Grant Proposal</option>
              <option value="Fundraising Strategy" className="bg-zinc-900">Fundraising Strategy</option>
              <option value="Custom" className="bg-zinc-900">Custom</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-3.5 py-2 rounded-xl text-xs text-zinc-400">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-semibold">Priority:</span>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="bg-transparent border-0 text-white outline-none focus:ring-0 cursor-pointer text-xs font-bold">
              <option value="ALL" className="bg-zinc-900">All Priorities</option>
              <option value="LOW" className="bg-zinc-900">LOW</option>
              <option value="MEDIUM" className="bg-zinc-900">MEDIUM</option>
              <option value="HIGH" className="bg-zinc-900">HIGH</option>
              <option value="URGENT" className="bg-zinc-900">URGENT</option>
            </select>
          </div>
        </div>
      </div>

      {viewMode === "kanban" && (
        <div className="flex gap-5 overflow-x-auto pb-6 custom-scrollbar select-none min-h-[500px]">
          {kanbanColumns.map((col) => {
            const columnProjects = filteredProjects.filter(p => p.status === col.status);
            return (
              <div key={col.status} className="w-76 shrink-0 flex flex-col space-y-4">
                <div className={`p-4 rounded-xl border-t-2 ${col.color} flex items-center justify-between`}>
                  <span className="text-xs font-extrabold uppercase tracking-wider font-mono">{col.label}</span>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg font-mono font-bold">{columnProjects.length}</span>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto max-h-[550px] pr-1.5 custom-scrollbar">
                  {columnProjects.map((p) => (
                    <div key={p.id} onClick={() => router.push(`/dashboard/projects/${p.id}`)} className="p-5 border border-zinc-700 bg-zinc-900 hover:border-zinc-500 rounded-xl space-y-4 transition duration-200 cursor-pointer group shadow-xl">
                      <div className="space-y-2">
                        <span className="text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg font-mono font-semibold uppercase">{p.service_type}</span>
                        <h3 className="font-bold text-xs text-white group-hover:text-amber-500 transition-colors pt-1.5 leading-tight">{p.name}</h3>
                        <p className="text-[10px] text-zinc-400 font-semibold">Startup: <span className="text-zinc-200 font-medium">{p.startup_name}</span></p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-mono font-semibold text-zinc-500">
                          <span>Progress</span>
                          <span>{p.progress}%</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-1 transition-all" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-850 pt-3.5 text-[9px] text-zinc-450">
                        <span className={`px-2 py-0.5 rounded-lg font-bold uppercase ${
                          p.priority === "URGENT" ? "bg-red-500/10 text-red-400 border border-red-500/20" : 
                          p.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : 
                          "bg-zinc-950 text-zinc-400 border border-zinc-800"
                        }`}>{p.priority}</span>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 font-bold">
                          <Calendar className="h-3.5 w-3.5 text-zinc-650" />
                          <span>{p.deadline.split("-")[1]}/{p.deadline.split("-")[2]}</span>
                        </div>
                      </div>

                      {isAdminOrManager(userRole) && (
                        <div className="pt-3 border-t border-zinc-850 mt-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
                          <select 
                            value={p.status} 
                            onChange={(e) => handleStageShift(p.id, e.target.value as ProjectStatus)} 
                            className="bg-zinc-950 border border-zinc-850 text-[9px] text-zinc-400 font-bold uppercase rounded-lg p-2 outline-none cursor-pointer hover:border-zinc-700 transition"
                          >
                            <option value="Received">To: Received</option>
                            <option value="Research">To: Research</option>
                            <option value="Content Writing">To: Copy</option>
                            <option value="Design">To: Design</option>
                            <option value="QA">To: QA</option>
                            <option value="Client Review">To: Review</option>
                            <option value="Completed">To: Done</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                  {columnProjects.length === 0 && (
                    <div className="py-12 text-center text-zinc-600 text-[10px] border border-dashed border-zinc-800 rounded-xl select-none font-bold uppercase tracking-wider font-mono">
                      No active tracks.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "table" && (
        <div className="border border-zinc-700 bg-zinc-900 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[9px] uppercase tracking-wider bg-zinc-950/40">
                  <th className="p-5 font-bold">Project / Title</th>
                  <th className="p-5 font-bold">Startup</th>
                  <th className="p-5 font-bold">Service Track</th>
                  <th className="p-5 font-bold">Priority</th>
                  <th className="p-5 font-bold">Stage / Status</th>
                  <th className="p-5 font-bold">Progress</th>
                  <th className="p-5 font-bold text-center">Deadline</th>
                  <th className="p-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProjects.map((p) => (
                  <tr key={p.id} onClick={() => router.push(`/dashboard/projects/${p.id}`)} className="hover:bg-zinc-800/25 transition duration-200 cursor-pointer group">
                    <td className="p-5 font-bold text-white group-hover:text-amber-500 transition-colors">{p.name}</td>
                    <td className="p-5 text-zinc-300 font-medium">{p.startup_name}</td>
                    <td className="p-5 text-zinc-400">
                      <span className="bg-zinc-950 text-zinc-400 text-[9px] px-2.5 py-1 rounded-lg font-mono uppercase font-semibold border border-zinc-800">{p.service_type}</span>
                    </td>
                    <td className="p-5">
                      <span className={`text-[8px] px-2 py-0.5 rounded-lg font-bold uppercase border ${
                        p.priority === "URGENT" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                        p.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                        "bg-zinc-950 text-zinc-400 border-zinc-800"
                      }`}>{p.priority}</span>
                    </td>
                    <td className="p-5">
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase font-mono ${
                        p.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                        p.status === "Design" ? "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20" : 
                        "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}>{p.status}</span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3.5 w-32">
                        <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-1" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 font-bold shrink-0">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="p-5 text-center text-zinc-500 font-semibold font-mono">{p.deadline}</td>
                    <td className="p-5 text-right">
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${p.id}`); }} className="text-xs text-amber-500 hover:text-amber-400 font-bold inline-flex items-center gap-1.5 cursor-pointer transition">
                        <span>Workspace</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "cards" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => (
            <div key={p.id} onClick={() => router.push(`/dashboard/projects/${p.id}`)} className="border border-zinc-700 bg-zinc-900 hover:border-zinc-500 rounded-2xl p-6 space-y-5 transition duration-200 cursor-pointer group shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg font-mono font-semibold uppercase">{p.service_type}</span>
                  <span className={`text-[8px] px-2 py-0.5 rounded-lg font-bold uppercase border ${
                    p.priority === "URGENT" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                    p.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                    "bg-zinc-950 text-zinc-400 border-zinc-800"
                  }`}>{p.priority}</span>
                </div>
                <h3 className="font-bold text-sm text-white group-hover:text-amber-500 transition-colors pt-1 leading-tight">{p.name}</h3>
                <p className="text-[10px] text-zinc-400 font-semibold">Startup: <span className="text-zinc-200 font-medium">{p.startup_name}</span></p>
              </div>

              <div className="space-y-3.5 pt-4 border-t border-zinc-850 mt-2">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-zinc-500 font-semibold">Stage: <span className="text-zinc-300 font-bold uppercase">{p.status}</span></span>
                  <span className="text-zinc-400 font-mono font-bold">{p.progress}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-1.5" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateProjectModal
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        allUsers={allUsers}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
