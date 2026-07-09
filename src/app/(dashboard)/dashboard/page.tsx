"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import type { Application } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatsBar from "@/components/StatsBar";
import ApplicationTable from "@/components/features/application/ApplicationTable";
import KanbanBoard from "@/components/features/application/KanbanBoard";

function TableSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Fake header row */}
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex gap-4">
        {["w-1/3", "w-20", "w-20", "w-20", "w-24"].map((w, i) => (
          <Skeleton key={i} className={`h-3.5 ${w} rounded`} />
        ))}
      </div>
      {/* Fake rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-4"
        >
          <div className="flex-1">
            <Skeleton className="h-3.5 w-36 mb-1.5 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3.5 w-12 rounded" />
          <Skeleton className="h-3.5 w-16 rounded" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-slate-50 rounded-lg p-4 border border-slate-100"
        >
          <Skeleton className="h-3 w-20 mb-2 rounded" />
          <Skeleton className="h-7 w-12 mb-1 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");

  /* ---- Persist view mode in localStorage ---- */
  useEffect(() => {
    const saved = localStorage.getItem("jobtrack-view");
    if (saved === "kanban" || saved === "table") setViewMode(saved);
  }, []);

  /* ---- Set page title ---- */
  useEffect(() => {
    document.title = "JobTrack — Dashboard";
  }, []);

  const toggleView = () => {
    const next = viewMode === "table" ? "kanban" : "table";
    setViewMode(next);
    localStorage.setItem("jobtrack-view", next);
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
    // Optimistic update
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Dashboard Overview</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleView}
          className="h-9 px-4 rounded-xl border-slate-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-300 font-medium shadow-sm transition-all"
        >
          {viewMode === "table" ? "⊞ Kanban View" : "☰ Table View"}
        </Button>
      </div>

      {loading ? (
        <>
          <StatsSkeleton />
          <TableSkeleton />
        </>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Briefcase className="h-12 w-12 text-slate-200 mb-4" />
          <h2 className="text-lg font-medium text-slate-700 mb-1">
            No applications yet
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Start by uploading your resume, then add your first job.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/my-resumes">Upload resume</Link>
            </Button>
            <Button asChild>
              <Link href="/add">Add first job</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
