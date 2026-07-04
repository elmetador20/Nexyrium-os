"use client";

import React, { useState } from "react";
import { 
  Search, 
  Database, 
  Globe, 
  BookOpen, 
  FileText, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Briefcase,
  Upload,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { Project, ResearchRecord } from "../types";
import { updateResearchRecordAction, updateProjectAction, getProjectDetailsAction } from "../../../app/actions/projects";
import { createClient } from "@/lib/supabase/client";

interface ResearchDashboardProps {
  initialProjects: Project[];
  allResearch: Record<string, ResearchRecord>;
  userRole: string;
}

export function ResearchDashboard({
  initialProjects,
  allResearch,
  userRole
}: ResearchDashboardProps) {
  const [projects, setProjects] = useState<Project[]>(
    initialProjects.filter(p => p.status === "Research" || p.status === "Received" || p.status === "Revision")
  );
  const [selectedProjId, setSelectedProjId] = useState<string>(projects[0]?.id || "");
  const [researchData, setResearchData] = useState<Record<string, ResearchRecord>>(allResearch);
  const [toastMsg, setToastMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!selectedProjId) return;
    setLoadingResearch(true);
    getProjectDetailsAction(selectedProjId).then((res) => {
      setLoadingResearch(false);
      if (res.success && res.research) {
        setResearchData(prev => ({
          ...prev,
          [selectedProjId]: res.research as ResearchRecord
        }));
      }
    });
  }, [selectedProjId]);

  const handleUploadClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjId) return;

    setUploading(true);
    showToast(`Uploading ${file.name}...`);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = `${selectedProjId}/${fileName}`;

      const { error } = await supabase.storage
        .from("presentations")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("Storage upload error:", error);
        showToast(`Upload failed: ${error.message}`);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("presentations")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      const newDoc = { name: file.name, url: publicUrl };
      const updatedDocs = [...(activeResearch.documents || []), newDoc];

      setResearchData(prev => ({
        ...prev,
        [selectedProjId]: {
          ...activeResearch,
          documents: updatedDocs
        }
      }));
      setUploading(false);
      showToast("Uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      setUploading(false);
      showToast("Upload failed.");
    }
  };

  const activeProject = initialProjects.find(p => p.id === selectedProjId);
  const activeResearch = researchData[selectedProjId] || {
    id: "",
    project_id: selectedProjId,
    industry: "",
    competitors: "",
    target_audience: "",
    pain_points: "",
    market_size: "",
    tam: "",
    sam: "",
    som: "",
    references: "",
    documents: [],
    assigned_researcher_id: "",
    updated_at: ""
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleInputChange = (field: keyof ResearchRecord, val: any) => {
    setResearchData(prev => ({
      ...prev,
      [selectedProjId]: {
        ...activeResearch,
        [field]: val
      }
    }));
  };

  const handleSaveResearch = async () => {
    if (!selectedProjId) return;
    setIsSubmitting(true);
    const res = await updateResearchRecordAction(selectedProjId, activeResearch);
    setIsSubmitting(false);
    if (res.success) {
      showToast("Research library dossier updated successfully.");
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const handleMarkReadyForReview = async () => {
    if (!selectedProjId) return;
    setIsSubmitting(true);
    
    // Save research dossier first
    const saveRes = await updateResearchRecordAction(selectedProjId, activeResearch);
    if (!saveRes.success) {
      showToast(`Save Error: ${saveRes.error}`);
      setIsSubmitting(false);
      return;
    }

    // Move project to Content Writing stage once research is finalized
    const res = await updateProjectAction(selectedProjId, { status: "Content Writing", progress: 40 });
    setIsSubmitting(false);
    if (res.success) {
      showToast("Research Dossier submitted! Project promoted to Content Writing.");
      setProjects(prev => prev.filter(p => p.id !== selectedProjId));
      setSelectedProjId(projects.find(p => p.id !== selectedProjId)?.id || "");
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

      {/* Metric Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300">
          <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">Pending Tracks</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">{projects.length} Startups</span>
            <Database className="h-4.5 w-4.5 text-amber-550" />
          </div>
        </div>

        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-75">
          <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">TAM Scopes Done</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">42 Dossiers</span>
            <BookOpen className="h-4.5 w-4.5 text-emerald-400" />
          </div>
        </div>

        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-150">
          <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">Research SLA</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">48 Hours</span>
            <Clock className="h-4.5 w-4.5 text-amber-500" />
          </div>
        </div>

        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-200">
          <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">Global Intelligence</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">18 Sectors</span>
            <Globe className="h-4.5 w-4.5 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Side: Projects in queue */}
        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-5 shadow-xl animate-in fade-in duration-300">
          <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-4">
            Assigned Research Queue
          </h3>

          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((p) => {
                const isSelected = p.id === selectedProjId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjId(p.id)}
                    className={`w-full p-4.5 border rounded-xl flex flex-col items-start gap-1 cursor-pointer text-left transition duration-205 ${
                      isSelected 
                        ? "bg-zinc-950 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/20" 
                        : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-950"
                    }`}
                  >
                    <span className="font-bold text-xs text-white">{p.name}</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">Startup: {p.startup_name}</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[8px] px-1.5 py-0.2 rounded font-mono uppercase font-bold border ${
                        p.priority === "URGENT" 
                          ? "bg-red-500/10 text-red-400 border-red-500/20" 
                          : p.priority === "HIGH" 
                            ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                            : "bg-zinc-900 text-zinc-500 border-zinc-800"
                      }`}>
                        {p.priority}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">Due: {p.deadline}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 font-bold uppercase tracking-wider font-mono">
              <CheckCircle className="h-6 w-6 text-zinc-650 mb-3" />
              <span>All research complete.</span>
            </div>
          )}
        </div>

        {/* Right Side: Research Library dossier editor */}
        <div className="lg:col-span-2 border border-zinc-700 bg-zinc-900 p-8 rounded-2xl space-y-6 shadow-xl">
          {activeProject ? (
            <div className="space-y-6">
              
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5">
                <div>
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Dossier Builder</span>
                  <h3 className="text-base font-extrabold text-white mt-1">{activeProject.name}</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Fill out sector stats, target addressable metrics (TAM/SAM/SOM), and references.</p>
                </div>
                
                <div className="flex gap-2.5 shrink-0">
                  <button 
                    onClick={handleSaveResearch}
                    disabled={isSubmitting}
                    className="px-4.5 py-2.5 border border-zinc-700 hover:bg-zinc-805 text-zinc-300 font-bold rounded-xl cursor-pointer transition text-xs"
                  >
                    Save Draft
                  </button>
                  <button 
                    onClick={handleMarkReadyForReview}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl cursor-pointer transition text-xs"
                  >
                    Ready for Review
                  </button>
                </div>
              </div>

              {/* Dossier Fields */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Target Industry Sector</label>
                  <input
                    type="text"
                    value={activeResearch.industry || ""}
                    onChange={(e) => handleInputChange("industry", e.target.value)}
                    placeholder="e.g. ClimateTech B2B SaaS"
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Key Competitors</label>
                  <input
                    type="text"
                    value={activeResearch.competitors || ""}
                    onChange={(e) => handleInputChange("competitors", e.target.value)}
                    placeholder="e.g. Pachama, Watershed, CarbonDirect"
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Total Addressable Market (TAM)</label>
                  <input
                    type="text"
                    value={activeResearch.tam || ""}
                    onChange={(e) => handleInputChange("tam", e.target.value)}
                    placeholder="e.g. $50 Billion"
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Serviceable Addressable Market (SAM)</label>
                  <input
                    type="text"
                    value={activeResearch.sam || ""}
                    onChange={(e) => handleInputChange("sam", e.target.value)}
                    placeholder="e.g. $12.5 Billion"
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Serviceable Obtainable Market (SOM)</label>
                  <input
                    type="text"
                    value={activeResearch.som || ""}
                    onChange={(e) => handleInputChange("som", e.target.value)}
                    placeholder="e.g. $1.8 Billion"
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Target Audience Demographics</label>
                <textarea
                  rows={2}
                  value={activeResearch.target_audience || ""}
                  onChange={(e) => handleInputChange("target_audience", e.target.value)}
                  placeholder="Describe buyer personas, decision makers, and ticket size thresholds..."
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none resize-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">Core Customer Pain Points</label>
                <textarea
                  rows={2}
                  value={activeResearch.pain_points || ""}
                  onChange={(e) => handleInputChange("pain_points", e.target.value)}
                  placeholder="What friction points does the client product resolve?"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none resize-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-zinc-400">References & Bibliography</label>
                <textarea
                  rows={2}
                  value={activeResearch.references || ""}
                  onChange={(e) => handleInputChange("references", e.target.value)}
                  placeholder="Paste market report links, venture capital logs, databases used..."
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none resize-none transition"
                />
              </div>

              {/* Research library uploads */}
              <div className="border-t border-zinc-800 pt-5 space-y-4">
                <h4 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Research Documents</h4>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div 
                    onClick={handleUploadClick}
                    className="border border-dashed border-zinc-700 bg-zinc-950/40 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-zinc-500 transition"
                  >
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx,.ppt,.txt"
                      className="hidden"
                    />
                    <Upload className="h-5.5 w-5.5 text-zinc-500 mb-1.5" />
                    <span className="font-bold text-[10px] text-zinc-300">
                      {uploading ? "Uploading..." : "Upload research document"}
                    </span>
                    <span className="text-[9px] text-zinc-600 mt-1">Maximum size: 50MB</span>
                  </div>

                  <div className="border border-zinc-800 bg-zinc-950/30 rounded-xl p-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      {activeResearch.documents && activeResearch.documents.length > 0 ? (
                        activeResearch.documents.map((doc: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-805 rounded-xl">
                            <span className="font-semibold text-zinc-300 truncate max-w-[130px]">{doc.name}</span>
                            {doc.url && (
                              <button 
                                onClick={() => window.open(doc.url, "_blank")}
                                className="text-zinc-500 hover:text-white cursor-pointer bg-transparent border-none p-1 hover:bg-zinc-900 rounded"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-zinc-650 text-center py-6 font-medium">No documents uploaded yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-2xl text-zinc-550 gap-2">
              <AlertCircle className="h-7 w-7 text-zinc-650" />
              <span className="font-bold text-zinc-450 uppercase tracking-wider font-mono text-[10px]">No project selected</span>
              <span className="text-zinc-550 max-w-sm text-center">Choose a startup track on the left to begin compiling industry market research.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
