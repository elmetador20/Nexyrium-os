"use client";

import React, { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { ProjectServiceType, ProjectPriority } from "../types";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allUsers: any[];
  onSubmit: (values: any) => Promise<void>;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  allUsers,
  onSubmit
}: CreateProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const values = {
      name: formData.get("name") as string,
      startupName: formData.get("startupName") as string,
      clientId: formData.get("clientId") as string,
      serviceType: formData.get("serviceType") as ProjectServiceType,
      priority: formData.get("priority") as ProjectPriority,
      description: formData.get("description") as string,
      deadline: formData.get("deadline") as string,
      projectManagerId: formData.get("projectManagerId") as string,
      researcherId: formData.get("researcherId") as string,
      contentWriterId: formData.get("contentWriterId") as string,
      designerId: formData.get("designerId") as string,
      qaId: formData.get("qaId") as string,
      notes: formData.get("notes") as string
    };

    if (!values.name || !values.startupName || !values.deadline) {
      setErrorMsg("Please fill in all required fields (*).");
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(values);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-amber-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Initialize Nexyrium Engagement</h3>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white cursor-pointer transition"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar text-xs">
          
          {errorMsg && (
            <p className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl">
              {errorMsg}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Project Name */}
            <div className="space-y-2">
              <label className="font-semibold text-zinc-400">Project / Engagement Title *</label>
              <input 
                required 
                name="name" 
                placeholder="e.g. Series A Pitch Deck Curation" 
                type="text" 
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
              />
            </div>

            {/* Startup Name */}
            <div className="space-y-2">
              <label className="font-semibold text-zinc-400">Client Startup Name *</label>
              <input 
                required 
                name="startupName" 
                placeholder="e.g. EcoSphere Inc." 
                type="text" 
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition" 
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {/* Service Type */}
            <div className="space-y-2">
              <label className="font-semibold text-zinc-400">Service Track</label>
              <select name="serviceType" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none cursor-pointer focus:border-amber-500 transition">
                <option value="Pitch Deck">Pitch Deck</option>
                <option value="Financial Model">Financial Model</option>
                <option value="Business Plan">Business Plan</option>
                <option value="Investor Outreach">Investor Outreach</option>
                <option value="Grant Proposal">Grant Proposal</option>
                <option value="Fundraising Strategy">Fundraising Strategy</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="font-semibold text-zinc-400">Priority Level</label>
              <select name="priority" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none cursor-pointer focus:border-amber-500 transition">
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <label className="font-semibold text-zinc-400">Target Delivery Deadline *</label>
              <input 
                required 
                name="deadline" 
                type="date" 
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition cursor-pointer" 
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="font-semibold text-zinc-400">Project Scoping Description</label>
            <textarea 
              name="description" 
              rows={3} 
              placeholder="Outline major deliverables, startup background, or key presentation slide scopes..." 
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none resize-none focus:border-amber-500 transition" 
            />
          </div>

          {/* Assignees Resource allocation */}
          <div className="border-t border-zinc-800 pt-6 space-y-4">
            <h4 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Resource Allocation Seats</h4>
            
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Client Partner</label>
                <select name="clientId" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition cursor-pointer">
                  <option value="">Unassigned</option>
                  {allUsers.filter(u => u.roleName === "CLIENT").map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Project Manager Seat</label>
                <select name="projectManagerId" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition cursor-pointer">
                  <option value="">Unassigned</option>
                  {allUsers.filter(u => u.roleName === "PROJECT_MANAGER" || u.roleName === "SUPER_ADMIN" || u.roleName === "CEO").map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Researcher Seat</label>
                <select name="researcherId" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition cursor-pointer">
                  <option value="">Unassigned</option>
                  {allUsers.filter(u => u.roleName === "RESEARCHER").map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Content Writer Seat</label>
                <select name="contentWriterId" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition cursor-pointer">
                  <option value="">Unassigned</option>
                  {allUsers.filter(u => u.roleName === "CONTENT_WRITER").map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Lead Designer Seat</label>
                <select name="designerId" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition cursor-pointer">
                  <option value="">Unassigned</option>
                  {allUsers.filter(u => u.roleName === "DESIGNER").map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Quality Assurance Auditor Seat</label>
                <select name="qaId" className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition cursor-pointer">
                  <option value="">Unassigned</option>
                  {allUsers.filter(u => u.roleName === "QA").map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Operational Notes */}
          <div className="space-y-2">
            <label className="font-semibold text-zinc-400">Internal Directives / Notes</label>
            <textarea 
              name="notes" 
              rows={2} 
              placeholder="e.g. Minimalist layout matching Canva brand book." 
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl p-3 outline-none resize-none focus:border-amber-500 transition" 
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-6">
            <button 
              type="button" 
              onClick={() => onOpenChange(false)}
              className="px-4.5 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold rounded-xl cursor-pointer transition text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold rounded-xl cursor-pointer transition flex items-center gap-1.5 text-xs shadow-[0_0_15px_rgba(245,179,1,0.15)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Launching...</span>
                </>
              ) : (
                <span>Launch Project</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
