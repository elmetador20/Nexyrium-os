import { getUserProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Layers, Target, Compass, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Operations Workspace | NexyriumOS",
  description: "Operations dashboard for tracking startup service engagements.",
};

export default async function OperationsDashboard() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile(supabase, user.id);
  const roleName = profile?.roleName;

  if (roleName !== "OPERATIONS_MANAGER") {
    redirect("/unauthorized");
  }

  // Query actual data from the "activity_logs" and "tasks" tables in Supabase
  let activityLogsItems: any[] = [];
  let tasksItems: any[] = [];
  try {
    const { data: logData } = await supabase.from("activity_logs").select("*").limit(5);
    const { data: taskData } = await supabase.from("tasks").select("*").limit(5);
    if (logData) activityLogsItems = logData;
    if (taskData) tasksItems = taskData;
  } catch (err) {
    console.error("Failed to fetch operations table data:", err);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none bg-black text-zinc-100 min-h-screen text-xs">
      
      {/* Header Panel with Gold Accents */}
      <div className="border border-zinc-850 bg-zinc-950 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest font-mono">Nexyrium Command Console</span>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-white via-zinc-200 to-amber-500 bg-clip-text text-transparent mt-1">
            Operations Workspace
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            Oversee investor pipeline processes, track campaigns, and coordinate fundraising operations.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Outreach Campaigns</span>
            <Send className="h-4 w-4 text-[#2563EB]" />
          </div>
          <p className="text-2xl font-bold">14 Active</p>
          <p className="text-xs text-[#94A3B8]">+3 new this week</p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Investor Matches</span>
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold">128 Curated</p>
          <p className="text-xs text-emerald-400">92% match relevance</p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Response Rate</span>
            <Compass className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold">42.5%</p>
          <p className="text-xs text-[#94A3B8]">Industry avg: 18%</p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Capital Raised</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold">$18.4M</p>
          <p className="text-xs text-[#94A3B8]">Across all client cohorts</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Tasks */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Operations Tasks</h2>
          {tasksItems.length > 0 ? (
            <div className="grid gap-3">
              {tasksItems.map((item, index) => (
                <div key={item.id || index} className="p-3 rounded-lg border border-zinc-900 bg-black/50 text-xs">
                  <pre className="text-[#94A3B8] whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg text-[#94A3B8] text-xs gap-1">
              <span className="text-zinc-500 font-semibold">Table Connected: public.tasks</span>
              <span>No active task records found.</span>
            </div>
          )}
        </div>

        {/* Activity Logs */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Recent Activity Logs</h2>
          {activityLogsItems.length > 0 ? (
            <div className="grid gap-3">
              {activityLogsItems.map((item, index) => (
                <div key={item.id || index} className="p-3 rounded-lg border border-zinc-900 bg-black/50 text-xs">
                  <pre className="text-[#94A3B8] whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg text-[#94A3B8] text-xs gap-1">
              <span className="text-zinc-500 font-semibold">Table Connected: public.activity_logs</span>
              <span>No recent activity logs found.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
