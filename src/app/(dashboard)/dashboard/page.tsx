"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, LayoutGrid, List } from "lucide-react";
import toast from "react-hot-toast";
import type { Application } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatsBar from "@/components/StatsBar";
import ApplicationTable from "@/components/features/application/ApplicationTable";
import KanbanBoard from "@/components/features/application/KanbanBoard";

function TableSkeleton() {
  return (
    <div className="bg-white/40 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
      <div className="bg-white/60 dark:bg-black/40 px-6 py-4 border-b border-slate-200 dark:border-white/10 flex gap-4">
        {["w-1/3", "w-24", "w-24", "w-24", "w-24"].map((w, i) => (
          <Skeleton key={i} className={`h-4 ${w} rounded-md dark:bg-white/5`} />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-4"
        >
          <div className="flex-1">
            <Skeleton className="h-4 w-40 mb-2 rounded-md dark:bg-white/5" />
            <Skeleton className="h-3 w-28 rounded-md dark:bg-white/5" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full dark:bg-white/5" />
          <Skeleton className="h-4 w-16 rounded-md dark:bg-white/5" />
          <Skeleton className="h-4 w-20 rounded-md dark:bg-white/5" />
          <Skeleton className="h-8 w-24 rounded-md dark:bg-white/5" />
          <Skeleton className="h-8 w-8 rounded-full dark:bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white/60 dark:bg-black/30 backdrop-blur-xl rounded-2xl p-5 border border-white/40 dark:border-white/10"
        >
          <Skeleton className="h-3 w-24 mb-3 rounded-md dark:bg-white/5" />
          <Skeleton className="h-8 w-16 mb-2 rounded-md dark:bg-white/5" />
          <Skeleton className="h-3 w-20 rounded-md dark:bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban"); // Default to kanban
  const [greeting, setGreeting] = useState("");

  /* ---- Initial Setup ---- */
  useEffect(() => {
    document.title = "JobTrack — Dashboard";
    
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Persist view mode (always default to kanban unless explicitly set to table)
    const saved = localStorage.getItem("jobtrack-view");
    if (saved === "table") {
      setViewMode("table");
    } else {
      setViewMode("kanban"); // Enforce Kanban default
    }
  }, []);

  const handleViewChange = (mode: "kanban" | "table") => {
    setViewMode(mode);
    localStorage.setItem("jobtrack-view", mode);
  };

  /* ---- Fetch applications ---- */
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error("[Dashboard] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  /* ---- Optimistic status change ---- */
  const handleStatusChange = async (id: string, status: string) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );

    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      toast.error("Failed to update status");
      fetchApplications(); // revert
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto">
      {/* Premium Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {greeting}
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Here&apos;s an overview of your job applications.
          </p>
        </div>

        {/* Segmented Control for View Toggle */}
        <div className="inline-flex bg-slate-200/50 dark:bg-black/40 backdrop-blur-md p-1 rounded-xl border border-slate-300/50 dark:border-white/10 shadow-inner">
          <button
            onClick={() => handleViewChange("kanban")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              viewMode === "kanban"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-white/10"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </button>
          <button
            onClick={() => handleViewChange("table")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-white/10"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5"
            }`}
          >
            <List className="h-4 w-4" />
            Table
          </button>
        </div>
      </div>

      {loading ? (
        <>
          <StatsSkeleton />
          <TableSkeleton />
        </>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-sm">
          <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Briefcase className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
            No applications yet
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
            Your pipeline is empty! Start by uploading your base resume, then add your first job application so Claude can tailor it.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" asChild className="h-11 px-6 rounded-xl border-slate-300 dark:border-white/20 bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold shadow-sm hover:bg-slate-100 dark:hover:bg-white/10">
              <Link href="/my-resumes">Upload Resume</Link>
            </Button>
            <Button asChild className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm">
              <Link href="/add">Add Application</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <StatsBar applications={applications} />
          {viewMode === "table" ? (
            <ApplicationTable
              applications={applications}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <KanbanBoard
              applications={applications}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
