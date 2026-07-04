"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FolderGit, 
  CheckSquare, 
  Search, 
  FileText, 
  Palette, 
  ShieldCheck, 
  DollarSign, 
  BarChart3, 
  History, 
  Bell, 
  Settings 
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number;
}

export function AdminSidebar({ activeTab, onTabChange, pendingCount }: AdminSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: "clients", label: "Clients", icon: Briefcase },
    { id: "projects", label: "Projects", icon: FolderGit },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "research", label: "Research", icon: Search },
    { id: "content", label: "Content", icon: FileText },
    { id: "design", label: "Design", icon: Palette },
    { id: "qa", label: "QA", icon: ShieldCheck },
    { id: "finance", label: "Finance", icon: DollarSign },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "logs", label: "Activity Logs", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-[#1E293B] bg-[#090D16] flex flex-col h-screen sticky top-0 overflow-y-auto select-none">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#1E293B] gap-2">
        <Logo className="h-5 w-auto" />
        <span className="text-sm font-semibold tracking-wider bg-gradient-to-r from-white via-[#E2E8F0] to-[#94A3B8] bg-clip-text text-transparent">
          FUNDRAISING OS
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">
          Management
        </p>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-[#1E293B]/70 text-white font-semibold shadow-sm shadow-black/20" 
                  : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/30"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn(
                  "h-4 w-4 transition-transform duration-200 group-hover:scale-105",
                  isActive ? "text-[#3B82F6]" : "text-[#475569] group-hover:text-[#94A3B8]"
                )} />
                <span>{item.label}</span>
              </div>
              
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-blue-600 rounded-full min-w-[16px] text-center animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Environment Info */}
      <div className="p-4 border-t border-[#1E293B] bg-[#070A11] flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-zinc-500 font-medium">Environment</span>
          <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 font-semibold rounded uppercase tracking-wider">
            Production
          </span>
        </div>
        <div className="text-[9px] text-zinc-600 font-mono">
          v1.0.4-stable
        </div>
      </div>
    </aside>
  );
}
