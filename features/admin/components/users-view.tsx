"use client";

import React, { useState } from "react";
import { UserProfile, Role } from "../types";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Check, 
  X, 
  UserX, 
  Trash2, 
  Edit3, 
  UserCheck, 
  Lock, 
  Eye, 
  ArrowUpDown,
  UserPlus
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UsersViewProps {
  users: UserProfile[];
  roles: Role[];
  onUpdateStatus: (userId: string, status: UserProfile["status"]) => Promise<void>;
  onUpdateRole: (userId: string, roleId: string) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onOpenCreateModal: () => void;
}

export function UsersView({ 
  users, 
  roles, 
  onUpdateStatus, 
  onUpdateRole, 
  onDeleteUser,
  onOpenCreateModal 
}: UsersViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"all" | "pending">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof UserProfile>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  // Filter logic
  const filteredUsers = users.filter((u) => {
    // Sub-tab filter
    if (activeSubTab === "pending" && u.status !== "PENDING_APPROVAL") return false;
    
    // Status filter
    if (statusFilter !== "all" && u.status !== statusFilter) return false;

    // Role filter
    if (roleFilter !== "all" && u.role_id !== roleFilter) return false;

    // Department filter
    if (deptFilter !== "all" && u.department !== deptFilter) return false;

    // Search filter
    if (search.trim() !== "") {
      const query = search.toLowerCase();
      const matchEmail = u.email.toLowerCase().includes(query);
      const matchName = u.full_name?.toLowerCase().includes(query) || false;
      return matchEmail || matchName;
    }

    return true;
  });

  // Sort logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === "role") {
      valA = a.role?.name || "";
      valB = b.role?.name || "";
    }

    if (valA === undefined || valA === null) return sortAsc ? 1 : -1;
    if (valB === undefined || valB === null) return sortAsc ? -1 : 1;

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: keyof UserProfile) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getStatusBadge = (status: UserProfile["status"]) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">Active</Badge>;
      case "PENDING_APPROVAL":
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold animate-pulse">Pending Approval</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-semibold">Rejected</Badge>;
      case "SUSPENDED":
        return <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-semibold">Suspended</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Selectors & Primary Button */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={() => setActiveSubTab("all")}
            className={cn(
              "pb-2 font-medium border-b-2 px-1 transition-colors cursor-pointer",
              activeSubTab === "all" 
                ? "border-blue-500 text-white" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            All Members
          </button>
          <button
            onClick={() => setActiveSubTab("pending")}
            className={cn(
              "pb-2 font-medium border-b-2 px-1 transition-colors relative cursor-pointer",
              activeSubTab === "pending" 
                ? "border-blue-500 text-white" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            Pending Approvals
            {users.filter(u => u.status === "PENDING_APPROVAL").length > 0 && (
              <span className="absolute -top-1.5 -right-2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
            )}
          </button>
        </div>

        <Button
          onClick={onOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 h-8 flex items-center gap-1.5 rounded-lg transition-all"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Invite User
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0F172A]/20 p-3 rounded-xl border border-[#1E293B] text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-8 bg-[#090D16] border-[#1E293B] text-zinc-200 placeholder-zinc-500 text-xs h-9 focus:ring-[#3B82F6]"
          />
        </div>

        {/* Status Filter */}
        {activeSubTab !== "pending" && (
          <div className="w-36">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
              <SelectTrigger className="bg-[#090D16] border-[#1E293B] text-zinc-300 h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0F172A] border-[#1E293B] text-zinc-300 text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Role Filter */}
        <div className="w-40">
          <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || "all")}>
            <SelectTrigger className="bg-[#090D16] border-[#1E293B] text-zinc-300 h-9 text-xs">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-[#1E293B] text-zinc-300 text-xs">
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Department Filter */}
        <div className="w-36">
          <Select value={deptFilter} onValueChange={(val) => setDeptFilter(val || "all")}>
            <SelectTrigger className="bg-[#090D16] border-[#1E293B] text-zinc-300 h-9 text-xs">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-[#1E293B] text-zinc-300 text-xs">
              <SelectItem value="all">All Depts</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Research">Research</SelectItem>
              <SelectItem value="Creative">Creative</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="External Client">External Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-[#1E293B] bg-[#090D16] rounded-xl overflow-hidden shadow-xl shadow-black/10">
        <table className="w-full text-left border-collapse text-xs select-none">
          <thead>
            <tr className="border-b border-[#1E293B] bg-[#0F172A]/30 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-3.5 pl-5">Member</th>
              <th className="p-3.5 cursor-pointer hover:bg-[#1E293B]/20" onClick={() => toggleSort("role")}>
                <div className="flex items-center gap-1">
                  Role
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 cursor-pointer hover:bg-[#1E293B]/20" onClick={() => toggleSort("created_at")}>
                <div className="flex items-center gap-1">
                  Created
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5 text-right pr-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B] text-zinc-300">
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#0F172A]/30 transition-all duration-150">
                  {/* Name / Email */}
                  <td className="p-3.5 pl-5 flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-zinc-700">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="bg-blue-500/10 text-blue-400 font-bold text-xs uppercase">
                        {(user.full_name || user.email)[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white leading-tight">
                        {user.full_name || "Unverified Name"}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono leading-none">
                        {user.email}
                      </p>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="p-3.5">
                    <span className="font-mono font-medium bg-[#0F172A] border border-[#1E293B] px-2 py-1 rounded text-[10px] text-zinc-400">
                      {user.role?.name || "NO_ROLE"}
                    </span>
                  </td>

                  {/* Dept */}
                  <td className="p-3.5 font-medium text-zinc-400">
                    {user.department || "Operations"}
                  </td>

                  {/* Status */}
                  <td className="p-3.5">
                    {getStatusBadge(user.status)}
                  </td>

                  {/* Joined Date */}
                  <td className="p-3.5 text-zinc-500 font-mono">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </td>

                  {/* Actions Menu */}
                  <td className="p-3.5 text-right pr-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-7 w-7 p-0 hover:bg-[#1E293B] rounded-lg flex items-center justify-center cursor-pointer">
                        <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-[#0F172A] border-[#1E293B] text-zinc-200">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Member Actions
                          </DropdownMenuLabel>
                          
                          {/* Approval actions if pending */}
                          {user.status === "PENDING_APPROVAL" ? (
                            <>
                              <DropdownMenuItem 
                                onClick={() => onUpdateStatus(user.id, "ACTIVE")}
                                className="text-xs gap-2 py-2 text-emerald-400 focus:text-emerald-400 cursor-pointer hover:bg-emerald-500/10"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Approve Account</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onUpdateStatus(user.id, "REJECTED")}
                                className="text-xs gap-2 py-2 text-red-400 focus:text-red-400 cursor-pointer hover:bg-red-500/10"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Reject Request</span>
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              {/* Suspend / Reactivate */}
                              {user.status === "ACTIVE" ? (
                                <DropdownMenuItem 
                                  onClick={() => onUpdateStatus(user.id, "SUSPENDED")}
                                  className="text-xs gap-2 py-2 text-zinc-400 cursor-pointer hover:bg-zinc-800"
                                >
                                  <UserX className="h-3.5 w-3.5 text-zinc-500" />
                                  <span>Suspend Account</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => onUpdateStatus(user.id, "ACTIVE")}
                                  className="text-xs gap-2 py-2 text-emerald-400 focus:text-emerald-400 cursor-pointer hover:bg-emerald-500/10"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  <span>Reactivate Account</span>
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator className="bg-[#1E293B]" />

                        {/* Role Change Submenu */}
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Reassign Role
                          </DropdownMenuLabel>
                          {roles.map((r) => {
                            const isCurrent = user.role_id === r.id;
                            return (
                              <DropdownMenuItem
                                key={r.id}
                                disabled={isCurrent}
                                onClick={() => onUpdateRole(user.id, r.id)}
                                className={cn(
                                  "text-[10px] py-1 px-3 cursor-pointer hover:bg-[#1E293B]/50",
                                  isCurrent && "text-[#3B82F6] font-semibold"
                                )}
                              >
                                <div className="flex items-center gap-1.5">
                                  {isCurrent && <Check className="h-3 w-3" />}
                                  <span>{r.name}</span>
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator className="bg-[#1E293B]" />

                        {/* Reset Password */}
                        <DropdownMenuItem className="text-xs gap-2 py-2 cursor-pointer hover:bg-[#1E293B]/50">
                          <Lock className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Reset Password</span>
                        </DropdownMenuItem>

                        {/* Delete User */}
                        <DropdownMenuItem 
                          onClick={() => onDeleteUser(user.id)}
                          className="text-xs gap-2 py-2 text-red-400 focus:text-red-400 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Profile</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12 text-zinc-500">
                  <UserX className="h-10 w-10 mx-auto stroke-[1.5] mb-2 text-zinc-600" />
                  <p className="font-semibold text-zinc-400">No member accounts found</p>
                  <p className="text-[10px] text-zinc-500">Try adjusting your filters or search query.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
