"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, isToday } from "date-fns";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Application } from "@prisma/client";
import { toast } from "react-hot-toast";
import { isValidTransition } from "@/domains/application/entities/ApplicationStatus";
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

/* ------------------------------------------------------------------ */
/*  Draggable Card                                                     */
/* ------------------------------------------------------------------ */

function DraggableCard({
  app,
  onClick,
}: {
  app: Application;
  onClick: () => void;
}) {
  const wasDragging = useRef(false);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: app.id,
  });

  const isFollowUpToday = app.followUpDate && isToday(new Date(app.followUpDate));

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md rounded-xl border border-white/40 dark:border-white/10 p-4 mb-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md transition-all active:scale-[0.98] ${
        isFollowUpToday ? "border-l-4 border-l-red-500" : ""
      }`}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!wasDragging.current) onClick();
        wasDragging.current = false;
      }}
      onDragStart={() => {
        wasDragging.current = true;
      }}
    >
      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{app.company}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">{app.role}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-neutral-700/50">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {format(new Date(app.appliedDate), "MMM d")}
        </p>
        {isFollowUpToday && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Follow-up</span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Droppable Column                                                   */
/* ------------------------------------------------------------------ */

function DroppableColumn({
  status,
  apps,
  onCardClick,
}: {
  status: string;
  apps: Application[];
  onCardClick: (id: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-4 min-w-[280px] flex-1 flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
          {status}
        </span>
        <span className="text-xs font-medium bg-white/60 dark:bg-neutral-800/60 text-slate-600 dark:text-slate-300 rounded-full px-2.5 py-1 border border-white/40 dark:border-white/10 shadow-sm">
          {apps.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex-1 min-h-[100px]">
        {apps.map((app) => (
          <DraggableCard
            key={app.id}
            app={app}
            onClick={() => onCardClick(app.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Kanban Board                                                       */
/* ------------------------------------------------------------------ */

export default function KanbanBoard({
  applications,
  onStatusChange,
}: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<{
    fromStatus: string;
    toStatus: string;
    appId: string;
  } | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const appId = String(active.id);
    const newStatus = String(over.id);

    const app = applications.find((a) => a.id === appId);
    if (app && app.status !== newStatus) {
      // Validate the transition
      if (!isValidTransition(app.status, newStatus)) {
        toast.error(`Cannot move from ${app.status} to ${newStatus}.`);
        return;
      }

      // Open dialog for confirmation
      setDialogProps({
        fromStatus: app.status,
        toStatus: newStatus,
        appId,
      });
      setDialogOpen(true);
    }
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

  return (
    <>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STATUSES.map((status) => (
            <DroppableColumn
              key={status}
              status={status}
              apps={applications.filter((a) => a.status === status)}
              onCardClick={(id) => router.push(`/application/${id}`)}
            />
          ))}
        </div>
      </DndContext>

      {dialogProps && (
        <StatusChangeDialog
          open={dialogOpen}
          fromStatus={dialogProps.fromStatus}
          toStatus={dialogProps.toStatus}
          onConfirm={handleConfirmStatusChange}
          onCancel={handleCancelStatusChange}
        />
      )}
    </>
  );
}
