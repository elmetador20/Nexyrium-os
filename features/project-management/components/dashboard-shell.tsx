"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderGit2, 
  CheckSquare, 
  Search, 
  FileText, 
  Palette, 
  ShieldCheck, 
  Calendar, 
  BarChart3, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  Briefcase,
  User,
  CreditCard,
  Loader2
} from "lucide-react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface DashboardShellProps {
  children: React.ReactNode;
  userRole: string;
  userEmail: string;
  userName: string;
}

export function DashboardShell({
  children,
  userRole,
  userEmail,
  userName
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (navigatingTo) {
      e.preventDefault();
      return;
    }
    if (pathname === href) return;
    setNavigatingTo(href);
  };

  useEffect(() => {
    const supabase = createClient();
    let channel: any;

    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (data) {
        setNotifications(data);
      }

      const channelId = `notifications_realtime_${Math.random().toString(36).substring(7)}`;
      channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev].slice(0, 15));
          }
        )
        .subscribe();
    }

    fetchNotifications();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const markAllAsRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getDashboardHref = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "/dashboard/admin";
      case "CEO":
        return "/dashboard/ceo";
      case "PROJECT_MANAGER":
        return "/dashboard/project-manager";
      case "OPERATIONS_MANAGER":
        return "/dashboard/operations";
      case "CLIENT":
        return "/dashboard/client";
      case "RESEARCHER":
        return "/dashboard/research";
      case "CONTENT_WRITER":
        return "/dashboard/content";
      case "DESIGNER":
        return "/dashboard/design";
      case "QA":
        return "/dashboard/qa";
      case "FINANCE":
        return "/dashboard/finance";
      default:
        return "/dashboard/projects";
    }
  };

  // Define sidebar paths based on requested list
  const allMenuItems: SidebarItem[] = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      href: getDashboardHref(userRole), 
      icon: LayoutDashboard 
    },
    { id: "projects", label: "Projects", href: "/dashboard/projects", icon: FolderGit2 },
    { id: "tasks", label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { id: "clients", label: "Clients", href: "/dashboard/client", icon: Briefcase },
    { id: "research", label: "Research", href: "/dashboard/research", icon: Search },
    { id: "content", label: "Content", href: "/dashboard/content", icon: FileText },
    { id: "design", label: "Design", href: "/dashboard/design", icon: Palette },
    { id: "qa", label: "QA", href: "/dashboard/qa", icon: ShieldCheck },
    { id: "finance", label: "Finance", href: "/dashboard/finance", icon: CreditCard },
    { id: "calendar", label: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    { id: "reports", label: "Reports", href: "/dashboard/reports", icon: BarChart3 }
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter((item) => {
    // Finance menu item is only visible to SUPER_ADMIN, CEO, and FINANCE roles
    if (item.id === "finance") {
      return ["SUPER_ADMIN", "CEO", "FINANCE"].includes(userRole);
    }

    // Admin/PM/CEO/Ops see everything else
    if (["SUPER_ADMIN", "PROJECT_MANAGER", "CEO", "OPERATIONS_MANAGER"].includes(userRole)) {
      return true;
    }
    
    // Client sees Dashboard and Calendar
    if (userRole === "CLIENT") {
      return ["dashboard", "calendar"].includes(item.id);
    }
    
    // Contributor roles see: Dashboard, Tasks, and Calendar
    if (["DESIGNER", "RESEARCHER", "CONTENT_WRITER", "QA", "FINANCE"].includes(userRole)) {
      if (userRole === "FINANCE") {
        return ["dashboard", "tasks", "calendar", "finance"].includes(item.id);
      }
      return ["dashboard", "tasks", "calendar"].includes(item.id);
    }
    
    // Default fallback
    return ["dashboard", "tasks"].includes(item.id);
  });

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const activeItem = menuItems.find(item => pathname === item.href) || menuItems[0];

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-zinc-700 bg-zinc-900 shrink-0 select-none">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-700 gap-2 shrink-0">
          <Logo className="h-6 w-auto" />
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-3">
            Console Workspace
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isCurrentlyNavigating = navigatingTo === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleItemClick(e, item.href)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 text-[13px] font-medium rounded-xl transition-all duration-200 relative group cursor-pointer",
                    isActive 
                      ? "bg-zinc-800 text-amber-500 border border-zinc-700 shadow-sm scale-[1.02]" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/40 hover:scale-[1.01]"
                  )}
                >
                  {isCurrentlyNavigating ? (
                    <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin text-amber-500" />
                  ) : (
                    <Icon className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105",
                      isActive ? "text-amber-500" : "text-zinc-500 group-hover:text-zinc-300"
                    )} />
                  )}
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-5 bg-amber-500 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User profile footer */}
        <div className="p-5 border-t border-zinc-700 bg-zinc-900 space-y-4 shrink-0">
          <div className="flex items-center gap-3 p-1.5 bg-zinc-950/40 border border-zinc-700/50 rounded-2xl">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 uppercase font-mono shadow-sm">
              {userName ? userName[0] : userEmail[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white leading-tight truncate text-xs">{userName || "User Profile"}</p>
              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{userEmail}</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-zinc-750 bg-zinc-950/20 hover:bg-red-500/10 hover:border-red-500/30 text-zinc-450 hover:text-red-400 font-bold rounded-xl transition duration-200 cursor-pointer text-xs"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900 border-r border-zinc-700 flex flex-col transition-transform duration-300 ease-in-out lg:hidden",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-700 shrink-0">
          <Logo className="h-5 w-auto" />
          <button onClick={() => setIsMobileOpen(false)} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isCurrentlyNavigating = navigatingTo === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  setIsMobileOpen(false);
                  handleItemClick(e, item.href);
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 text-[13px] font-medium rounded-xl transition duration-200",
                  isActive ? "bg-zinc-800 text-amber-500" : "text-zinc-400 hover:bg-zinc-800/50"
                )}
              >
                {isCurrentlyNavigating ? (
                  <Loader2 className="h-4.5 w-4.5 shrink-0 animate-spin text-amber-500" />
                ) : (
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-700 bg-zinc-950 flex items-center justify-between px-8 shrink-0 z-30 select-none">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Linear-style Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
              <span className="text-zinc-500">NexyriumOS</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-500">Workspace</span>
              <span className="text-zinc-700">/</span>
              <span className="text-white font-semibold">{activeItem ? activeItem.label : "Console"}</span>
            </div>
          </div>

          {/* Quick Search Concept Input (Linear-style) */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-500 cursor-pointer hover:border-zinc-600 transition">
            <Search className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Search projects, tasks...</span>
            <kbd className="ml-auto text-[9px] bg-zinc-950 border border-zinc-700 px-1.5 py-0.5 rounded font-mono text-zinc-650">⌘K</kbd>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 border border-zinc-700 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white relative cursor-pointer transition duration-155"
              >
                <Bell className="h-4 w-4" />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 text-xs space-y-3 z-50"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
                      <h4 className="font-bold text-white">Platform Notifications</h4>
                      {notifications.some(n => !n.is_read) && (
                        <button 
                          onClick={markAllAsRead} 
                          className="text-[10px] text-amber-500 hover:underline cursor-pointer font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="text-zinc-550 text-center py-4">No notifications yet</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={cn("p-2.5 rounded-xl transition duration-150 border border-transparent", n.is_read ? "opacity-60 hover:bg-zinc-800/40" : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800")}>
                            <div className="flex items-center justify-between">
                              <span className={cn("font-semibold block", n.is_read ? "text-zinc-400" : "text-amber-500")}>{n.title}</span>
                              <span className="text-[9px] text-zinc-500 font-mono">{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                            <span className="text-zinc-400 mt-1 block leading-relaxed">{n.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="text-[9px] bg-amber-500/10 border border-amber-500/25 text-amber-500 font-mono font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
              {userRole}
            </span>
          </div>
        </header>

        {/* Pages Mount Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

    </div>
  );
}
