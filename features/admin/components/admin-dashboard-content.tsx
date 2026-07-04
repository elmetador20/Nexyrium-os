"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardView } from "./dashboard-view";
import { UsersView } from "./users-view";
import { LogsView } from "./logs-view";
import { SettingsView } from "./settings-view";
import { CreateUserModal } from "./create-user-modal";
import { UserProfile, Role, DashboardStats, ActivityLog } from "../types";
import { 
  updateUserStatusAction, 
  updateUserRoleAction, 
  createUserAction, 
  deleteUserAction, 
  getAdminStatsAction,
  getUsersAction,
  getActivityLogsAction
} from "@/app/actions/admin";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

interface AdminDashboardContentProps {
  email: string;
  role: string;
  initialUsers: UserProfile[];
  initialRoles: Role[];
  initialStats: DashboardStats;
}

export function AdminDashboardContent({
  email,
  role,
  initialUsers,
  initialRoles,
  initialStats,
}: AdminDashboardContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Dynamic state for tables & stats (refetched after updates)
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [roles] = useState<Role[]>(initialRoles);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [logs, setLogs] = useState<ActivityLog[]>(initialStats.recentActivities);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/admin?tab=${tab}`);
  };

  // Helper to reload data
  const reloadData = async () => {
    const usersRes = await getUsersAction();
    if (usersRes.success && usersRes.users) {
      setUsers(usersRes.users as UserProfile[]);
    }
    const statsRes = await getAdminStatsAction();
    if (statsRes.success && statsRes.stats) {
      setStats(statsRes.stats as DashboardStats);
    }
    const logsRes = await getActivityLogsAction();
    if (logsRes.success && logsRes.logs) {
      setLogs(logsRes.logs as ActivityLog[]);
    }
  };

  // 1. Approve/Suspend User
  const handleUpdateStatus = async (userId: string, status: UserProfile["status"]) => {
    const result = await updateUserStatusAction(userId, status);
    if (result.success) {
      toast.success(`User status updated to ${status}.`);
      await reloadData();
    } else {
      toast.error(result.error || "Failed to update status.");
    }
  };

  // 2. Reassign Role
  const handleUpdateRole = async (userId: string, roleId: string) => {
    const result = await updateUserRoleAction(userId, roleId);
    if (result.success) {
      toast.success("Role updated successfully.");
      await reloadData();
    } else {
      toast.error(result.error || "Failed to update role.");
    }
  };

  // 3. Create/Invite User
  const handleCreateUser = async (values: any) => {
    const result = await createUserAction({
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      roleId: values.roleId,
      status: values.status,
    });

    if (result.success) {
      toast.success("Employee invitation profile created.");
      await reloadData();
    } else {
      toast.error(result.error || "Failed to invite employee.");
    }
  };

  // 4. Delete User Profile
  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user profile? This action is irreversible.")) {
      const result = await deleteUserAction(userId);
      if (result.success) {
        toast.success("User profile deleted.");
        await reloadData();
      } else {
        toast.error(result.error || "Failed to delete user profile.");
      }
    }
  };

  const getPendingApprovalsCount = () => {
    return users.filter((u) => u.status === "PENDING_APPROVAL").length;
  };

  const pendingCount = getPendingApprovalsCount();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none bg-black text-zinc-100 min-h-screen text-xs">
      
      {/* Horizontal Tabs Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
        <div>
          <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider font-mono">Super Admin Console</span>
          <h2 className="text-xl font-black text-white mt-1">Management Portal</h2>
          <p className="text-zinc-550 mt-1">Approve pending system users, inspect activity logs, and edit global options.</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-1 flex gap-1 items-center">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "users", label: "User Profiles", badge: pendingCount > 0 ? pendingCount : undefined },
            { id: "logs", label: "Security Logs" },
            { id: "settings", label: "System Settings" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1 px-3 py-2 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                  isActive 
                    ? "bg-zinc-900 border border-zinc-800 text-amber-500" 
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[8px] font-extrabold text-white bg-red-500 rounded-full animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === "dashboard" && (
              <DashboardView 
                stats={stats} 
                onTabChange={handleTabChange} 
                onOpenCreateUser={() => setCreateModalOpen(true)}
              />
            )}

            {activeTab === "users" && (
              <UsersView 
                users={users} 
                roles={roles} 
                onUpdateStatus={handleUpdateStatus} 
                onUpdateRole={handleUpdateRole} 
                onDeleteUser={handleDeleteUser}
                onOpenCreateModal={() => setCreateModalOpen(true)}
              />
            )}

            {activeTab === "logs" && (
              <LogsView logs={logs} />
            )}

            {activeTab === "settings" && (
              <SettingsView />
            )}

            {/* Handle empty fallbacks for items that aren't fully customizable */}
            {!["dashboard", "users", "logs", "settings"].includes(activeTab) && (
              <div className="h-[400px] border border-dashed border-zinc-850 rounded-xl flex flex-col items-center justify-center text-zinc-500 gap-1.5 p-6 text-center">
                <span className="font-semibold text-zinc-400 capitalize text-sm">{activeTab} View Placeholder</span>
                <span className="text-[11px] max-w-md">
                  This admin panel route is active. The database queries for {activeTab} will load live data once records are added.
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Global Invitation Modal */}
      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        roles={roles}
        onSubmit={handleCreateUser}
      />
    </div>
  );
}
