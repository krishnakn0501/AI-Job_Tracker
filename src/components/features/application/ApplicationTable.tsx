"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isToday, differenceInCalendarDays } from "date-fns";
import { ChevronRight, Calendar, Clock } from "lucide-react";
import type { Application } from "@prisma/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import ResumeStatusCell from "@/components/ResumeStatusCell";
import { toast } from "react-hot-toast";
import { getValidNextStatuses, isValidTransition } from "@/domains/application/entities/ApplicationStatus";
import { StatusChangeDialog } from "@/components/StatusChangeDialog";

type Props = {
  applications: Application[];
  onStatusChange: (id: string, status: string) => void;
};

const STATUSES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
] as const;

export default function ApplicationTable({
  applications,
  onStatusChange,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<{
    appId: string;
    fromStatus: string;
    toStatus: string;
  } | null>(null);
  const router = useRouter();

  const filtered = applications.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (id: string) => {
    router.push(`/application/${id}`);
  };

  const handleStatusChange = (appId: string, fromStatus: string, toStatus: string) => {
    // Validate transition
    if (!isValidTransition(fromStatus, toStatus)) {
      toast.error(`Cannot move from ${fromStatus} to ${toStatus}.`);
      return;
    }

    // Open dialog for confirmation
    setDialogProps({
      appId,
      fromStatus,
      toStatus,
    });
    setDialogOpen(true);
  };

  const handleConfirmStatusChange = () => {
    if (dialogProps) {
      onStatusChange(dialogProps.appId, dialogProps.toStatus);
      setDialogOpen(false);
      setDialogProps(null);
    }
  };

  const handleCancelStatusChange = () => {
    setDialogOpen(false);
    setDialogProps(null);
  };

  const renderFollowUp = (date: Date | null) => {
    if (!date) return <span className="text-slate-300">—</span>;
    const d = new Date(date);
    if (isToday(d)) {
      return (
        <span className="text-red-500 text-xs font-medium">Today</span>
      );
    }
    const days = differenceInCalendarDays(d, new Date());
    if (days > 0 && days <= 2) {
      return (
        <span className="text-amber-500 text-xs">
          {format(d, "MMM d")}
        </span>
      );
    }
    return <span className="text-sm text-slate-600">{format(d, "MMM d")}</span>;
  };

  if (filtered.length === 0 && applications.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-sm">No applications found.</p>
        <p className="text-xs mt-1">Click &quot;Add job&quot; to get started.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter row */}
      <div className="flex gap-3 mb-5">
        <Input
          placeholder="Search company or role…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs h-10 rounded-xl bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-slate-200 dark:border-neutral-700 shadow-sm transition-all focus:bg-white dark:focus:bg-neutral-800"
        />
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val)}
        >
          <SelectTrigger className="w-40 h-10 rounded-xl bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-slate-200 dark:border-neutral-700 shadow-sm transition-all focus:bg-white dark:focus:bg-neutral-800">
            <SelectValue>{statusFilter === "all" ? "All statuses" : statusFilter}</SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-slate-200 dark:border-neutral-700">
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty filtered state */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">No applications found.</p>
          <p className="text-xs mt-1">Try clearing your filters.</p>
        </div>
      ) : (
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.02)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/60 dark:bg-black/40 backdrop-blur-md z-10 border-b border-white/40 dark:border-white/10">
              <tr className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                <th className="px-6 py-4 text-left">Company / Role</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Applied</th>
                <th className="px-6 py-4 text-left">Follow-up</th>
                <th className="px-6 py-4 text-left">Resume</th>
                <th className="px-6 py-4 text-left w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const validNextStatuses = getValidNextStatuses(app.status);
                const isTerminal = validNextStatuses.length === 0;

                return (
                  <tr
                    key={app.id}
                    className="hover:bg-white/60 dark:hover:bg-white/5 cursor-pointer border-b border-white/40 dark:border-white/10 transition-colors duration-200"
                    onClick={() => handleRowClick(app.id)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {app.company}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{app.role}</p>
                    </td>
                    <td className="px-6 py-4">
                      {isTerminal ? (
                        <StatusBadge status={app.status} />
                      ) : (
                        <Select
                          value={app.status}
                          onValueChange={(newStatus) =>
                            handleStatusChange(app.id, app.status, newStatus)
                          }
                        >
                          <SelectTrigger className="w-fit h-9 rounded-full bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-slate-200 dark:border-neutral-700 shadow-sm transition-all focus:bg-white dark:focus:bg-neutral-800" onClick={(e) => e.stopPropagation()}>
                            <SelectValue>
                              <StatusBadge status={app.status} />
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border border-slate-200 dark:border-neutral-700">
                            {validNextStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium text-xs">
                      {format(new Date(app.appliedDate), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      {renderFollowUp(app.followUpDate)}
                    </td>
                    <td className="px-6 py-4">
                      <ResumeStatusCell
                        generationStatus={app.generationStatus}
                        resumeFinalPath={app.resumeFinalPath}
                        applicationId={app.id}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/application/${app.id}`);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialogProps && (
        <StatusChangeDialog
          open={dialogOpen}
          fromStatus={dialogProps.fromStatus}
          toStatus={dialogProps.toStatus}
          onConfirm={handleConfirmStatusChange}
          onCancel={handleCancelStatusChange}
        />
      )}
    </div>
  );
}
