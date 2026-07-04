"use client";

import React, { useState, useEffect } from "react";
import { 
  Download, 
  MessageSquare, 
  Send, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  Layers,
  CreditCard
} from "lucide-react";
import { Project, Deliverable, Invoice, Comment } from "../types";
import { getInvoicesAction, getProjectDetailsAction, addCommentAction } from "../../../app/actions/projects";
import { formatFriendlyDate } from "../utils/date";

interface ClientPortalProps {
  initialProjects: Project[];
  userEmail: string;
}

export function ClientPortal({
  initialProjects,
  userEmail
}: ClientPortalProps) {
  const [projects] = useState<Project[]>(initialProjects);
  const [selectedProjId, setSelectedProjId] = useState<string>(projects[0]?.id || "");
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [commentText, setCommentText] = useState("");

  const activeProject = projects.find(p => p.id === selectedProjId);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    if (selectedProjId) {
      loadProjectClientDetails();
    }
  }, [selectedProjId]);

  const loadProjectClientDetails = async () => {
    setLoading(true);
    // Fetch project details, deliverables, invoices
    const details = await getProjectDetailsAction(selectedProjId);
    if (details.success) {
      setDeliverables(details.deliverables || []);
      // Filter out internal comments (in a real DB, we'd query client_visible comments. For mock, we show client comments or filter them)
      setComments(details.comments || []);
    }

    const invoicesRes = await getInvoicesAction();
    if (invoicesRes.success && invoicesRes.invoices) {
      setInvoices(invoicesRes.invoices.filter(i => i.project_id === selectedProjId));
    }
    setLoading(false);
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedProjId) return;

    const res = await addCommentAction(selectedProjId, `[Client Message] ${commentText}`);
    if (res.success && res.comment) {
      setComments(prev => [...prev, res.comment!]);
      setCommentText("");
      showToast("Revision request logged. Our team has been notified.");
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto select-none bg-zinc-950 text-white min-h-screen text-xs">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-black text-xs px-5 py-4 rounded-xl shadow-2xl font-bold border border-amber-400 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle className="h-4.5 w-4.5 text-black" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shadow-xl animate-in fade-in duration-300">
        <div>
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Nexyrium Client Desk</span>
          <h2 className="text-xl font-black text-white mt-1.5">Client Collaboration Hub</h2>
          <p className="text-zinc-400 mt-1 text-[10px]">Download presentation exports, request copy revisions, and view billing invoices.</p>
        </div>

        {projects.length > 1 && (
          <select 
            value={selectedProjId}
            onChange={(e) => setSelectedProjId(e.target.value)}
            className="bg-zinc-955 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none cursor-pointer text-xs w-52 transition"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {activeProject ? (
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Left Columns: Track Progress & Deliverables */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Progress Card */}
            <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-5 shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest font-mono">Milestones Tracking</span>
                  <h3 className="font-extrabold text-white text-sm mt-1.5">Project Build Status</h3>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Delivery Target: {activeProject.deadline}</span>
              </div>

              {/* Progress Visualizer bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-zinc-400">Completion Stage: {activeProject.status}</span>
                  <span className="text-amber-500">{activeProject.progress}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${activeProject.progress}%` }} />
                </div>
              </div>

              {/* Milestones steps */}
              <div className="grid grid-cols-4 gap-2.5 pt-2 text-[10px] text-center font-bold text-zinc-550 select-none">
                {[
                  { label: "1. Research", done: activeProject.progress >= 20 },
                  { label: "2. Content Outline", done: activeProject.progress >= 40 },
                  { label: "3. Design Layout", done: activeProject.progress >= 65 },
                  { label: "4. Release Build", done: activeProject.progress >= 90 }
                ].map((step, idx) => (
                  <div key={idx} className={`p-3 border rounded-xl transition font-mono ${
                    step.done ? "border-amber-550/30 bg-amber-550/5 text-amber-500" : "border-zinc-800 bg-zinc-950/40"
                  }`}>
                    {step.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables Downloads */}
            <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-4">
                Deliverable Releases
              </h3>

              {loading ? (
                <div className="py-12 flex items-center justify-center text-zinc-500 font-mono">Scanning assets...</div>
              ) : deliverables.length > 0 ? (
                <div className="space-y-3">
                  {deliverables.map((del) => (
                    <div key={del.id} className="p-4 border border-zinc-800 bg-zinc-950/40 rounded-xl flex items-center justify-between gap-4 hover:border-zinc-700 transition">
                      <div>
                        <span className="font-bold text-white text-xs block">{del.name}</span>
                        <span className="text-[10px] text-zinc-500 block mt-1">Version: {del.version} • Published: {formatFriendlyDate(del.created_at)}</span>
                      </div>
                      <a
                        href={del.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-white font-bold rounded-xl flex items-center gap-1.5 transition border border-zinc-800 text-[11px]"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl text-zinc-550 font-bold uppercase tracking-wider font-mono">
                  <Clock className="h-6 w-6 text-zinc-650 mb-3" />
                  <span>No release artifacts published yet.</span>
                </div>
              )}
            </div>

            {/* Invoices */}
            <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-4">
                Billing & Retainers
              </h3>

              {loading ? (
                <div className="py-12 flex items-center justify-center text-zinc-500 font-mono">Retrieving statement...</div>
              ) : invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="p-4 border border-zinc-800 bg-zinc-955 rounded-xl flex items-center justify-between hover:border-zinc-700 transition">
                      <div>
                        <span className="font-bold text-zinc-200 block text-xs">Inv #{inv.id.replace("inv-", "")}</span>
                        <span className="text-[10px] text-zinc-500 block mt-1 font-mono">Due: {inv.due_at}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-extrabold text-white text-xs">${inv.amount.toLocaleString()}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold font-mono rounded border ${
                          inv.status === "PAID" 
                            ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl text-zinc-550 font-bold uppercase tracking-wider font-mono">
                  <CreditCard className="h-6 w-6 text-zinc-650 mb-3" />
                  <span>No billing invoices recorded.</span>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Revision Requests Form / Activity Messages */}
          <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl flex flex-col h-[560px] shadow-xl">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-4 shrink-0">
              Revision Request Box
            </h3>

            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1.5 custom-scrollbar">
              {comments.map((comm) => {
                const isClient = comm.content.startsWith("[Client Message]");
                const cleanContent = comm.content.replace("[Client Message] ", "");
                return (
                  <div key={comm.id} className={`p-4 rounded-xl max-w-[85%] shadow-sm ${
                    isClient 
                      ? "bg-amber-500/5 border border-amber-500/15 ml-auto text-right" 
                      : "bg-zinc-950 border border-zinc-800 mr-auto text-left"
                  }`}>
                    <span className="text-[9px] text-zinc-500 block font-mono font-bold">
                      {isClient ? "You (Client)" : "Nexyrium Consultant"}
                    </span>
                    <p className="text-[11px] text-zinc-200 leading-relaxed mt-1">{cleanContent}</p>
                    <span className="text-[8px] text-zinc-600 font-mono block mt-1.5">
                      {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input field */}
            <form onSubmit={handlePostMessage} className="flex gap-2 shrink-0 border-t border-zinc-800 pt-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Request a copy edit, color change..."
                className="flex-1 bg-zinc-955 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
              />
              <button 
                type="submit" 
                className="p-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition cursor-pointer shadow-md"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>
      ) : (
        <div className="py-24 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-2xl text-zinc-550 gap-2">
          <AlertCircle className="h-7 w-7 text-zinc-650" />
          <span className="font-bold text-zinc-455 uppercase tracking-wider font-mono text-[10px]">No client projects assigned</span>
          <span className="text-zinc-550 max-w-sm text-center">No active fundraising projects are assigned to this workspace account.</span>
        </div>
      )}

    </div>
  );
}
