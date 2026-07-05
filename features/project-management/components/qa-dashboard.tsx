"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Plus, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  Save,
  Loader2
} from "lucide-react";
import { Project, QARecord, DesignRecord } from "../types";
import { updateQARecordAction, updateProjectAction, getProjectDetailsAction } from "../../../app/actions/projects";
import { CountUp } from "@/components/ui/count-up";

interface QADashboardProps {
  initialProjects: Project[];
  allQA: Record<string, QARecord>;
  allDesign: Record<string, DesignRecord>;
  userRole: string;
}

export function QADashboard({
  initialProjects,
  allQA,
  allDesign,
  userRole
}: QADashboardProps) {
  const [projects, setProjects] = useState<Project[]>(
    initialProjects.filter(p => p.status === "QA" || p.status === "Revision")
  );
  const [selectedProjId, setSelectedProjId] = useState<string>(projects[0]?.id || "");
  const [qaData, setQaData] = useState<Record<string, QARecord>>(allQA);
  const [toastMsg, setToastMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [designDataReference, setDesignDataReference] = useState<any>(null);
  const [contentDataReference, setContentDataReference] = useState<any>(null);
  const [loadingDesign, setLoadingDesign] = useState(false);

  React.useEffect(() => {
    if (!selectedProjId) {
      setDesignDataReference(null);
      setContentDataReference(null);
      return;
    }
    setLoadingDesign(true);
    getProjectDetailsAction(selectedProjId).then((res) => {
      setLoadingDesign(false);
      if (res.success) {
        if (res.design) {
          setDesignDataReference(res.design);
        } else {
          setDesignDataReference(null);
        }
        if (res.content) {
          setContentDataReference(res.content);
        } else {
          setContentDataReference(null);
        }
        if (res.qa) {
          setQaData(prev => ({
            ...prev,
            [selectedProjId]: res.qa as QARecord
          }));
        }
      }
    });
  }, [selectedProjId]);

  const activeProject = initialProjects.find(p => p.id === selectedProjId);
  const activeQA = qaData[selectedProjId] || {
    id: "",
    project_id: selectedProjId,
    assigned_qa_id: "",
    checklist: {
      grammar: false,
      alignment: false,
      typography: false,
      charts: false,
      icons: false,
      images: false,
      consistency: false,
      brandCompliance: false,
      storyFlow: false
    },
    status: "PENDING",
    comments: "",
    updated_at: ""
  };
  
  const activeQAProjectDesign = allDesign[selectedProjId];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleCheckboxChange = (key: keyof QARecord["checklist"]) => {
    setQaData(prev => ({
      ...prev,
      [selectedProjId]: {
        ...activeQA,
        checklist: {
          ...activeQA.checklist,
          [key]: !activeQA.checklist[key]
        }
      }
    }));
  };

  const handleCommentsChange = (comments: string) => {
    setQaData(prev => ({
      ...prev,
      [selectedProjId]: {
        ...activeQA,
        comments
      }
    }));
  };

  const handleSaveQA = async () => {
    if (!selectedProjId) return;
    setIsSubmitting(true);
    const res = await updateQARecordAction(selectedProjId, activeQA);
    setIsSubmitting(false);
    if (res.success) {
      showToast("QA checklist saved.");
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const handleAuditAction = async (status: "Client Review" | "Revision") => {
    if (!selectedProjId) return;
    setIsSubmitting(true);
    
    // Save checklist first
    const saveRes = await updateQARecordAction(selectedProjId, {
      ...activeQA,
      status: status === "Client Review" ? "APPROVED" : "REJECTED_REVISION"
    });

    if (saveRes.success) {
      // Promote project status
      const res = await updateProjectAction(selectedProjId, { 
        status, 
        progress: status === "Client Review" ? 90 : 85 
      });
      
      if (res.success) {
        showToast(
          status === "Client Review"
            ? "Project approved! Promoted to Client Review."
            : "Revision requested! Reverted back to draft queues."
        );
        setProjects(prev => prev.filter(p => p.id !== selectedProjId));
        setSelectedProjId(projects.find(p => p.id !== selectedProjId)?.id || "");
      } else {
        showToast(`Status update error: ${res.error}`);
      }
    } else {
      showToast(`Save QA error: ${saveRes.error}`);
    }
    
    setIsSubmitting(false);
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

      {/* Metric Panels */}
      {(() => {
        const approvedAuditsCount = Object.values(allQA).filter(q => q.status === "APPROVED").length || 84;
        const totalAudits = Object.values(allQA).length;
        const revisionRate = totalAudits > 0 ? Math.round((Object.values(allQA).filter(q => q.status === "REJECTED_REVISION").length / totalAudits) * 100) : 12;

        return (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200">
              <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Pending Audits</span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">
                  <CountUp value={projects.length} suffix=" Startups" />
                </span>
                <ShieldCheck className="h-4.5 w-4.5 text-amber-550" />
              </div>
            </div>

            <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-75 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200">
              <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Audits Approved</span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">
                  <CountUp value={approvedAuditsCount} suffix=" Decks" />
                </span>
                <ThumbsUp className="h-4.5 w-4.5 text-emerald-400" />
              </div>
            </div>

            <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-150 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200">
              <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">QA SLA Response</span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">
                  <CountUp value={24} suffix=" Hours" />
                </span>
                <Clock className="h-4.5 w-4.5 text-purple-400" />
              </div>
            </div>

            <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl animate-in fade-in duration-300 delay-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200">
              <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Revision Rate</span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">
                  <CountUp value={revisionRate} suffix="% Request" />
                </span>
                <TrendingUp className="h-4.5 w-4.5 text-cyan-400" />
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Side: Audit Queue */}
        <div className="border border-zinc-700 bg-zinc-900 p-6 rounded-2xl space-y-5 shadow-xl animate-in fade-in duration-300">
          <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-4">
            Assigned QA Queue
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
              <span>All QA audits complete.</span>
            </div>
          )}
        </div>

        {/* Right Side: Audit Form / Checkoff */}
        <div className="lg:col-span-2 border border-zinc-700 bg-zinc-900 p-8 rounded-2xl space-y-6 shadow-xl">
          {activeProject ? (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-zinc-800 pb-5">
                <div>
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Audit Desk</span>
                  <h3 className="text-base font-extrabold text-white mt-1">{activeProject.name}</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Cross-check typography hierarchy, numerical charts alignment, and narrative consistency.</p>
                </div>
                
                <div className="flex flex-wrap gap-2.5 shrink-0">
                  <button 
                    onClick={handleSaveQA}
                    disabled={isSubmitting}
                    className="px-4.5 py-2.5 border border-zinc-700 hover:bg-zinc-805 text-zinc-300 font-bold rounded-xl cursor-pointer transition active:scale-95 text-xs flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Progress</span>
                    )}
                  </button>
                  <button 
                    onClick={() => handleAuditAction("Revision")}
                    disabled={isSubmitting}
                    className="px-4.5 py-2.5 border border-red-900/50 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-bold rounded-xl cursor-pointer transition active:scale-95 flex items-center gap-1.5 text-xs"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
                    ) : (
                      <ThumbsDown className="h-3.5 w-3.5" />
                    )}
                    <span>Reject / Revision</span>
                  </button>
                  <button 
                    onClick={() => handleAuditAction("Client Review")}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl cursor-pointer transition active:scale-95 flex items-center gap-1.5 text-xs shadow-[0_0_15px_rgba(245,179,1,0.15)]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                    ) : (
                      <ThumbsUp className="h-3.5 w-3.5" />
                    )}
                    <span>Approve & Release</span>
                  </button>
                </div>
              </div>

              {/* Creative & Copy Reference */}
              <div className="border border-zinc-700 bg-zinc-950 rounded-2xl overflow-hidden shadow-sm">
                <details className="group" open={designDataReference !== null}>
                  <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-amber-500/10 text-amber-550 rounded-xl">
                        <ShieldCheck className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <span className="font-bold text-zinc-200">🎨 Design Assets & Copy Reference</span>
                        <p className="text-zinc-500 text-[10px] mt-0.5">Access the designer's Canva workspace, PDF builds, and the finalized copy notes.</p>
                      </div>
                    </div>
                    <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  
                  <div className="p-5 border-t border-zinc-850 space-y-4 text-[10px] text-zinc-300 bg-zinc-950/40">
                    {loadingDesign ? (
                      <div className="text-zinc-550 py-2 font-mono">Loading creative assets...</div>
                    ) : (
                      <div className="space-y-4">
                        {/* Interactive Design Links */}
                        <div className="space-y-2">
                          <span className="text-[9px] text-zinc-550 uppercase font-mono font-bold">Creative Assets</span>
                          <div className="flex flex-wrap gap-2.5">
                            {(designDataReference?.canva_link || activeQAProjectDesign?.canva_link) ? (
                              <a 
                                href={designDataReference?.canva_link || activeQAProjectDesign?.canva_link} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                                <span>Open Canva Workspace</span>
                              </a>
                            ) : null}
                            
                            {(designDataReference?.pdf_export_url || activeQAProjectDesign?.pdf_export_url) && (designDataReference?.pdf_export_url !== "#" && activeQAProjectDesign?.pdf_export_url !== "#") ? (
                              <a 
                                href={designDataReference?.pdf_export_url || activeQAProjectDesign?.pdf_export_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                                <span>View Exported PDF</span>
                              </a>
                            ) : null}

                            {(designDataReference?.pptx_export_url || activeQAProjectDesign?.pptx_export_url) && (designDataReference?.pptx_export_url !== "#" && activeQAProjectDesign?.pptx_export_url !== "#") ? (
                              <a 
                                href={designDataReference?.pptx_export_url || activeQAProjectDesign?.pptx_export_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                                <span>View Exported PPTX</span>
                              </a>
                            ) : null}

                            {!(designDataReference?.canva_link || activeQAProjectDesign?.canva_link) && 
                             !(designDataReference?.pdf_export_url || activeQAProjectDesign?.pdf_export_url) && (
                              <p className="text-zinc-550 py-1 font-mono">No design files or Canva workspaces submitted by designer yet.</p>
                            )}
                          </div>
                        </div>

                        {/* Brand Kit rules */}
                        {(designDataReference?.brand_kit || activeQAProjectDesign?.brand_kit) && (
                          <div className="grid gap-4 sm:grid-cols-2 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                            <div>
                              <span className="text-[8px] text-zinc-550 uppercase font-mono font-bold">Fonts Pairs</span>
                              <p className="text-zinc-300 font-semibold mt-0.5">{(designDataReference?.brand_kit || activeQAProjectDesign?.brand_kit).fonts || "Not specified"}</p>
                            </div>
                            <div>
                              <span className="text-[8px] text-zinc-550 uppercase font-mono font-bold">Illustrations Style</span>
                              <p className="text-zinc-300 font-semibold mt-0.5">{(designDataReference?.brand_kit || activeQAProjectDesign?.brand_kit).icons || "Not specified"}</p>
                            </div>
                          </div>
                        )}

                        {/* Copywriter Slide Outlines */}
                        {contentDataReference && (
                          <div className="space-y-2 border-t border-zinc-800 pt-4">
                            <span className="text-[9px] text-zinc-550 uppercase font-mono font-bold">Slide Outlines & Copy Notes Reference</span>
                            {contentDataReference.slides && contentDataReference.slides.length > 0 ? (
                              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {contentDataReference.slides.map((s: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-zinc-950 border border-zinc-805 rounded-xl">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 mb-1">
                                      <span>{s.title}</span>
                                      <span className="text-zinc-555 uppercase font-mono">{s.status}</span>
                                    </div>
                                    <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-[10px] font-medium">{s.notes || "No content copy written for this slide."}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-zinc-550 text-[10px] font-mono">No slide copy created yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </details>
              </div>

              {/* Deliverables to Audit */}
              {activeQAProjectDesign && (
                <div className="border border-zinc-700 bg-zinc-950 p-5 rounded-2xl space-y-4 shadow-sm">
                  <h4 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Presentation Assets to Audit</h4>
                  <div className="flex flex-wrap gap-3">
                    {activeQAProjectDesign.canva_link ? (
                      <a 
                        href={activeQAProjectDesign.canva_link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-350 rounded-xl flex items-center gap-2 transition text-xs font-bold"
                      >
                        <ExternalLink className="h-4 w-4 text-zinc-400" />
                        <span>Open Canva Workspace</span>
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-550 border border-zinc-850 bg-zinc-950 px-3.5 py-2.5 rounded-xl font-medium">
                        No Canva workspace link uploaded
                      </span>
                    )}
                    {activeQAProjectDesign.pdf_export_url && activeQAProjectDesign.pdf_export_url !== "#" ? (
                      <a 
                        href={activeQAProjectDesign.pdf_export_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-355 rounded-xl flex items-center gap-2 transition text-xs font-bold"
                      >
                        <ExternalLink className="h-4 w-4 text-zinc-400" />
                        <span>View Exported PDF</span>
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-550 border border-zinc-850 bg-zinc-950 px-3.5 py-2.5 rounded-xl font-medium">
                        No PDF export uploaded
                      </span>
                    )}
                    {activeQAProjectDesign.pptx_export_url && activeQAProjectDesign.pptx_export_url !== "#" ? (
                      <a 
                        href={activeQAProjectDesign.pptx_export_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-355 rounded-xl flex items-center gap-2 transition text-xs font-bold"
                      >
                        <ExternalLink className="h-4 w-4 text-zinc-400" />
                        <span>Download PowerPoint (PPTX)</span>
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-550 border border-zinc-850 bg-zinc-950 px-3.5 py-2.5 rounded-xl font-medium">
                        No PPTX export uploaded
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Audit Checklist items */}
              <div className="space-y-4">
                <h4 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Quality Assurance Checklist</h4>

                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { key: "grammar", label: "Grammar & Spelling Check" },
                    { key: "alignment", label: "Grid & Element Alignment" },
                    { key: "typography", label: "Font Sizing & Hierarchy" },
                    { key: "charts", label: "Data Charts Accuracy" },
                    { key: "icons", label: "Icon Mappings & Sizing" },
                    { key: "images", label: "Asset Contrast & Quality" },
                    { key: "consistency", label: "Slide-to-Slide Consistency" },
                    { key: "brandCompliance", label: "Corporate Brand Compliance" },
                    { key: "storyFlow", label: "Story Narrative & Flow" }
                  ].map((item) => {
                    const isChecked = activeQA.checklist[item.key as keyof QARecord["checklist"]];
                    return (
                      <div 
                        key={item.key}
                        onClick={() => handleCheckboxChange(item.key as any)}
                        className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition duration-150 select-none ${
                          isChecked 
                            ? "bg-zinc-950 border-amber-550 text-white font-bold shadow-md ring-1 ring-amber-550/10" 
                            : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-950"
                        }`}
                      >
                        <span>{item.label}</span>
                        <div className={`h-4.5 w-4.5 rounded flex items-center justify-center border transition ${
                          isChecked 
                            ? "bg-amber-500 border-amber-500 text-black" 
                            : "border-zinc-700 bg-zinc-900"
                        }`}>
                          {isChecked && <CheckCircle className="h-3.5 w-3.5 text-black stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Comments */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
                  <MessageSquare className="h-4.5 w-4.5 text-zinc-405" />
                  <span>Audit Feedback / Revision Directives</span>
                </div>
                <textarea
                  rows={4}
                  value={activeQA.comments || ""}
                  onChange={(e) => handleCommentsChange(e.target.value)}
                  placeholder="Detail specific slide numbers, typography flaws, or grammatical corrections needed..."
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3.5 outline-none resize-none mt-2 transition"
                />
              </div>

            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-2xl text-zinc-550 gap-2">
              <AlertCircle className="h-7 w-7 text-zinc-650" />
              <span className="font-bold text-zinc-455 uppercase tracking-wider font-mono text-[10px]">No project selected</span>
              <span className="text-zinc-550 max-w-sm text-center">Choose an active track on the left to start auditing deck assets.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
