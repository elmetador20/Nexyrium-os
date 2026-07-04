"use client";

import React, { useState } from "react";
import { ActivityLog } from "../types";
import { Search, History, Shield, Calendar, ArrowUpDown, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogsViewProps {
  logs: ActivityLog[];
}

export function LogsView({ logs }: LogsViewProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;

    if (search.trim() !== "") {
      const query = search.toLowerCase();
      const matchEmail = log.user_email.toLowerCase().includes(query);
      const matchAction = log.action.toLowerCase().includes(query);
      const matchDetails = log.details?.toLowerCase().includes(query) || false;
      return matchEmail || matchAction || matchDetails;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0F172A]/20 p-3 rounded-xl border border-[#1E293B] text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by user, action, or details..."
            className="pl-8 bg-[#090D16] border-[#1E293B] text-zinc-200 placeholder-zinc-500 text-xs h-9 focus:ring-[#3B82F6]"
          />
        </div>

        {/* Action Category Filter */}
        <div className="w-48">
          <Select value={actionFilter} onValueChange={(val) => setActionFilter(val || "all")}>
            <SelectTrigger className="bg-[#090D16] border-[#1E293B] text-zinc-300 h-9 text-xs">
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-[#1E293B] text-zinc-300 text-xs">
              <SelectItem value="all">All Action Types</SelectItem>
              {uniqueActions.map((act) => (
                <SelectItem key={act} value={act}>{act}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-[#1E293B] bg-[#090D16] rounded-xl overflow-hidden shadow-xl shadow-black/10">
        <table className="w-full text-left border-collapse text-xs select-none">
          <thead>
            <tr className="border-b border-[#1E293B] bg-[#0F172A]/30 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-3.5 pl-5">Timestamp</th>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Action</th>
              <th className="p-3.5">Details</th>
              <th className="p-3.5 text-right pr-5">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B] text-zinc-300">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#0F172A]/20 transition-all duration-100">
                  {/* Timestamp */}
                  <td className="p-3.5 pl-5 text-zinc-500 font-mono">
                    {new Date(log.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false
                    })}
                  </td>

                  {/* User */}
                  <td className="p-3.5 font-bold text-white">
                    {log.user_email}
                  </td>

                  {/* Action Category Badge */}
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {log.action}
                    </span>
                  </td>

                  {/* Details Description */}
                  <td className="p-3.5 text-zinc-400 max-w-sm truncate">
                    {log.details || "No details provided"}
                  </td>

                  {/* IP Address */}
                  <td className="p-3.5 text-right pr-5 text-zinc-500 font-mono">
                    {log.ip_address || "127.0.0.1"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-12 text-zinc-500">
                  <History className="h-10 w-10 mx-auto stroke-[1.5] mb-2 text-zinc-600" />
                  <p className="font-semibold text-zinc-400">No activity logs found</p>
                  <p className="text-[10px] text-zinc-500">No events matched your search filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
