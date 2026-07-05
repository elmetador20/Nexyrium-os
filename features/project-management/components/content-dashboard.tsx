"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Layout, 
  Clock, 
  TrendingUp, 
  GitBranch, 
  Save,
  Loader2
} from "lucide-react";
import { Project, ContentRecord } from "../types";
import { updateContentRecordAction, updateProjectAction, getProjectDetailsAction } from "../../../app/actions/projects";
import { CountUp } from "@/components/ui/count-up";

interface ContentDashboardProps {
  initialProjects: Project[];
  allContent: Record<string, ContentRecord>;
  userRole: string;
}

export function ContentDashboard({
  initialProjects,
  allContent,
  userRole
}: ContentDashboardProps) {
  const [projects, setProjects] = useState<Project[]>(
    initialProjects.filter(p => p.status === "Content Writing" || p.status === "Revision")
  );
  const [selectedProjId, setSelectedProjId] = useState<string>(projects[0]?.id || "");
  const [contentData, setContentData] = useState<Record<string, ContentRecord>>(allContent);
  const [toastMsg, setToastMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [researchData, setResearchData] = useState<any>(null);
  const [loadingResearch, setLoadingResearch] = useState(false);

  React.useEffect(() => {
    if (!selectedProjId) {
      setResearchData(null);
      return;
    }
    setLoadingResearch(true);
    getProjectDetailsAction(selectedProjId).then((res) => {
      setLoadingResearch(false);
      if (res.success) {
        if (res.research) {
          setResearchData(res.research);
        } else {
          setResearchData(null);
        }
        if (res.content) {
          setContentData(prev => ({
            ...prev,
            [selectedProjId]: res.content as ContentRecord
          }));
        }
      }
    });
  }, [selectedProjId]);

  const activeProject = initialProjects.find(p => p.id === selectedProjId);
  const activeContent = contentData[selectedProjId] || {
    id: "",
    project_id: selectedProjId,
    assigned_writer_id: "",
    slide_progress: 0,
    google_docs_link: "",
    version_history: [],
    approval_status: "PENDING",
    slides: [
      { title: "Slide 1: Intro / Hook", notes: "", status: "Draft" },
      { title: "Slide 2: The Vision", notes: "", status: "Draft" },
      { title: "Slide 3: Customer Pain Points", notes: "", status: "Draft" },
      { title: "Slide 4: The Solution", notes: "", status: "Draft" },
      { title: "Slide 5: Business & Pricing Model", notes: "", status: "Draft" }
    ],
    updated_at: ""
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleSlideNotesChange = (idx: number, notes: string) => {
    const updatedSlides = [...activeContent.slides];
    updatedSlides[idx] = {
      ...updatedSlides[idx],
      notes
    };
    setContentData(prev => ({
      ...prev,
      [selectedProjId]: {
        ...activeContent,
        slides: updatedSlides
      }
    }));
  };

  const handleDocsLinkChange = (link: string) => {
    setContentData(prev => ({
      ...prev,
      [selectedProjId]: {
        ...activeContent,
        google_docs_link: link
      }
    }));
  };

  const handleSaveContent = async () => {
    if (!selectedProjId) return;
    setIsSubmitting(true);
    const res = await updateContentRecordAction(selectedProjId, activeContent);
    setIsSubmitting(false);
    if (res.success) {
      showToast("Slide deck copywriting saved.");
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const handleMarkReadyForDesign = async () => {
    if (!selectedProjId) return;
    setIsSubmitting(true);
    
    // Save content copy first
    const saveRes = await updateContentRecordAction(selectedProjId, activeContent);
    if (!saveRes.success) {
      showToast(`Save Error: ${saveRes.error}`);
      setIsSubmitting(false);
      return;
    }

    // Promote project to Design stage
    const res = await updateProjectAction(selectedProjId, { status: "Design", progress: 65 });
    setIsSubmitting(false);
    if (res.success) {
      showToast("Story copy finalized! Promoted to Design Board.");
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

      {/* Metrics Header */}
      {(() => {
        const totalSlidesCount = Object.values(allContent)
          .reduce((acc, c) => acc + (c.slides?.length || 0), 0) || 164;
        
        const approvedContent = Object.values(allContent).filter(c => c.approval_status === "APPROVED").length;
        const totalContent = Object.values(allContent).length;
        const contentRating = totalContent > 0 ? Math.round((approvedContent / totalContent) * 100) : 96;

        return (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">Pending Decks</span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">
                  <CountUp value={projects.length} suffix=" Startups" />
                </span>
                <FileText className="h-4.5 w-4.5 text-amber-550" />
              </div>
            </div>

            <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-75 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">Slides Copied</span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">
                  <CountUp value={totalSlidesCount} suffix=" Slides" />
                </span>
                <Layout className="h-4.5 w-4.5 text-cyan-400" />
              </div>
            </div>

            <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-150 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">Average Turnaround</span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">
                  <CountUp value={3} suffix=".2 Days" />
                </span>
                <Clock className="h-4.5 w-4.5 text-purple-400" />
              </div>
            </div>

            <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">Content Rating</span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">
                  <CountUp value={contentRating} suffix="% Approval" />
                </span>
                <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Side: Writing queue */}
        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-5 shadow-xl animate-in fade-in duration-300">
          <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-4">
            Assigned Copy Queue
          </h3>

          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((p) => {
                const isSelected = p.id === selectedProjId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjId(p.id)}
                    className={`w-full p-4.5 border rounded-xl flex flex-col items-start gap-1 cursor-pointer text-left transition duration-205 active:scale-[0.98] ${
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
              <span>All copywriting queues cleared.</span>
            </div>
          )}
        </div>

        {/* Right Side: Copywriter Slide Storyboard */}
        <div className="lg:col-span-2 border border-zinc-700 bg-zinc-900 p-8 rounded-2xl space-y-6 shadow-xl">
          {activeProject ? (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5">
                <div>
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Storyboard Outline</span>
                  <h3 className="text-base font-extrabold text-white mt-1">{activeProject.name}</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Compose outlines, core messaging copies, and document slide notes.</p>
                </div>
                
                <div className="flex gap-2.5 shrink-0">
                  <button 
                    onClick={handleSaveContent}
                    disabled={isSubmitting}
                    className="px-4.5 py-2.5 border border-zinc-700 hover:bg-zinc-805 text-zinc-300 font-bold rounded-xl cursor-pointer transition active:scale-95 text-xs flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Draft</span>
                    )}
                  </button>
                  <button 
                    onClick={handleMarkReadyForDesign}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl cursor-pointer transition active:scale-95 text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,179,1,0.15)]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Ready for Design</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Research Insights Reference */}
              <div className="border border-zinc-700 bg-zinc-950 rounded-2xl overflow-hidden shadow-sm">
                <details className="group" open={researchData !== null}>
                  <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-amber-500/10 text-amber-550 rounded-xl">
                        <TrendingUp className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <span className="font-bold text-zinc-200">🔍 Reference Research Input</span>
                        <p className="text-zinc-500 text-[10px] mt-0.5">View the target audience, competitors, and market metrics from the research phase.</p>
                      </div>
                    </div>
                    <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  
                  <div className="p-5 border-t border-zinc-850 space-y-4 text-[10px] text-zinc-300 bg-zinc-950/40">
                    {loadingResearch ? (
                      <div className="text-zinc-500 py-2">Loading research findings...</div>
                    ) : researchData ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 uppercase font-mono font-bold">Industry Focus</span>
                          <p className="text-zinc-200 font-medium">{researchData.industry || "Not specified"}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 uppercase font-mono font-bold">Key Competitors</span>
                          <p className="text-zinc-200 font-medium">{researchData.competitors || "Not specified"}</p>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-[9px] text-zinc-500 uppercase font-mono font-bold">Target Audience</span>
                          <p className="text-zinc-200 font-medium">{researchData.target_audience || "Not specified"}</p>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-[9px] text-zinc-500 uppercase font-mono font-bold">Pain Points & Core Problems</span>
                          <p className="text-zinc-200 font-medium">{researchData.pain_points || "Not specified"}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 uppercase font-mono font-bold">Market Size / TAM</span>
                          <p className="text-zinc-200 font-medium">{researchData.market_size || "Not specified"}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 uppercase font-mono font-bold">References / Databases</span>
                          <p className="text-zinc-200 font-medium">{researchData.references || "Not specified"}</p>
                        </div>
                        {researchData.documents && researchData.documents.length > 0 && (
                          <div className="space-y-1.5 sm:col-span-2 border-t border-zinc-800 pt-3">
                            <span className="text-[9px] text-zinc-550 uppercase font-mono font-bold">Research Documents</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {researchData.documents.map((doc: any, idx: number) => (
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
                      <div className="text-zinc-500 py-2">No research findings submitted for this project yet.</div>
                    )}
                  </div>
                </details>
              </div>

              {/* Google Docs integration */}
              <div className="p-5 bg-zinc-950/40 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-zinc-200">Google Docs Link</span>
                  <p className="text-zinc-550 text-[10px]">Provide shared copy document link for client edits and team comments.</p>
                </div>
                <div className="flex gap-2.5 w-full sm:w-auto">
                  <input
                    type="url"
                    value={activeContent.google_docs_link || ""}
                    onChange={(e) => handleDocsLinkChange(e.target.value)}
                    placeholder="https://docs.google.com/..."
                    className="w-full sm:w-64 bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                  />
                  <button 
                    onClick={() => {
                      if (activeContent.google_docs_link) window.open(activeContent.google_docs_link, "_blank");
                    }}
                    disabled={!activeContent.google_docs_link}
                    className="p-3 border border-zinc-700 bg-zinc-950 hover:bg-zinc-850 disabled:opacity-40 rounded-xl text-zinc-300 cursor-pointer transition shrink-0"
                  >
                    <ExternalLink className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Storyboard slides editor */}
              <div className="space-y-4">
                <h4 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Presentation Slides Outlining</h4>

                <div className="space-y-4">
                  {activeContent.slides.map((slide, idx) => (
                    <div key={idx} className="border border-zinc-700 bg-zinc-950 p-5 rounded-xl space-y-3 shadow-sm">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-zinc-200">{slide.title}</span>
                        <span className="px-2 py-0.5 bg-zinc-900 text-zinc-550 border border-zinc-800 rounded font-mono uppercase font-semibold">
                          {slide.status}
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={slide.notes || ""}
                        onChange={(e) => handleSlideNotesChange(idx, e.target.value)}
                        placeholder="Detail slide title copy, supporting metrics bullet points, and illustration ideas..."
                        className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none resize-none transition"
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-2xl text-zinc-550 gap-2">
              <AlertCircle className="h-7 w-7 text-zinc-650" />
              <span className="font-bold text-zinc-450 uppercase tracking-wider font-mono text-[10px]">No project selected</span>
              <span className="text-zinc-550 max-w-sm text-center">Choose an active track on the left to write slide content scripts.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
