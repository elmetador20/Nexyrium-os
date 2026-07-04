"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Users, 
  CheckSquare, 
  BookOpen, 
  FileText, 
  Palette, 
  CheckCircle2, 
  FileDown, 
  MessageSquare, 
  Activity, 
  Save, 
  ExternalLink,
  Plus, 
  Check, 
  X,
  FileCheck,
  Layers,
  FilePlus2
} from "lucide-react";
import { 
  Project, 
  Task, 
  ResearchRecord, 
  ContentRecord, 
  DesignRecord, 
  QARecord, 
  Deliverable, 
  Comment, 
  TimelineEvent,
  ProjectStatus
} from "../types";
import { canEditDepartmentWorkspace, isAdminOrManager } from "../utils/rbac";
import { 
  updateProjectAction, 
  createTaskAction, 
  updateTaskStatusAction,
  updateResearchRecordAction,
  updateContentRecordAction,
  updateDesignRecordAction,
  updateQARecordAction,
  addDeliverableAction,
  addCommentAction
} from "../../../app/actions/projects";

interface ProjectDetailsViewProps {
  project: Project;
  initialTasks: Task[];
  initialResearch?: ResearchRecord;
  initialContent?: ContentRecord;
  initialDesign?: DesignRecord;
  initialQa?: QARecord;
  initialDeliverables: Deliverable[];
  initialComments: Comment[];
  initialTimeline: TimelineEvent[];
  userRole: string;
  userId: string;
  allUsers: any[];
}

export function ProjectDetailsView({
  project,
  initialTasks,
  initialResearch,
  initialContent,
  initialDesign,
  initialQa,
  initialDeliverables,
  initialComments,
  initialTimeline,
  userRole,
  userId,
  allUsers
}: ProjectDetailsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "research" | "content" | "design" | "qa" | "deliverables" | "discussion" | "timeline">("overview");
  
  const [projStatus, setProjStatus] = useState<ProjectStatus>(project.status);
  const [projProgress, setProjProgress] = useState(project.progress);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [deliverables, setDeliverables] = useState<Deliverable[]>(initialDeliverables);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(initialTimeline);
  const [toastMsg, setToastMsg] = useState("");
  
  const [research, setResearch] = useState<Partial<ResearchRecord>>(initialResearch || {
    industry: "", competitors: "", target_audience: "", pain_points: "", market_size: "", tam: "", sam: "", som: "", references: ""
  });
  const [content, setContent] = useState<Partial<ContentRecord>>(initialContent || {
    google_docs_link: "", slide_progress: 0, slides: []
  });
  const [design, setDesign] = useState<Partial<DesignRecord>>(initialDesign || {
    canva_link: "", brand_kit: { logo: "", fonts: "", colors: [], icons: "", illustrations: "" }, pdf_export_url: "", pptx_export_url: ""
  });
  const [qa, setQa] = useState<Partial<QARecord>>(initialQa || {
    checklist: { grammar: false, alignment: false, typography: false, charts: false, icons: false, images: false, consistency: false, brandCompliance: false, storyFlow: false }, comments: "", status: "PENDING"
  });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const logTimelineLocally = (event: string, details: string) => {
    setTimeline(prev => [
      {
        id: `time-${Math.random()}`,
        project_id: project.id,
        user_id: userId,
        event,
        details,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const handleStatusChange = async (status: ProjectStatus) => {
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
    const nextProgress = progressStages[status];
    const res = await updateProjectAction(project.id, { status, progress: nextProgress });
    if (res.success) {
      setProjStatus(status);
      setProjProgress(nextProgress);
      showToast(`Project stage updated to ${status}`);
      logTimelineLocally("Project Updated", `Stage changed to: ${status}. Progress at ${nextProgress}%.`);
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Completed" ? "In Progress" : "Completed";
    const res = await updateTaskStatusAction(taskId, nextStatus);
    if (res.success) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      const tName = tasks.find(t => t.id === taskId)?.name;
      showToast(`Task marked as ${nextStatus}`);
      logTimelineLocally("Task Updated", `Task [${tName}] status shifted to ${nextStatus}.`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const department = formData.get("department") as string;
    const assignedUserId = formData.get("assignedUserId") as string;
    const priority = formData.get("priority") as any;
    const deadline = formData.get("deadline") as string;

    const res = await createTaskAction(project.id, {
      name,
      description: "Department checklist task.",
      department,
      assignedUserId: assignedUserId || null,
      priority: priority || "MEDIUM",
      deadline,
      estimatedHours: 4
    });

    if (res.success) {
      showToast(`Task "${name}" added!`);
      setIsTaskModalOpen(false);
      const { getProjectDetailsAction } = await import("../../../app/actions/projects");
      const details = await getProjectDetailsAction(project.id);
      if (details.success && details.tasks) {
        setTasks(details.tasks);
      }
      logTimelineLocally("Task Created", `Task [${name}] added to ${department} queue.`);
    }
  };

  const handleSaveResearch = async () => {
    const res = await updateResearchRecordAction(project.id, research);
    if (res.success) {
      showToast("Research inputs saved successfully!");
      logTimelineLocally("Research Completed", "Market competitive intelligence saved.");
    }
  };

  const handleSaveContent = async () => {
    const res = await updateContentRecordAction(project.id, content);
    if (res.success) {
      showToast("Slide copywriting scope saved successfully!");
      logTimelineLocally("Content Submitted", `Google docs copy link and slides updated.`);
    }
  };

  const handleSaveDesign = async () => {
    const res = await updateDesignRecordAction(project.id, design);
    if (res.success) {
      showToast("Design links and brand kit saved!");
      logTimelineLocally("Design Uploaded", "Canva workspace link and color parameters registered.");
    }
  };

  const handleSaveQA = async () => {
    const res = await updateQARecordAction(project.id, qa);
    if (res.success) {
      showToast("QA Checklist and status audited!");
      logTimelineLocally("QA Audit", `QA Audit shifted status to: ${qa.status}.`);
      if (qa.status === "APPROVED") {
        handleStatusChange("Client Review");
      } else if (qa.status === "REJECTED_REVISION") {
        handleStatusChange("Revision");
      }
    }
  };

  const handleCreateDeliverable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const version = formData.get("version") as string;
    const fileUrl = formData.get("fileUrl") as string;

    const res = await addDeliverableAction(project.id, {
      name,
      version,
      deadline: new Date().toISOString().split("T")[0],
      fileUrl
    });

    if (res.success) {
      showToast(`Deliverable "${name}" uploaded!`);
      setIsDeliverableModalOpen(false);
      const { getProjectDetailsAction } = await import("../../../app/actions/projects");
      const details = await getProjectDetailsAction(project.id);
      if (details.success && details.deliverables) {
        setDeliverables(details.deliverables);
      }
      logTimelineLocally("Deliverable Submitted", `File upload [${name} v${version}] posted for client approval.`);
    }
  };

  const handleClientApproval = async (delId: string, approval_status: "APPROVED" | "REJECTED") => {
    setDeliverables(prev => prev.map(d => d.id === delId ? { ...d, approval_status, status: approval_status === "APPROVED" ? "Approved" : "Rejected" } : d));
    const dName = deliverables.find(d => d.id === delId)?.name;
    showToast(`Deliverable marked as ${approval_status}`);
    logTimelineLocally("Client Review", `Client completed evaluation on [${dName}]. Outcome: ${approval_status}.`);

    if (approval_status === "APPROVED") {
      handleStatusChange("Completed");
    } else {
      handleStatusChange("Revision");
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const res = await addCommentAction(project.id, newCommentText);
    if (res.success && res.comment) {
      setComments(prev => [...prev, res.comment!]);
      setNewCommentText("");
      showToast("Comment posted!");
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-10 max-w-7xl mx-auto select-none bg-zinc-950 text-white min-h-screen">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-black text-xs px-5 py-4 rounded-xl shadow-2xl font-bold border border-amber-400 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-4.5 w-4.5 text-black" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 select-none">
        <Link href="/dashboard/projects" className="text-xs text-zinc-400 hover:text-white transition duration-200 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects Board</span>
        </Link>

        {isAdminOrManager(userRole) && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-500 font-bold uppercase tracking-wider font-mono">Set Active Stage:</span>
            <select 
              value={projStatus} 
              onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)} 
              className="bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-white font-semibold uppercase rounded-xl p-2.5 outline-none cursor-pointer transition"
            >
              <option value="Received">Received</option>
              <option value="Research">Research Stage</option>
              <option value="Content Writing">Content Writing</option>
              <option value="Design">Deck Design</option>
              <option value="QA">QA Checkoffs</option>
              <option value="Client Review">Client Review</option>
              <option value="Revision">Revision Cycle</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Project Header Card */}
      <div className="border border-zinc-700 bg-zinc-900 rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8 relative overflow-hidden shadow-xl">
        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="bg-amber-500/10 border border-amber-500/25 text-amber-500 font-mono text-[10px] px-2.5 py-1 rounded-lg uppercase font-bold tracking-wider">{project.service_type}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider border ${
              project.priority === "URGENT" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
              project.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
              "bg-zinc-950 text-zinc-400 border-zinc-800"
            }`}>{project.priority}</span>
          </div>
          <h2 className="text-page-title text-white">{project.name}</h2>
          <p className="text-xs text-zinc-400">Startup Engagement: <span className="text-zinc-200 font-semibold">{project.startup_name}</span></p>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Engagement Progress</span>
            <span className="text-xl font-extrabold text-white tracking-tight">{projProgress}% Complete</span>
            <span className="text-[10px] text-amber-500 font-mono block font-bold uppercase tracking-wider">{projStatus}</span>
          </div>
          <div className="h-16 w-16 rounded-full border-4 border-zinc-950 border-t-amber-500 flex items-center justify-center font-mono text-xs text-zinc-300 font-extrabold shadow-lg">
            {projProgress}%
          </div>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="border-b border-zinc-700 overflow-x-auto flex gap-2 select-none custom-scrollbar">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "tasks", label: "Task List", icon: CheckSquare },
          { id: "research", label: "Research", icon: BookOpen },
          { id: "content", label: "Content/Copy", icon: FileText },
          { id: "design", label: "Design", icon: Palette },
          { id: "qa", label: "QA Audit", icon: CheckCircle2 },
          { id: "deliverables", label: "Deliverables", icon: FileCheck },
          { id: "discussion", label: "Discussion", icon: MessageSquare },
          { id: "timeline", label: "Timeline Log", icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex items-center gap-2 px-5 py-4 border-b-2 font-semibold text-xs transition duration-200 cursor-pointer ${
                isActive ? "border-amber-500 text-white font-bold bg-zinc-900/10" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* View Details panel body */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-8">
              <div className="border border-zinc-700 bg-zinc-900 p-8 rounded-2xl space-y-4 shadow-xl">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-zinc-400">Project Scope & Guidelines</h3>
                <p className="text-xs text-zinc-350 leading-relaxed whitespace-pre-line">{project.description || "No scoping description provided."}</p>
              </div>
              <div className="border border-zinc-700 bg-zinc-900 p-8 rounded-2xl space-y-4 shadow-xl">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-zinc-400">Operational Directives</h3>
                <p className="text-xs text-zinc-400 italic leading-relaxed">{project.notes || "No operational directives logged."}</p>
              </div>
            </div>

            <div className="space-y-8 text-xs">
              <div className="border border-zinc-700 bg-zinc-900 p-8 rounded-2xl space-y-5 shadow-xl">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-zinc-400">Resource Allocation Seats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500 font-semibold">Client Partner</span>
                    <span className="text-zinc-200 font-bold">{project.client?.fullName || "Founder"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500 font-semibold">Project Manager</span>
                    <span className="text-zinc-200 font-bold">{project.project_manager?.fullName || "Unassigned"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="border border-zinc-700 bg-zinc-900 rounded-2xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center justify-between select-none">
              <div>
                <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-zinc-400">Department Checklist Tasks</h3>
              </div>
              <button 
                onClick={() => setIsTaskModalOpen(true)} 
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
                <span>Create Task</span>
              </button>
            </div>

            <div className="space-y-3 text-xs select-none">
              {tasks.length > 0 ? (
                tasks.map((task) => {
                  const isCompleted = task.status === "Completed";
                  return (
                    <div 
                      key={task.id} 
                      className={`p-4.5 border rounded-xl flex items-center justify-between gap-4 transition duration-150 ${
                        isCompleted ? 'bg-zinc-950/20 border-zinc-800' : 'bg-zinc-950 border-zinc-750 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <button 
                          onClick={() => toggleTaskStatus(task.id, task.status)}
                          className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition ${
                            isCompleted ? 'bg-amber-500 border-amber-400 text-black' : 'border-zinc-700 bg-transparent hover:border-zinc-500'
                          }`}
                        >
                          {isCompleted && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                        </button>
                        <div className="min-w-0">
                          <p className={`font-semibold text-xs ${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{task.name}</p>
                          {task.description && <p className="text-[10px] text-zinc-500 truncate mt-1">{task.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 select-none">
                        <span className="bg-zinc-900 border border-zinc-700 text-zinc-400 font-mono text-[9px] px-2 py-1 rounded-lg font-bold uppercase">
                          {task.department}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase ${
                          task.priority === "URGENT" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          task.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-zinc-950 text-zinc-400 border border-zinc-800"
                        }`}>
                          {task.priority}
                        </span>
                        <span className="bg-zinc-900 border border-zinc-700 text-zinc-350 text-[9px] px-2 py-1 rounded-lg font-medium flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span>{task.assigned_user?.fullName || task.assigned_user?.email || "Unassigned"}</span>
                        </span>
                        {task.deadline && (
                          <span className="text-[10px] text-zinc-500 font-mono font-bold">
                            Due: {task.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-zinc-500">No tasks registered.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "research" && (
          <div className="border border-zinc-700 bg-zinc-900 rounded-2xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-zinc-400">Competitive Intelligence & TAM</h3>
              <button 
                onClick={handleSaveResearch} 
                disabled={!canEditDepartmentWorkspace(userRole, "research")} 
                className="px-4.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Workspace</span>
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 text-xs">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Industry / Core Sector</label>
                  <input 
                    type="text" 
                    value={research.industry || ""} 
                    disabled={!canEditDepartmentWorkspace(userRole, "research")} 
                    onChange={(e) => setResearch({ ...research, industry: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Top Competitors</label>
                  <input 
                    type="text" 
                    value={research.competitors || ""} 
                    disabled={!canEditDepartmentWorkspace(userRole, "research")} 
                    onChange={(e) => setResearch({ ...research, competitors: e.target.value })} 
                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="font-semibold text-zinc-400">TAM ($)</label>
                    <input 
                      type="text" 
                      value={research.tam || ""} 
                      disabled={!canEditDepartmentWorkspace(userRole, "research")} 
                      onChange={(e) => setResearch({ ...research, tam: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-semibold text-zinc-400">SAM ($)</label>
                    <input 
                      type="text" 
                      value={research.sam || ""} 
                      disabled={!canEditDepartmentWorkspace(userRole, "research")} 
                      onChange={(e) => setResearch({ ...research, sam: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-semibold text-zinc-400">SOM ($)</label>
                    <input 
                      type="text" 
                      value={research.som || ""} 
                      disabled={!canEditDepartmentWorkspace(userRole, "research")} 
                      onChange={(e) => setResearch({ ...research, som: e.target.value })} 
                      className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="border border-zinc-700 bg-zinc-900 rounded-2xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-zinc-400">Slide Deck Copywriter Editor</h3>
              <button 
                onClick={handleSaveContent} 
                disabled={!canEditDepartmentWorkspace(userRole, "content")} 
                className="px-4.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Workspace</span>
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Google Docs Link</label>
                <input 
                  type="text" 
                  value={content.google_docs_link || ""} 
                  disabled={!canEditDepartmentWorkspace(userRole, "content")} 
                  onChange={(e) => setContent({ ...content, google_docs_link: e.target.value })} 
                  className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "design" && (
          <div className="border border-zinc-700 bg-zinc-900 rounded-2xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-zinc-400">Deck Brand Guidelines & Canva Workspace</h3>
              <button 
                onClick={handleSaveDesign} 
                disabled={!canEditDepartmentWorkspace(userRole, "design")} 
                className="px-4.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Workspace</span>
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Canva / Figma Layout Link</label>
                <input 
                  type="text" 
                  value={design.canva_link || ""} 
                  disabled={!canEditDepartmentWorkspace(userRole, "design")} 
                  onChange={(e) => setDesign({ ...design, canva_link: e.target.value })} 
                  className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "qa" && (
          <div className="border border-zinc-700 bg-zinc-900 rounded-2xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-zinc-400">Quality Assurance Review Console</h3>
              <button 
                onClick={handleSaveQA} 
                disabled={!canEditDepartmentWorkspace(userRole, "qa")} 
                className="px-4.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Workspace</span>
              </button>
            </div>
            <div className="grid gap-8 md:grid-cols-3 text-xs select-none">
              <div className="md:col-span-2 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { key: "grammar", label: "Grammar & Spelling Audit" },
                    { key: "alignment", label: "Object Alignments check" }
                  ].map((item) => {
                    const checked = (qa.checklist as any)?.[item.key] || false;
                    return (
                      <div 
                        key={item.key} 
                        onClick={() => {
                          if (!canEditDepartmentWorkspace(userRole, "qa")) return;
                          setQa({ ...qa, checklist: { ...qa.checklist, [item.key]: !checked } as any });
                        }} 
                        className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-3 cursor-pointer hover:border-zinc-750 transition"
                      >
                        <div className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 ${
                          checked ? 'bg-amber-500 border-amber-400 text-black' : 'border-zinc-750 bg-transparent'
                        }`}>{checked && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}</div>
                        <span className="font-semibold text-zinc-250">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "deliverables" && (
          <div className="border border-zinc-700 bg-zinc-900 rounded-2xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-zinc-400">Client Exports & Approvals</h3>
              {isAdminOrManager(userRole) && (
                <button 
                  onClick={() => setIsDeliverableModalOpen(true)} 
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FilePlus2 className="h-4.5 w-4.5 stroke-[2.5]" />
                  <span>Submit Deliverable</span>
                </button>
              )}
            </div>

            <div className="space-y-4 text-xs">
              {deliverables.length > 0 ? (
                deliverables.map((del) => {
                  const isPending = del.approval_status === "PENDING";
                  return (
                    <div 
                      key={del.id} 
                      className="p-5 border border-zinc-800 bg-zinc-950 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-white text-xs">{del.name}</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">{del.version} - {del.approval_status}</p>
                      </div>
                      {userRole === "CLIENT" && isPending && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleClientApproval(del.id, "APPROVED")} 
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold cursor-pointer transition"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleClientApproval(del.id, "REJECTED")} 
                            className="px-3.5 py-2 bg-red-650 hover:bg-red-500 text-white rounded-xl text-[11px] font-bold cursor-pointer transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-zinc-550">No deliverables uploaded.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "discussion" && (
          <div className="border border-zinc-700 bg-zinc-900 rounded-2xl p-8 space-y-8 shadow-xl">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-zinc-400">Startup Project Forum</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1.5 custom-scrollbar">
              {comments.map((c) => (
                <div key={c.id} className="p-4 border border-zinc-800 bg-zinc-950 rounded-xl leading-relaxed">
                  <p className="text-xs text-zinc-250">{c.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handlePostComment} className="flex gap-3 text-xs">
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={newCommentText} 
                onChange={(e) => setNewCommentText(e.target.value)} 
                className="flex-1 bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3.5 outline-none focus:border-amber-500 transition" 
              />
              <button 
                type="submit" 
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl transition cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="border border-zinc-700 bg-zinc-900 rounded-2xl p-8 space-y-6 shadow-xl">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono text-zinc-400">Project Audit Trail</h3>
            <div className="relative border-l border-zinc-800 pl-4 space-y-5">
              {timeline.map((event) => (
                <div key={event.id} className="text-xs space-y-1 relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-bold text-zinc-300 block">{event.event}</span>
                  <span className="text-zinc-500 leading-relaxed block">{event.details}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setIsTaskModalOpen(false)}>
          <form 
            onSubmit={handleCreateTask} 
            className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-zinc-400">Create Department Checklist Task</h3>
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Task Name</label>
                <input 
                  required 
                  name="name" 
                  type="text" 
                  className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Department</label>
                  <select 
                    name="department" 
                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    <option value="Research">Research</option>
                    <option value="Content Writing">Content Writing</option>
                    <option value="Design">Design</option>
                    <option value="QA">QA</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Deadline</label>
                  <input 
                    required 
                    name="deadline" 
                    type="date" 
                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition cursor-pointer" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Assign To</label>
                  <select 
                    name="assignedUserId" 
                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {allUsers.filter(u => u.roleName !== "CLIENT").map(u => (
                      <option key={u.id} value={u.id}>{u.fullName || u.email} ({u.roleName})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Priority</label>
                  <select 
                    name="priority" 
                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsTaskModalOpen(false)} 
                className="px-4 py-2.5 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition cursor-pointer text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-extrabold transition cursor-pointer text-xs"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {isDeliverableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setIsDeliverableModalOpen(false)}>
          <form 
            onSubmit={handleCreateDeliverable} 
            className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-zinc-400">Submit Deck Deliverable</h3>
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">File Name</label>
                <input 
                  required 
                  name="name" 
                  type="text" 
                  className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Version</label>
                  <input 
                    required 
                    name="version" 
                    placeholder="v1.0" 
                    type="text" 
                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Download URL</label>
                  <input 
                    required 
                    name="fileUrl" 
                    type="text" 
                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsDeliverableModalOpen(false)} 
                className="px-4 py-2.5 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition cursor-pointer text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-extrabold transition cursor-pointer text-xs"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
