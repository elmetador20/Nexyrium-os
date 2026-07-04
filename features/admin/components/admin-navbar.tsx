"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Laptop, 
  Sun, 
  Moon, 
  Command 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface AdminNavbarProps {
  email: string;
  role: string;
  activeTab: string;
}

export function AdminNavbar({ email, role, activeTab }: AdminNavbarProps) {
  const [time, setTime] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTime(
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  const getBreadcrumb = () => {
    const tabNames: Record<string, string> = {
      dashboard: "Dashboard Overview",
      users: "User Management",
      clients: "Client Directories",
      projects: "Project Pipelines",
      tasks: "Task Allocations",
      research: "Investor Research",
      content: "Content Operations",
      design: "Design Deliverables",
      qa: "Quality Assurance",
      finance: "Financial Operations",
      reports: "Analytics & Reports",
      logs: "Security Activity Logs",
      settings: "System Preferences",
    };
    return tabNames[activeTab] || "System Administration";
  };

  return (
    <header className="h-16 border-b border-[#1E293B] bg-[#090D16] px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-500 font-medium font-sans">Workspace</span>
        <span className="text-[#475569] font-sans">/</span>
        <span className="text-[#3B82F6] font-semibold tracking-wide font-sans">{getBreadcrumb()}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Global Search Bar (Linear Inspired) */}
        <div className="relative w-64 group cursor-pointer">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
          <input
            type="text"
            placeholder="Search CRM..."
            readOnly
            className="w-full bg-[#0F172A]/50 border border-[#1E293B] hover:border-[#334155] rounded-lg pl-9 pr-8 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/50 cursor-pointer transition-all duration-200"
          />
          <div className="absolute right-2.5 top-2 flex items-center gap-0.5 px-1 py-0.5 bg-[#1E293B] border border-[#334155] rounded text-[8px] text-zinc-400 font-mono shadow-sm">
            <Command className="h-2 w-2" />
            <span>K</span>
          </div>
        </div>

        {/* Current Time Clock */}
        <div className="hidden md:block font-mono text-xs text-zinc-400 font-semibold bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-lg">
          {time || "00:00:00"}
        </div>

        {/* Theme Toggle (Mock / Switch UI) */}
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 border border-[#1E293B] bg-[#0F172A]/50 hover:bg-[#1E293B]/50 hover:text-white text-zinc-400 rounded-lg transition-colors duration-150"
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 border border-[#1E293B] bg-[#0F172A]/50 hover:bg-[#1E293B]/50 hover:text-white text-zinc-400 rounded-lg relative transition-colors duration-150 cursor-pointer">
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-[#0F172A] border-[#1E293B] text-zinc-200">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-white">System Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#1E293B]" />
              <div className="p-2 space-y-2">
                <div className="p-2 rounded hover:bg-[#1E293B]/50 transition-all text-[11px] cursor-pointer">
                  <p className="font-bold text-white">User Approval Request</p>
                  <p className="text-zinc-400 mt-0.5">testuser_442 registered and is pending approval.</p>
                  <span className="text-[9px] text-blue-400 block mt-1">10 minutes ago</span>
                </div>
                <div className="p-2 rounded hover:bg-[#1E293B]/50 transition-all text-[11px] cursor-pointer">
                  <p className="font-bold text-white">System Database Status</p>
                  <p className="text-zinc-400 mt-0.5">Database schema synced with Supabase successfully.</p>
                  <span className="text-[9px] text-zinc-500 block mt-1">1 hour ago</span>
                </div>
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[#1E293B]" />
            <DropdownMenuItem className="text-[11px] text-[#3B82F6] justify-center cursor-pointer hover:bg-[#1E293B]/50">
              Mark All as Read
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none cursor-pointer">
            <div className="h-8 w-8 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-xs shadow-md">
              {email[0].toUpperCase()}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#0F172A] border-[#1E293B] text-zinc-200">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-semibold text-white">
                <div className="text-xs font-bold truncate">{email}</div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{role}</div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[#1E293B]" />
            <DropdownMenuItem className="text-xs gap-2 py-2 cursor-pointer hover:bg-[#1E293B]/50">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#1E293B]" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-xs gap-2 py-2 text-red-400 focus:text-red-400 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
