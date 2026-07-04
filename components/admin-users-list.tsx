"use client";

import React, { useState, useEffect } from "react";
import {
  getUsersAction,
  getRolesAction,
  updateUserStatusAction,
  updateUserRoleAction,
} from "@/app/actions/admin";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Loader2,
  Search,
  Filter,
  UserCheck,
  UserX,
  UserMinus,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserRecord {
  id: string;
  email: string;
  status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED" | "SUSPENDED";
  created_at: string;
  role_id: string;
  role: any;
}

interface RoleRecord {
  id: string;
  name: string;
}

export function AdminUsersList() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        getUsersAction(),
        getRolesAction(),
      ]);

      if (usersRes.success && usersRes.users) {
        setUsers(usersRes.users as UserRecord[]);
      } else {
        setErrorMessage(usersRes.error || "Failed to load users.");
      }

      if (rolesRes.success && rolesRes.roles) {
        setRoles(rolesRes.roles as RoleRecord[]);
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED" | "SUSPENDED") => {
    setUpdatingId(userId);
    setErrorMessage(null);
    try {
      const res = await updateUserStatusAction(userId, newStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, status: newStatus } : user
          )
        );
      } else {
        setErrorMessage(res.error || "Failed to update user status.");
      }
    } catch (err) {
      setErrorMessage("Failed to perform status update.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    setUpdatingId(userId);
    setErrorMessage(null);
    try {
      const res = await updateUserRoleAction(userId, newRoleId);
      if (res.success) {
        const updatedRole = roles.find((r) => r.id === newRoleId) || null;
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  role_id: newRoleId,
                  role: updatedRole ? { id: updatedRole.id, name: updatedRole.name } : null,
                }
              : user
          )
        );
      } else {
        setErrorMessage(res.error || "Failed to update user role.");
      }
    } catch (err) {
      setErrorMessage("Failed to perform role update.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter users based on search and status filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
      case "PENDING_APPROVAL":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-3 w-3" />
            Pending Approval
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
            <XCircle className="h-3 w-3" />
            Declined
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-400 border border-zinc-500/20">
            <UserX className="h-3 w-3" />
            Suspended
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search users by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-[#1E293B] bg-[#0F172A] pl-10 pr-4 text-sm text-[#F8FAFC] transition-all placeholder:text-zinc-500 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/40 outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Filter className="absolute left-3.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-[#1E293B] bg-[#0F172A] pl-9 pr-8 text-xs font-semibold text-[#F8FAFC] outline-none cursor-pointer appearance-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/40"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Declined</option>
            </select>
            <div className="pointer-events-none absolute right-3 text-[#94A3B8]">
              <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1E293B] bg-[#0F172A] hover:bg-[#1E293B]/40 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh users"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error alert */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-2.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-xs text-[#EF4444]"
          >
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <p className="leading-normal">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0F172A]/40">
        {loading ? (
          <div className="flex h-60 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
            <span className="text-sm text-[#94A3B8]">Loading user directory...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center gap-2 text-center p-6">
            <Shield className="h-10 w-10 text-zinc-600 mb-2" />
            <h4 className="text-sm font-semibold text-white">No Users Found</h4>
            <p className="text-xs text-[#94A3B8] max-w-xs">
              No registration requests or user profiles match the selected filters or search terms.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#0F172A] text-xs font-bold text-[#94A3B8] uppercase tracking-wider select-none">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60 text-sm">
                {filteredUsers.map((user) => {
                  const isUserUpdating = updatingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#0F172A]/30 transition-colors"
                    >
                      {/* Email */}
                      <td className="px-6 py-4.5 font-medium text-[#F8FAFC]">
                        {user.email}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4.5">
                        {getStatusBadge(user.status)}
                      </td>

                      {/* Role selection dropdown */}
                      <td className="px-6 py-4.5">
                        <div className="relative inline-flex items-center max-w-[180px]">
                          <select
                            value={user.role_id || ""}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={isUserUpdating || loading}
                            className="w-full h-8 rounded-lg border border-[#1E293B] bg-[#0F172A] pl-3 pr-8 text-xs font-medium text-[#F8FAFC] outline-none cursor-pointer appearance-none focus:border-[#2563EB] disabled:opacity-50"
                          >
                            <option value="" disabled>
                              Select Role
                            </option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-2.5 text-[#94A3B8]">
                            <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4.5 text-xs text-[#94A3B8]">
                        {new Date(user.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isUserUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#2563EB] mr-4" />
                          ) : (
                            <>
                              {/* Pending Approvals Actions */}
                              {user.status === "PENDING_APPROVAL" && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(user.id, "ACTIVE")}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 px-3 text-xs font-semibold text-emerald-400 border border-emerald-500/20 cursor-pointer transition-colors"
                                    title="Approve registration"
                                  >
                                    <UserCheck className="h-3.5 w-3.5" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(user.id, "REJECTED")}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 px-3 text-xs font-semibold text-red-400 border border-red-500/20 cursor-pointer transition-colors"
                                    title="Decline request"
                                  >
                                    <UserMinus className="h-3.5 w-3.5" />
                                    Decline
                                  </button>
                                </>
                              )}

                              {/* Active Accounts Actions */}
                              {user.status === "ACTIVE" && (
                                <button
                                  onClick={() => handleStatusChange(user.id, "SUSPENDED")}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-zinc-500/10 hover:bg-zinc-500/20 px-3 text-xs font-semibold text-zinc-400 border border-zinc-500/20 cursor-pointer transition-colors"
                                  title="Suspend account"
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                  Suspend
                                </button>
                              )}

                              {/* Suspended or Rejected Actions */}
                              {(user.status === "SUSPENDED" || user.status === "REJECTED") && (
                                <button
                                  onClick={() => handleStatusChange(user.id, "ACTIVE")}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#2563EB]/10 hover:bg-[#2563EB]/20 px-3 text-xs font-semibold text-blue-400 border border-[#2563EB]/20 cursor-pointer transition-colors"
                                  title="Reactivate account"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Activate
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
