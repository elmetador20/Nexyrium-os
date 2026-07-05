"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  RotateCcw, 
  ShieldAlert, 
  Layers,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";
import { getReportsAction } from "../../../app/actions/projects";
import { CountUp } from "@/components/ui/count-up";

export function ReportsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const res = await getReportsAction();
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 border border-zinc-805 bg-zinc-900/40 p-6 rounded-2xl" />
          ))}
        </div>
        
        {/* Charts Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-72 border border-zinc-805 bg-zinc-900/40 rounded-2xl" />
          <div className="h-72 border border-zinc-805 bg-zinc-900/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { deliverySpeed, revisions, departmentLoad } = data || {
    deliverySpeed: [],
    revisions: { averageRevisionCount: 0, projectsWithZeroRevisions: 0 },
    departmentLoad: []
  };

  return (
    <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto select-none bg-zinc-950 text-white min-h-screen text-xs">
      
      {/* Header */}
      <div className="animate-in fade-in duration-300">
        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Operations Analytics</span>
        <h2 className="text-xl font-black text-white mt-1.5">Performance Intelligence</h2>
        <p className="text-zinc-400 mt-1 text-[10px]">Analyze team execution speed, quality checklists pass rates, and resource utilization.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-2 border-t-4 border-t-amber-500 shadow-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200 animate-in fade-in">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Avg Client Revisions</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">
              <CountUp value={revisions.averageRevisionCount} suffix=" Cycles" />
            </span>
            <RotateCcw className="h-4.5 w-4.5 text-amber-500" />
          </div>
        </div>

        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-2 border-t-4 border-t-emerald-500 shadow-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200 animate-in fade-in delay-75">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Zero-Revision Delivery</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">
              <CountUp value={revisions.projectsWithZeroRevisions} suffix="% Decks" />
            </span>
            <ArrowUpRight className="h-4.5 w-4.5 text-emerald-455" />
          </div>
        </div>

        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-2 border-t-4 border-t-purple-500 shadow-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,179,1,0.05)] transition-all duration-200 animate-in fade-in delay-150">
          <span className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider font-mono">Avg Operations SLA</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-white">
              <CountUp value={94} suffix=".8% SLA" />
            </span>
            <Clock className="h-4.5 w-4.5 text-purple-455" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Delivery speed by track */}
        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-4">
            Delivery velocity by service track
          </h3>

          <div className="space-y-4 pt-2">
            {deliverySpeed.map((item: any, idx: number) => {
              const max = Math.max(...deliverySpeed.map((d: any) => d.avgDays));
              const pct = (item.avgDays / max) * 100;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-zinc-300">{item.service}</span>
                    <span className="text-amber-500 font-mono">{item.avgDays} Days</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                    <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Load distribution */}
        <div className="border border-zinc-705 bg-zinc-900 p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-4">
            Pipeline Load distribution
          </h3>

          <div className="space-y-4 pt-2">
            {departmentLoad.map((item: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-zinc-300">{item.department}</span>
                  <span className="text-purple-400 font-mono">{item.load}% Cap</span>
                </div>
                <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-purple-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${item.load}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
