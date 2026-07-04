"use client";

import React, { useState } from "react";
import { 
  Palette, 
  Plus, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Image as ImageIcon, 
  Clock, 
  TrendingUp, 
  Upload, 
  Save, 
  FileCheck 
} from "lucide-react";
import { Project, DesignRecord } from "../types";
import { updateDesignRecordAction, updateProjectAction, getProjectDetailsAction } from "../../../app/actions/projects";
import { createClient } from "@/lib/supabase/client";

interface DesignDashboardProps {
  initialProjects: Project[];
  allDesign: Record<string, DesignRecord>;
  userRole: string;
}

export function DesignDashboard({
  initialProjects,
  allDesign,
  userRole
}: DesignDashboardProps) {
  const [projects, setProjects] = useState<Project[]>(
    initialProjects.filter(p => p.status === "Design" || p.status === "Revision")
  );
  const [selectedProjId, setSelectedProjId] = useState<string>(projects[0]?.id || "");
  const [designData, setDesignData] = useState<Record<string, DesignRecord>>(allDesign);
  const [toastMsg, setToastMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contentDataReference, setContentDataReference] = useState<any>(null);
  const [researchDataReference, setResearchDataReference] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  React.useEffect(() => {
    if (!selectedProjId) {
      setContentDataReference(null);
      setResearchDataReference(null);
      return;
    }
    setLoadingContent(true);
    getProjectDetailsAction(selectedProjId).then((res) => {
      setLoadingContent(false);
      if (res.success) {
        if (res.content) {
          setContentDataReference(res.content);
        } else {
          setContentDataReference(null);
        }
        if (res.research) {
          setResearchDataReference(res.research);
        } else {
          setResearchDataReference(null);
        }
        if (res.design) {
          setDesignData(prev => ({
            ...prev,
            [selectedProjId]: res.design as DesignRecord
          }));
        }
      }
    });
  }, [selectedProjId]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        return;
      }

      const { data: urlData } = supabase.storage
        .from("presentations")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      const isPdf = fileExt === "pdf";
      const isPptx = fileExt === "pptx";

      const updatedDesign = {
        ...activeDesign,
        ...(isPdf ? { pdf_export_url: publicUrl } : {}),
        ...(isPptx ? { pptx_export_url: publicUrl } : {}),
        ...(!isPdf && !isPptx ? { pdf_export_url: publicUrl } : {})
      };

      setDesignData(prev => ({
        ...prev,
        [selectedProjId]: updatedDesign
      }));

      const res = await updateDesignRecordAction(selectedProjId, updatedDesign);
      if (res.success) {
        showToast(`Uploaded successfully as ${isPptx ? "PPTX" : "PDF"}!`);
      } else {
        showToast(`Uploaded, but DB save failed: ${res.error}`);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      showToast(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const activeProject = initialProjects.find(p => p.id === selectedProjId);
  const activeDesign = designData[selectedProjId] || {
    id: "",
    project_id: selectedProjId,
    assigned_designer_id: "",
    canva_link: "",
    brand_kit: {
      logo: "",
      fonts: "Outfit, Inter",
      colors: ["#000000", "#FFFFFF"],
      icons: "Feather Icons",
      illustrations: "Minimal Vectors"
    },
    pdf_export_url: "",
    pptx_export_url: "",
    approval_status: "PENDING",
    updated_at: ""
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleBrandKitChange = (field: string, val: any) => {
    setDesignData(prev => ({
      ...prev,
      [selectedProjId]: {
        ...activeDesign,
        brand_kit: {
          ...activeDesign.brand_kit,
          [field]: val
        }
      }
    }));
  };

  const handleInputChange = (field: keyof DesignRecord, val: any) => {
    setDesignData(prev => ({
      ...prev,
      [selectedProjId]: {
        ...activeDesign,
        [field]: val
      }
    }));
  };

  const handleSaveDesign = async () => {
    if (!selectedProjId) return;
    setIsSubmitting(true);
    const res = await updateDesignRecordAction(selectedProjId, activeDesign);
    setIsSubmitting(false);
    if (res.success) {
      showToast("Design brand kit and file links saved.");
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const handleMarkReadyForQA = async () => {
    if (!selectedProjId) return;
    setIsSubmitting(true);
    
    // Save design record first
    const saveRes = await updateDesignRecordAction(selectedProjId, activeDesign);
    if (!saveRes.success) {
      showToast(`Save Error: ${saveRes.error}`);
      setIsSubmitting(false);
      return;
    }

    // Promote project to QA stage
    const res = await updateProjectAction(selectedProjId, { status: "QA", progress: 80 });
    setIsSubmitting(false);
    if (res.success) {
      showToast("Design templates submitted! Project promoted to QA audit review.");
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

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Pending Boards</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">{projects.length} Startups</span>
            <Palette className="h-4.5 w-4.5 text-amber-550" />
          </div>
        </div>

        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-75">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Exports Finalized</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">38 Decks</span>
            <ImageIcon className="h-4.5 w-4.5 text-cyan-400" />
          </div>
        </div>

        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-150">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Design SLA</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">72 Hours</span>
            <Clock className="h-4.5 w-4.5 text-purple-400" />
          </div>
        </div>

        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-200">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Creative Score</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">98.5% Pass</span>
            <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Side: Creative queue */}
        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-5 shadow-xl animate-in fade-in duration-300">
          <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-4">
            Assigned Creative Queue
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
                            : "bg-zinc-900 text-zinc-550 border-zinc-800"
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
            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl text-zinc-550 font-bold uppercase tracking-wider font-mono">
              <CheckCircle className="h-6 w-6 text-zinc-650 mb-3" />
              <span>All design queues cleared.</span>
            </div>
          )}
        </div>

        {/* Right Side: Creative Brand board / File Links */}
        <div className="lg:col-span-2 border border-zinc-700 bg-zinc-900 p-8 rounded-2xl space-y-6 shadow-xl">
          {activeProject ? (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5">
                <div>
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Design Studio</span>
                  <h3 className="text-base font-extrabold text-white mt-1">{activeProject.name}</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Manage corporate logo guides, typography rules, Canva assets, and release builds.</p>
                </div>
                
                <div className="flex gap-2.5 shrink-0">
                  <button 
                    onClick={handleSaveDesign}
                    disabled={isSubmitting}
                    className="px-4.5 py-2.5 border border-zinc-700 hover:bg-zinc-805 text-zinc-300 font-bold rounded-xl cursor-pointer transition text-xs"
                  >
                    Save Draft
                  </button>
                  <button 
                    onClick={handleMarkReadyForQA}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl cursor-pointer transition text-xs"
                  >
                    Ready for QA
                  </button>
                </div>
              </div>

              {/* Content Writer Copy Reference */}
              <div className="border border-zinc-700 bg-zinc-950 rounded-2xl overflow-hidden shadow-sm">
                <details className="group" open={contentDataReference !== null}>
                  <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-amber-500/10 text-amber-550 rounded-xl">
                        <FileCheck className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <span className="font-bold text-zinc-200">📝 Reference Slide Copy Input</span>
                        <p className="text-zinc-500 text-[10px] mt-0.5">Read the copywriting structure, narrative outlines, and Google Docs copy link.</p>
                      </div>
                    </div>
                    <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  
                  <div className="p-5 border-t border-zinc-850 space-y-4 text-[10px] text-zinc-300 bg-zinc-950/40">
                    {loadingContent ? (
                      <div className="text-zinc-500 py-2 font-mono">Loading copywriting assets...</div>
                    ) : contentDataReference ? (
                      <div className="space-y-4">
                        {contentDataReference.google_docs_link && (
                          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <span className="font-bold text-zinc-300">Google Docs Slide Copy</span>
                              <p className="text-zinc-500 text-[9px] truncate">{contentDataReference.google_docs_link}</p>
                            </div>
                            <button
                              onClick={() => { if (contentDataReference.google_docs_link) window.open(contentDataReference.google_docs_link, "_blank"); }}
                              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl flex items-center gap-1.5 border border-zinc-800 cursor-pointer shrink-0 transition"
                            >
                              Open Copy Docs <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <span className="text-[9px] text-zinc-550 uppercase font-mono font-bold">Slide Outlines & Copy Notes</span>
                          {contentDataReference.slides && contentDataReference.slides.length > 0 ? (
                            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                              {contentDataReference.slides.map((s: any, idx: number) => (
                                <div key={idx} className="p-3 bg-zinc-950 border border-zinc-805 rounded-xl">
                                  <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 mb-1.5">
                                    <span>{s.title}</span>
                                    <span className="text-zinc-555 uppercase font-mono">{s.status}</span>
                                  </div>
                                  <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{s.notes || "No content copy written yet for this slide."}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-zinc-500 font-mono">No slide copy created yet.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-zinc-550 py-2 font-mono">No copywriting files submitted for this project yet.</div>
                    )}
                  </div>
                </details>
              </div>

              {/* Reference Research Input */}
              <div className="border border-zinc-700 bg-zinc-950 rounded-2xl overflow-hidden mt-3 shadow-sm">
                <details className="group" open={researchDataReference !== null}>
                  <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-amber-500/10 text-amber-550 rounded-xl">
                        <TrendingUp className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <span className="font-bold text-zinc-200">🔍 Reference Research Input</span>
                        <p className="text-zinc-500 text-[10px] mt-0.5">View target audience, competitors, and market metrics from the research phase.</p>
                      </div>
                    </div>
                    <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  
                  <div className="p-5 border-t border-zinc-850 space-y-4 text-[10px] text-zinc-300 bg-zinc-950/40">
                    {loadingContent ? (
                      <div className="text-zinc-550 py-2 font-mono">Loading research findings...</div>
                    ) : researchDataReference ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-550 uppercase font-mono font-bold">Industry Focus</span>
                          <p className="text-zinc-200 font-medium">{researchDataReference.industry || "Not specified"}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-550 uppercase font-mono font-bold">Key Competitors</span>
                          <p className="text-zinc-200 font-medium">{researchDataReference.competitors || "Not specified"}</p>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-[9px] text-zinc-555 uppercase font-mono font-bold">Target Audience</span>
                          <p className="text-zinc-200 font-medium">{researchDataReference.target_audience || "Not specified"}</p>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-[9px] text-zinc-555 uppercase font-mono font-bold">Pain Points & Core Problems</span>
                          <p className="text-zinc-200 font-medium">{researchDataReference.pain_points || "Not specified"}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-555 uppercase font-mono font-bold">Market Size / TAM</span>
                          <p className="text-zinc-200 font-medium">{researchDataReference.market_size || "Not specified"}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-555 uppercase font-mono font-bold">References / Databases</span>
                          <p className="text-zinc-200 font-medium">{researchDataReference.references || "Not specified"}</p>
                        </div>
                        {researchDataReference.documents && researchDataReference.documents.length > 0 && (
                          <div className="space-y-1.5 sm:col-span-2 border-t border-zinc-800 pt-3">
                            <span className="text-[9px] text-zinc-550 uppercase font-mono font-bold">Research Documents</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {researchDataReference.documents.map((doc: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-300 hover:text-white flex items-center gap-1.5 transition text-[10px]"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                                  <span>{doc.name}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-zinc-550 py-2 font-mono">No research findings submitted for this project yet.</div>
                    )}
                  </div>
                </details>
              </div>

              {/* Design Brand Kit Spec */}
              <div className="space-y-4">
                <h4 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Brand Kit Specification</h4>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="font-semibold text-zinc-400">Typography / Fonts</label>
                    <input
                      type="text"
                      value={activeDesign.brand_kit.fonts || ""}
                      onChange={(e) => handleBrandKitChange("fonts", e.target.value)}
                      placeholder="e.g. Outfit, Inter Mono"
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-semibold text-zinc-400">Illustration / Icon Kit Style</label>
                    <input
                      type="text"
                      value={activeDesign.brand_kit.icons || ""}
                      onChange={(e) => handleBrandKitChange("icons", e.target.value)}
                      placeholder="e.g. Custom 3D mesh vectors, flat-minimal outline"
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Logo Graphic URL</label>
                  <input
                    type="url"
                    value={activeDesign.brand_kit.logo || ""}
                    onChange={(e) => handleBrandKitChange("logo", e.target.value)}
                    placeholder="https://client-logo.png"
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                  />
                </div>
              </div>

              {/* Canva & Presentation links */}
              <div className="space-y-4 border-t border-zinc-805 pt-5">
                <h4 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Canva Workspace & Exports</h4>

                <div className="p-5 bg-zinc-950/40 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-zinc-200">Canva Design URL</span>
                    <p className="text-zinc-550 text-[10px]">Provide shared workspace link for collaborative slides styling.</p>
                  </div>
                  <div className="flex gap-2.5 w-full sm:w-auto">
                    <input
                      type="url"
                      value={activeDesign.canva_link || ""}
                      onChange={(e) => handleInputChange("canva_link", e.target.value)}
                      placeholder="https://canva.com/design/..."
                      className="w-full sm:w-64 bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                    />
                    <button 
                      onClick={() => {
                        if (activeDesign.canva_link) window.open(activeDesign.canva_link, "_blank");
                      }}
                      disabled={!activeDesign.canva_link}
                      className="p-3 border border-zinc-700 bg-zinc-950 hover:bg-zinc-850 disabled:opacity-40 rounded-xl text-zinc-300 cursor-pointer transition shrink-0"
                    >
                      <ExternalLink className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="font-semibold text-zinc-400">PDF Release Link</label>
                    <input
                      type="url"
                      value={activeDesign.pdf_export_url || ""}
                      onChange={(e) => handleInputChange("pdf_export_url", e.target.value)}
                      placeholder="https://bucket.supabase.com/release.pdf"
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-semibold text-zinc-400">PowerPoint (PPTX) Release Link</label>
                    <input
                      type="url"
                      value={activeDesign.pptx_export_url || ""}
                      onChange={(e) => handleInputChange("pptx_export_url", e.target.value)}
                      placeholder="https://bucket.supabase.com/release.pptx"
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Design Release build uploader */}
              <div className="border-t border-zinc-805 pt-5 space-y-4">
                <h4 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Upload Pitch Presentation Files</h4>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".pdf,.pptx" 
                  className="hidden" 
                />

                <div 
                  onClick={handleUploadClick}
                  className={`border border-dashed rounded-xl p-6.5 flex flex-col items-center justify-center text-center cursor-pointer transition duration-200 ${
                    uploading 
                      ? "border-amber-500/50 bg-amber-500/5 animate-pulse cursor-not-allowed" 
                      : "border-zinc-700 bg-zinc-950/40 hover:border-zinc-500 hover:bg-zinc-950"
                  }`}
                >
                  <Upload className={`h-6.5 w-6.5 mb-1.5 ${uploading ? "text-amber-500" : "text-zinc-500"}`} />
                  <span className="font-bold text-[10px] text-zinc-300">
                    {uploading ? "Uploading presentation asset..." : "Drag & Drop or click to upload presentation artifact"}
                  </span>
                  <span className="text-[9px] text-zinc-605 mt-1">Supports PDF, PPTX up to 100MB</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-2xl text-zinc-550 gap-2">
              <AlertCircle className="h-7 w-7 text-zinc-650" />
              <span className="font-bold text-zinc-455 uppercase tracking-wider font-mono text-[10px]">No project selected</span>
              <span className="text-zinc-550 max-w-sm text-center">Choose an active track on the left to start importing brand assets.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
