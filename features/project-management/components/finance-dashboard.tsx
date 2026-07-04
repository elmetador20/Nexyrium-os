"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Plus, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  CreditCard,
  ArrowUpRight,
  Printer,
  Calendar,
  X
} from "lucide-react";
import { Invoice, Project } from "../types";
import { getInvoicesAction, createInvoiceAction, updateInvoiceStatusAction } from "../../../app/actions/projects";

interface FinanceDashboardProps {
  initialProjects: Project[];
  userRole: string;
}

export function FinanceDashboard({
  initialProjects,
  userRole
}: FinanceDashboardProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Line items state for create modal
  const [lineItems, setLineItems] = useState<{ description: string; amount: number }[]>([
    { description: "Strategic Funding & Pitch Deck Design", amount: 0 }
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    const res = await getInvoicesAction();
    if (res.success && res.invoices) {
      setInvoices(res.invoices);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, nextStatus: Invoice["status"]) => {
    const res = await updateInvoiceStatusAction(id, nextStatus);
    if (res.success) {
      showToast(`Invoice updated to: ${nextStatus}`);
      fetchInvoices();
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, { description: "", amount: 0 }]);
  };

  const handleRemoveLineItem = (idx: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLineItemChange = (idx: number, field: "description" | "amount", val: any) => {
    const list = [...lineItems];
    list[idx] = {
      ...list[idx],
      [field]: field === "amount" ? Number(val) : val
    };
    setLineItems(list);
  };

  const handleCreateInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const projId = formData.get("projectId") as string;
    const proj = initialProjects.find(p => p.id === projId);

    const totalAmount = lineItems.reduce((acc, curr) => acc + curr.amount, 0);

    const res = await createInvoiceAction({
      projectId: projId,
      projectName: proj ? proj.name : "Custom Consulting",
      clientId: proj ? proj.client_id || "client-1" : "client-1",
      clientName: proj ? proj.startup_name : "General Partner",
      amount: totalAmount,
      dueAt: formData.get("dueAt") as string,
      lineItems
    });

    setIsSubmitting(false);

    if (res.success) {
      showToast("Invoice issued and client notified.");
      setIsCreateOpen(false);
      setLineItems([{ description: "Strategic Funding & Pitch Deck Design", amount: 0 }]);
      fetchInvoices();
    } else {
      showToast(`Error: ${res.error}`);
    }
  };

  const revenueTotal = invoices.filter(i => i.status === "PAID").reduce((acc, curr) => acc + curr.amount, 0);
  const revenuePending = invoices.filter(i => i.status === "SENT").reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto select-none bg-zinc-950 text-white min-h-screen text-xs">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-black text-xs px-5 py-4 rounded-xl shadow-2xl font-bold border border-amber-400 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle className="h-4.5 w-4.5 text-black" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Billing & Accounts</span>
          <h2 className="text-xl font-black text-white mt-1.5">Finance Command</h2>
          <p className="text-zinc-400 mt-1 text-[10px]">Invoice collections, pending corporate client retainers, and payout logs.</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl flex items-center gap-1.5 transition duration-150 cursor-pointer shadow-md"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Issue Invoice</span>
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-2 border-t-4 border-t-emerald-500 shadow-xl animate-in fade-in duration-300">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Total Paid Revenue</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">${revenueTotal.toLocaleString()}</span>
            <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
          </div>
        </div>

        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-2 border-t-4 border-t-amber-500 shadow-xl animate-in fade-in duration-300 delay-75">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Accounts Receivable</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">${revenuePending.toLocaleString()}</span>
            <CreditCard className="h-4.5 w-4.5 text-amber-500" />
          </div>
        </div>

        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-2 border-t-4 border-t-purple-500 shadow-xl animate-in fade-in duration-300 delay-150">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Avg Invoice Amount</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">$4,260</span>
            <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
          </div>
        </div>

        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-2 border-t-4 border-t-cyan-500 shadow-xl animate-in fade-in duration-300 delay-200">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Collection rate</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">92.4%</span>
            <ArrowUpRight className="h-4.5 w-4.5 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Invoices list */}
      <div className="border border-zinc-700 bg-zinc-900 rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-300">
        <div className="p-5 bg-zinc-950/60 border-b border-zinc-800 grid grid-cols-6 font-bold text-zinc-455 text-[10px] uppercase tracking-wider font-mono">
          <span className="col-span-2">Client / Project</span>
          <span>Amount</span>
          <span>Issued / Due</span>
          <span>Status</span>
          <span className="text-right">Manage</span>
        </div>

        {loading ? (
          <div className="py-24 text-center text-zinc-550 font-mono">Retrieving invoices...</div>
        ) : invoices.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-5 grid grid-cols-6 items-center hover:bg-zinc-950/30 transition duration-150">
                
                <div className="col-span-2 min-w-0 pr-4">
                  <span className="font-bold text-zinc-200 block truncate text-xs">{inv.client_name}</span>
                  <span className="text-[10px] text-zinc-455 block truncate mt-1 font-medium">{inv.project_name}</span>
                </div>

                <span className="font-bold text-white text-xs">${inv.amount.toLocaleString()}</span>

                <div className="space-y-1">
                  <span className="text-zinc-350 block">Issued: {inv.issued_at}</span>
                  <span className="text-[9px] text-zinc-550 block font-mono">Due: {inv.due_at}</span>
                </div>

                <div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold font-mono rounded border ${
                    inv.status === "PAID" 
                      ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20" 
                      : inv.status === "SENT"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {inv.status}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  {inv.status === "SENT" && (
                    <button
                      onClick={() => handleUpdateStatus(inv.id, "PAID")}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg transition duration-150 text-[10px] cursor-pointer"
                    >
                      Mark Paid
                    </button>
                  )}
                  <button className="p-1.5 text-zinc-500 hover:text-white cursor-pointer hover:bg-zinc-950 rounded-lg transition">
                    <Printer className="h-4 w-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center text-zinc-550 font-bold uppercase tracking-wider font-mono">No invoices issued yet.</div>
        )}
      </div>

      {/* Invoice Creator Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <span className="font-bold text-xs uppercase tracking-wider text-white font-mono">Issue Client Invoice</span>
              <button onClick={() => setIsCreateOpen(false)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
              
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Target Client Engagement</label>
                  <select name="projectId" required className="w-full bg-zinc-955 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none cursor-pointer transition">
                    {initialProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.startup_name} - {p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-zinc-400">Payment Due Date</label>
                  <input type="date" name="dueAt" required className="w-full bg-zinc-955 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition" />
                </div>
              </div>

              {/* Line items list */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-zinc-805 pb-2.5">
                  <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Invoice Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-amber-550 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer transition text-[10px]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                        placeholder="Item description (e.g. Slide content writing)"
                        className="flex-1 bg-zinc-955 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                      />
                      <input
                        type="number"
                        required
                        value={item.amount || ""}
                        onChange={(e) => handleLineItemChange(idx, "amount", e.target.value)}
                        placeholder="Price"
                        className="w-28 bg-zinc-955 border border-zinc-700 focus:border-amber-500 text-white rounded-xl p-3 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        disabled={lineItems.length === 1}
                        className="p-3 border border-zinc-700 hover:border-red-900/50 text-zinc-500 hover:text-red-400 rounded-xl transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-zinc-955"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-805 pt-5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 border border-zinc-700 hover:bg-zinc-805 text-zinc-400 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl transition cursor-pointer shadow-md"
                >
                  {isSubmitting ? "Generating..." : "Issue & Send Invoice"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
