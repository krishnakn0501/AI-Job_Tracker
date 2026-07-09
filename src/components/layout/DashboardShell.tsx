"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Settings, LogOut, BookOpen, Menu, Plus, ChevronLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import RemindersBell from "@/components/layout/RemindersBell";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Props = {
  children: React.ReactNode;
};

/* ------------------------------------------------------------------ */
/*  NavLink (internal helper)                                          */
/* ------------------------------------------------------------------ */

function NavLink({
  href,
  icon: Icon,
  collapsed,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      title={collapsed ? (typeof children === 'string' ? children : '') : undefined}
      className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
        isActive
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium shadow-md"
          : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span className="truncate">{children}</span>}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  DashboardShell                                                     */
/* ------------------------------------------------------------------ */

export default function DashboardShell({ children }: Props) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Dynamic Route Logic
  let title = "Dashboard";
  let showBack = true;
  let hideReminderPanel = false;

  if (pathname === "/dashboard") {
    title = "Applications";
    showBack = false;
  } else if (pathname === "/add") {
    title = "Add new job";
  } else if (pathname.startsWith("/application/")) {
    title = "Application Details";
  } else if (pathname === "/my-resumes") {
    title = "My Resumes";
    hideReminderPanel = true;
  } else if (pathname === "/reminders") {
    title = "Reminders";
  } else if (pathname === "/settings") {
    title = "Settings";
  } else if (pathname === "/help") {
    title = "Help & Glossary";
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-neutral-900 relative overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Abstract Background Elements for Glassmorphism */}
      <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-slate-300/30 dark:bg-neutral-800/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-slate-200/30 dark:bg-neutral-700/30 blur-[120px] pointer-events-none" />

      {/* ---- Left Sidebar ---- */}
      <aside 
        className={`flex-shrink-0 bg-white/60 dark:bg-black/30 backdrop-blur-xl border-r border-white/40 dark:border-white/10 flex flex-col transition-all duration-300 z-20 ${
          isSidebarCollapsed ? "w-[80px]" : "w-[240px]"
        }`}
      >
        {/* Logo & Toggle */}
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-4'} py-4 border-b border-white/40 dark:border-white/10 h-16`}>
          {!isSidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-800 dark:text-white">
                JobTrack
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Application tracker</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          <NavLink href="/dashboard" icon={LayoutDashboard} collapsed={isSidebarCollapsed}>
            Dashboard
          </NavLink>
          <NavLink href="/my-resumes" icon={FileText} collapsed={isSidebarCollapsed}>
            My Resumes
          </NavLink>
          <NavLink href="/reminders" icon={Bell} collapsed={isSidebarCollapsed}>
            Reminders
          </NavLink>
          <NavLink href="/help" icon={BookOpen} collapsed={isSidebarCollapsed}>
            Help
          </NavLink>
          <NavLink href="/settings" icon={Settings} collapsed={isSidebarCollapsed}>
            Settings
          </NavLink>
        </nav>

        {/* Add job button */}
        <div className="p-4 border-t border-white/40 dark:border-white/10">
          <Button 
            className={`h-11 rounded-xl w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 shadow-md hover:shadow-lg transition-all duration-200 ${isSidebarCollapsed ? 'px-0 justify-center' : ''}`} 
            asChild
          >
            <Link href="/add">
              {isSidebarCollapsed ? <Plus className="h-5 w-5" /> : "+ Add job"}
            </Link>
          </Button>
        </div>

        {/* Logout button */}
        <div className="p-4 pb-6">
          <Button
            variant="ghost"
            className={`w-full h-11 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 transition-all ${
              isSidebarCollapsed ? "justify-center px-0" : "justify-start px-3"
            }`}
            onClick={handleLogout}
            title={isSidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut className={`h-5 w-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
            {!isSidebarCollapsed && "Logout"}
          </Button>
        </div>
      </aside>

      {/* ---- Main Area ---- */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top bar */}
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md border-b border-white/40 dark:border-white/10 px-8 h-16 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            {showBack && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 shadow-sm text-slate-600 dark:text-slate-300"
                onClick={() => router.back()}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{title}</h1>
          </div>
          {/* Top Bar actions */}
          <div className="flex items-center gap-3">
            <RemindersBell />
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 shadow-sm transition-all duration-200">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-8 py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}