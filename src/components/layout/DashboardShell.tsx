"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Settings, LogOut, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReminderPanel from "@/components/ReminderPanel";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Props = {
  children: React.ReactNode;
  topBarContent?: React.ReactNode;
  hideReminderPanel?: boolean;
};

/* ------------------------------------------------------------------ */
/*  NavLink (internal helper)                                          */
/* ------------------------------------------------------------------ */

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
        isActive
          ? "bg-slate-100 text-slate-900 font-medium"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  DashboardShell                                                     */
/* ------------------------------------------------------------------ */

export default function DashboardShell({ children, topBarContent, hideReminderPanel = false }: Props) {
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* ---- Left Sidebar ---- */}
      <aside className="w-[200px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-800">
            JobTrack
          </span>
          <p className="text-xs text-slate-400 mt-0.5">Application tracker</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <NavLink href="/dashboard" icon={LayoutDashboard}>
            Dashboard
          </NavLink>
          <NavLink href="/my-resumes" icon={FileText}>
            My Resumes
          </NavLink>
          <NavLink href="/help" icon={BookOpen}>
            Help
          </NavLink>
          <NavLink href="/settings" icon={Settings}>
            Settings
          </NavLink>
        </nav>

        {/* Add job button */}
        <div className="p-3 border-t border-slate-200">
          <Button className="w-full h-9 text-sm" asChild>
            <Link href="/add">+ Add job</Link>
          </Button>
        </div>

        {/* Logout button */}
        <div className="p-3 border-t border-slate-200">
          <Button
            variant="ghost"
            className="w-full h-9 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ---- Main Area ---- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          {topBarContent}
          {/* Gear icon button */}
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Content + Right panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {/* Right panel */}
          {!hideReminderPanel && <ReminderPanel />}
        </div>
      </div>
    </div>
  );
}