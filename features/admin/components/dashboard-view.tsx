"use client";

import React from "react";
import { 
  Users, 
  Briefcase, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  ShieldAlert, 
  ArrowUpRight, 
  TrendingUp,
  FolderKanban,
  CheckCircle,
  FileCheck,
  Plus,
  Send,
  Zap,
  TrendingDown,
  ChevronRight
} from "lucide-react";
import { DashboardStats } from "../types";
import { cn } from "@/lib/utils";

interface DashboardViewProps {
  stats: DashboardStats;
  onTabChange: (tab: string) => void;
  onOpenCreateUser: () => void;
}

export function DashboardView({ stats, onTabChange, onOpenCreateUser }: DashboardViewProps) {
  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // SVG Line Chart coordinates helper
  const renderRevenueChart = () => {
    const data = stats.monthlyRevenue;
    const width = 500;
    const height = 150;
    const maxVal = Math.max(...data.map(d => d.amount)) * 1.1;
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (d.amount / maxVal) * height;
      return { x, y };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return (
      <div className="relative w-full h-[160px] mt-4 select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Y Grid lines */}
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#1E293B" strokeWidth="0.5" strokeDasharray="3" />
          <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#1E293B" strokeWidth="0.5" strokeDasharray="3" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#1E293B" strokeWidth="0.5" strokeDasharray="3" />
          
          {/* Area fill */}
          <path d={areaD} fill="url(#chartGradient)" />
          {/* Main line */}
          <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
          
          {/* Data points */}
          {points.map((p, i) => (
            <g key={i} className="group/dot cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4" fill="#090D16" stroke="#3B82F6" strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r="8" fill="#3B82F6" fillOpacity="0" className="hover:fill-opacity-20 transition-all" />
            </g>
          ))}
        </svg>
        <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-mono">
          {data.map((d, i) => (
            <span key={i}>{d.month}</span>
          ))}
        </div>
      </div>
    );
  };

  const widgetCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      desc: "+12.4% MoM growth",
      icon: Briefcase,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      desc: "Completion rate: 94%",
      icon: FolderKanban,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Revenue This Month",
      value: formatCurrency(stats.revenueThisMonth),
      desc: "+$6,200 ahead of target",
      icon: DollarSign,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingUserApprovals,
      desc: "Needs immediate action",
      icon: ShieldAlert,
      color: stats.pendingUserApprovals > 0 ? "text-red-500 animate-pulse" : "text-zinc-500",
      bg: stats.pendingUserApprovals > 0 ? "bg-red-500/10" : "bg-zinc-500/10",
      onClick: () => onTabChange("users"),
    },
  ];

  const quickActions = [
    { label: "Create Client", icon: Plus, onClick: () => {} },
    { label: "Create Project", icon: FolderKanban, onClick: () => {} },
    { label: "Invite Employee", icon: Send, onClick: onOpenCreateUser },
    { label: "Approve Users", icon: ShieldAlert, onClick: () => onTabChange("users") },
    { label: "View Reports", icon: TrendingUp, onClick: () => onTabChange("reports") },
    { label: "Upload Assets", icon: Zap, onClick: () => {} },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Status Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-[#0F172A]/30 border border-[#1E293B] rounded-xl text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>System Operation: <strong className="text-white">Active</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span>Due Today: <strong className="text-white">{stats.projectsDueToday} projects</strong></span>
          <span className="h-4 w-px bg-[#1E293B]" />
          <span>Delayed: <strong className="text-red-400">{stats.projectsDelayed} critical</strong></span>
          <span className="h-4 w-px bg-[#1E293B]" />
          <span>Utilization: <strong className="text-white">{stats.teamUtilization}%</strong></span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {widgetCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i}
              onClick={card.onClick}
              className={cn(
                "rounded-xl border border-[#1E293B] bg-[#0F172A]/40 p-5 space-y-3 transition-all duration-200",
                card.onClick && "hover:border-[#3B82F6]/50 cursor-pointer hover:bg-[#1E293B]/20"
              )}
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-bold uppercase tracking-widest">{card.title}</span>
                <div className={cn("p-1.5 rounded-lg", card.bg)}>
                  <Icon className={cn("h-4 w-4", card.color)} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-tight text-white">{card.value}</p>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  {card.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts & Quick Actions Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Revenue chart (Span 2) */}
        <div className="md:col-span-2 rounded-xl border border-[#1E293B] bg-[#0F172A]/40 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Monthly Revenue Growth
              </h3>
              <p className="text-[10px] text-zinc-500">Gross billing performance over last 6 months</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              +18.2% avg growth
            </span>
          </div>
          {renderRevenueChart()}
        </div>

        {/* Quick Actions (Span 1) */}
        <div className="rounded-xl border border-[#1E293B] bg-[#0F172A]/40 p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              Quick Actions
            </h3>
            <p className="text-[10px] text-zinc-500">Fast workflows and command operations</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={action.onClick}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#1E293B] bg-[#0F172A]/50 hover:bg-[#1E293B]/60 hover:border-[#3B82F6]/50 transition-all text-center gap-2 group cursor-pointer"
                >
                  <div className="p-1.5 bg-[#1E293B] group-hover:bg-[#3B82F6]/10 rounded-lg transition-colors">
                    <Icon className="h-4 w-4 text-zinc-400 group-hover:text-[#3B82F6] transition-colors" />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-300 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Status Distribution & Recent Activities */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Project Pipeline Distribution */}
        <div className="rounded-xl border border-[#1E293B] bg-[#0F172A]/40 p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Project Pipeline</h3>
            <p className="text-[10px] text-zinc-500">Workflow allocation by status categories</p>
          </div>
          <div className="space-y-3.5 pt-2">
            {stats.projectStatusDistribution.map((item, i) => {
              // Calculate percent
              const total = stats.projectStatusDistribution.reduce((acc, curr) => acc + curr.value, 0);
              const percentage = Math.round((item.value / total) * 100);
              return (
                <div key={i} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-semibold">{item.name}</span>
                    <span className="text-zinc-500 font-mono font-medium">{item.value} ({percentage}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1E293B] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: item.color 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="md:col-span-2 rounded-xl border border-[#1E293B] bg-[#0F172A]/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">System Activity Stream</h3>
              <p className="text-[10px] text-zinc-500">Live feed of server, user, and administrative actions</p>
            </div>
            <button 
              onClick={() => onTabChange("logs")}
              className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-0.5"
            >
              All Logs
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {stats.recentActivities.map((log) => (
              <div 
                key={log.id} 
                className="flex items-start justify-between p-2.5 rounded-lg border border-[#1E293B] bg-[#0F172A]/20 text-[11px] group hover:border-[#334155] transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-[#3B82F6] font-bold rounded text-[9px] uppercase tracking-wider">
                      {log.action}
                    </span>
                    <span className="text-zinc-300 font-bold">{log.user_email}</span>
                  </div>
                  <p className="text-zinc-400">{log.details}</p>
                </div>
                <div className="text-[9px] text-zinc-500 font-mono text-right shrink-0">
                  {new Date(log.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
