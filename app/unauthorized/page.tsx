"use client";

import React, { useState } from "react";
import { ShieldAlert, LogOut, LayoutDashboard } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function UnauthorizedPage() {
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

  const handleReturn = () => {
    // Redirecting to root '/' triggers the middleware redirection 
    // to their correct role-based dashboard!
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-[#F8FAFC]">
      {/* Glow mesh */}
      <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-red-600/5 blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] rounded-2xl border border-[#1E293B] bg-[#0F172A] p-8 shadow-2xl space-y-6 text-center relative z-10"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10 text-[#EF4444]">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Access Denied</h1>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            Your account does not have permission to access this dashboard. This resource is restricted to authorized roles.
          </p>
        </div>

        <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-4.5 text-xs text-red-400 text-left leading-relaxed">
          <span className="font-semibold block mb-1">Security Warning:</span>
          All unauthorized access attempts are logged and monitored. If you believe this is an error, please contact your systems administrator or operations manager.
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <button
            onClick={handleReturn}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#2563EB]/90 text-[#F8FAFC] font-semibold text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1E293B] bg-[#0F172A] hover:bg-[#1E293B]/40 hover:text-white text-zinc-300 font-semibold text-sm transition-all focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            {loading ? "Signing out..." : "Log Out"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
