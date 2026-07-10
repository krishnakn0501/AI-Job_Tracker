"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isToday, differenceInCalendarDays } from "date-fns";
import { ChevronRight, Search, Filter } from "lucide-react";
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
  onSelectApp: (id: string) => void;
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
  onSelectApp,
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
    onSelectApp(id);
  };

  const handleStatusChange = (appId: string, fromStatus: string, toStatus: string) => {
    if (!isValidTransition(fromStatus, toStatus)) {
      toast.error(`Cannot move from ${fromStatus} to ${toStatus}.`);
      return;
    }

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
    if (!date) return <span className="text-slate-300 dark:text-slate-600">—</span>;
    const d = new Date(date);
    if (isToday(d)) {
      return (
        <span className="text-[10px] uppercase tracking-widest font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full ring-1 ring-red-500/20">
          Today
        </span>
      );
    }
    const days = differenceInCalendarDays(d, new Date());
    if (days > 0 && days <= 2) {
      return (
        <span className="text-amber-600 dark:text-amber-400 font-medium text-xs bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full ring-1 ring-amber-500/20">
          {format(d, "MMM d")}
        </span>
      );
    }
    return <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{format(d, "MMM d")}</span>;
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
    <div className="space-y-6">
      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search company or role…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 rounded-xl bg-white/60 dark:bg-black/30 backdrop-blur-xl border-slate-200 dark:border-white/10 shadow-sm transition-all focus:bg-white dark:focus:bg-black/50"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none z-10" />
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val)}
          >
            <SelectTrigger className="w-[180px] h-10 pl-10 rounded-xl bg-white/60 dark:bg-black/30 backdrop-blur-xl border-slate-200 dark:border-white/10 shadow-sm transition-all focus:bg-white dark:focus:bg-black/50">
              <SelectValue>{statusFilter === "all" ? "All statuses" : statusFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty filtered state */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-dashed border-slate-300 dark:border-white/10 rounded-3xl">
          <p className="text-base font-medium text-slate-600 dark:text-slate-300">No applications found.</p>
          <p className="text-sm text-slate-400 mt-1">Try clearing your filters or searching for something else.</p>
        </div>
      ) : (
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
                <tr className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-semibold">Company / Role</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Applied Date</th>
                  <th className="px-6 py-4 text-left font-semibold">Follow-up</th>
                  <th className="px-6 py-4 text-left font-semibold">Resume</th>
                  <th className="px-6 py-4 text-left w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map((app) => {
                  const validNextStatuses = getValidNextStatuses(app.status);
                  const isTerminal = validNextStatuses.length === 0;

                  return (
                    <tr
                      key={app.id}
                      className="group hover:bg-white/60 dark:hover:bg-white/5 cursor-pointer transition-colors duration-200"
                      onClick={() => handleRowClick(app.id)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white text-sm mb-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {app.company}
                        </p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{app.role}</p>
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
                            <SelectTrigger className="w-fit h-8 rounded-full bg-transparent hover:bg-white/50 dark:hover:bg-white/10 border-transparent hover:border-slate-200 dark:hover:border-white/10 shadow-none hover:shadow-sm transition-all focus:ring-0" onClick={(e) => e.stopPropagation()}>
                              <SelectValue>
                                <StatusBadge status={app.status} />
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                              {validNextStatuses.map((status) => (
                                <SelectItem key={status} value={status} className="font-medium">
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium text-sm">
                        {format(new Date(app.appliedDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        {renderFollowUp(app.followUpDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div onClick={(e) => e.stopPropagation()}>
                          <ResumeStatusCell
                            generationStatus={app.generationStatus}
                            resumeFinalPath={app.resumeFinalPath}
                            applicationId={app.id}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectApp(app.id);
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
