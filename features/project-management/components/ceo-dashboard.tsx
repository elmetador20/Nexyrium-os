"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FolderGit2, 
  CheckCircle2, 
  BarChart3, 
  ArrowUpRight,
  Target,
  Briefcase
} from "lucide-react";
import { getCeoDashboardAction } from "../../../app/actions/projects";
import { CountUp } from "@/components/ui/count-up";

export function CeoDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCeoStats();
  }, []);

  const fetchCeoStats = async () => {
    setLoading(true);
    const res = await getCeoDashboardAction();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto text-xs animate-pulse bg-zinc-950 min-h-screen">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="h-3 w-28 bg-zinc-850 rounded-lg" />
          <div className="h-8 w-64 bg-zinc-850 rounded-lg" />
          <div className="h-3 w-96 bg-zinc-850 rounded-lg" />
        </div>
        
        {/* KPI Grid Skeleton */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 border border-zinc-800 bg-zinc-900/40 p-6 rounded-2xl space-y-4" />
          ))}
        </div>
        
        {/* Charts Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 h-72 border border-zinc-800 bg-zinc-900/40 rounded-2xl" />
          <div className="h-72 border border-zinc-800 bg-zinc-900/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { revenue, sales, projects, clientGrowth } = data || {
    revenue: { total: 0, pending: 0, growthRate: 0, monthlyDistribution: [] },
    sales: { dealsClosed: 0, pipelineValue: 0, winRate: 0 },
    projects: { totalCount: 0, activeCount: 0, completedCount: 0, healthScore: 0 },
    clientGrowth: { totalClients: 0, newThisMonth: 0 }
  };

  return (
    <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto select-none bg-zinc-950 text-white min-h-screen text-xs">
      
      {/* Header */}
      <div className="animate-in fade-in duration-300">
        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Executive Command</span>
        <h2 className="text-xl font-black text-white mt-1.5">CEO Insights Platform</h2>
        <p className="text-zinc-400 mt-1 text-[10px]">High-level financial summaries, sales ratios, operational health, and company pipeline.</p>
      </div>

      {/* KPI stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200 animate-in fade-in">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Total Arr Earnings</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">
              <CountUp value={revenue.total} prefix="$" />
            </span>
            <span className="text-[9px] text-emerald-450 font-bold flex items-center gap-0.5 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              <TrendingUp className="h-3 w-3" />
              <span>+{revenue.growthRate}%</span>
            </span>
          </div>
        </div>

        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200 animate-in fade-in delay-75">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Sales Pipeline Size</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">
              <CountUp value={sales.pipelineValue} prefix="$" />
            </span>
            <Target className="h-4.5 w-4.5 text-amber-500" />
          </div>
        </div>

        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200 animate-in fade-in delay-150">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Projects Health Score</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">
              <CountUp value={projects.healthScore} suffix="% SLA" />
            </span>
            <FolderGit2 className="h-4.5 w-4.5 text-purple-400" />
          </div>
        </div>

        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-2 shadow-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200 animate-in fade-in delay-200">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Clients Growth</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">
              <CountUp value={clientGrowth.totalClients} suffix=" Clients" />
            </span>
            <span className="text-[9px] text-cyan-400 font-bold font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">+{clientGrowth.newThisMonth} new</span>
          </div>
        </div>

      </div>

      {/* Main charts / distribution list */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Monthly Earnings visualizer */}
        <div className="md:col-span-2 border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-4">
            Monthly Earnings Trend
          </h3>
          
          <div className="flex items-end justify-between h-48 pt-6 gap-3">
            {revenue.monthlyDistribution.map((item: any, idx: number) => {
              const max = Math.max(...revenue.monthlyDistribution.map((m: any) => m.revenue));
              const pct = (item.revenue / max) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3.5 h-full justify-end">
                  <div className="w-full bg-zinc-950/60 hover:bg-amber-500 border border-zinc-800 rounded-xl transition duration-300 relative group" style={{ height: `${pct}%` }}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-700 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 shadow-lg">
                      ${item.revenue.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-bold font-mono">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipelines Sales Performance */}
        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-5 shadow-xl">
          <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-4">
            Sales Performance
          </h3>

          <div className="space-y-4 pt-1">
            <div className="flex justify-between items-center p-3 bg-zinc-950/40 border border-zinc-800 rounded-xl">
              <div>
                <span className="text-zinc-400 font-semibold block text-[10px]">Deals Closed</span>
                <span className="text-lg font-black text-white mt-1 block">{sales.dealsClosed} Accounts</span>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-405" />
            </div>

            <div className="flex justify-between items-center p-3 bg-zinc-950/40 border border-zinc-800 rounded-xl">
              <div>
                <span className="text-zinc-400 font-semibold block text-[10px]">Win Ratio</span>
                <span className="text-lg font-black text-white mt-1 block">{sales.winRate}% Conversion</span>
              </div>
              <ArrowUpRight className="h-6 w-6 text-cyan-405" />
            </div>

            <div className="flex justify-between items-center p-3 bg-zinc-950/40 border border-zinc-805 rounded-xl">
              <div>
                <span className="text-zinc-400 font-semibold block text-[10px]">Active Project Seats</span>
                <span className="text-lg font-black text-white mt-1 block">{projects.activeCount} Ongoing</span>
              </div>
              <Briefcase className="h-6 w-6 text-purple-405" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
