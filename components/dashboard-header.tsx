"use client";

import React, { useState } from "react";
import { LogOut, User } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  email: string;
  role: string;
}

export function DashboardHeader({ email, role }: DashboardHeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutAction();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get color styles for the role badge
  const getRoleBadgeStyle = (roleName: string) => {
    switch (roleName) {
      case "SUPER_ADMIN":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "CEO":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "OPERATIONS_MANAGER":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "CLIENT":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default:
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1E293B] bg-[#020617]/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6 lg:px-12">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 select-none">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <svg
              className="h-4.5 w-4.5 text-black"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            NexyriumOS
          </span>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs lg:text-sm">
            <User className="h-4 w-4 text-[#94A3B8]" />
            <span className="hidden text-zinc-300 sm:inline">{email}</span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${getRoleBadgeStyle(
                role
              )}`}
            >
              {role.replace("_", " ")}
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-[#1E293B] bg-[#0F172A] hover:bg-[#1E293B]/40 hover:text-white px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
