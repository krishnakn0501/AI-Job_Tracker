"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, isToday } from "date-fns";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Application } from "@prisma/client";
import { toast } from "react-hot-toast";
import { isValidTransition } from "@/domains/application/entities/ApplicationStatus";
import { StatusChangeDialog } from "@/components/StatusChangeDialog";
import { Clock, BriefcaseBusiness, CheckCircle2, XCircle, Users } from "lucide-react";

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

/* --- Helpers for Column Styling --- */
const getColumnConfig = (status: string) => {
  switch (status) {
    case "Applied":
      return { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    case "Screening":
      return { icon: BriefcaseBusiness, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    case "Interview":
      return { icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" };
    case "Offer":
      return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    case "Rejected":
      return { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" };
    default:
      return { icon: Clock, color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" };
  }
};

/* ------------------------------------------------------------------ */
/*  Card UI (Visual representation only)                              */
/* ------------------------------------------------------------------ */
function KanbanCard({
  app,
  isDragging,
  isOverlay,
}: {
  app: Application;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  const isFollowUpToday = app.followUpDate && isToday(new Date(app.followUpDate));

  return (
    <div
      className={`relative bg-white dark:bg-neutral-800 rounded-2xl border p-4 mb-3 cursor-grab shadow-sm transition-[box-shadow,border-color,opacity,transform] duration-200 transform-gpu ${
        isOverlay
          ? "z-50 scale-105 shadow-xl border-indigo-500/50 cursor-grabbing ring-2 ring-indigo-500/50 rotate-2"
          : isDragging
          ? "opacity-30 border-slate-200 dark:border-white/10 border-dashed"
          : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md active:scale-[0.98]"
      } ${isFollowUpToday && !isOverlay ? "overflow-hidden" : ""}`}
    >
      {/* Accent left border for Follow-ups */}
      {isFollowUpToday && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-2xl"></div>
      )}

      <p className="text-sm font-bold text-slate-900 dark:text-white truncate pr-2">{app.company}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">{app.role}</p>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {format(new Date(app.appliedDate), "MMM d")}
        </p>
        {isFollowUpToday && (
          <span className="text-[10px] uppercase tracking-widest font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full ring-1 ring-red-500/20">
            Follow-up
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Draggable Wrapper                                                 */
/* ------------------------------------------------------------------ */

function DraggableCard({
  app,
  onClick,
}: {
  app: Application;
  onClick: () => void;
}) {
  const wasDragging = useRef(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: app.id,
  });

  return (
    <div
      ref={setNodeRef}
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
      <KanbanCard app={app} isDragging={isDragging} />
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
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = getColumnConfig(status);
  const Icon = config.icon;

  return (
    <div 
      className={`bg-white/40 dark:bg-black/20 backdrop-blur-xl border rounded-3xl p-4 min-w-[300px] flex-1 flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.02)] transition-colors duration-300 ${
        isOver ? "border-indigo-400 dark:border-indigo-500/50 bg-white/60 dark:bg-white/5" : "border-white/40 dark:border-white/10"
      }`}
    >
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${config.bg} ${config.color} ring-1 ${config.border}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
            {status}
          </span>
        </div>
        <span className="text-xs font-bold bg-white dark:bg-black/40 text-slate-600 dark:text-slate-400 rounded-full h-6 w-6 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm">
          {apps.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex-1 min-h-[150px] rounded-xl transition-colors duration-300 p-1 -m-1">
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
  onSelectApp,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<{
    fromStatus: string;
    toStatus: string;
    appId: string;
  } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const appId = String(active.id);
    const newStatus = String(over.id);

    const app = applications.find((a) => a.id === appId);
    if (app && app.status !== newStatus) {
      if (!isValidTransition(app.status, newStatus)) {
        toast.error(`Cannot move from ${app.status} to ${newStatus}.`);
        return;
      }

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

  const activeApp = activeId ? applications.find((a) => a.id === activeId) : null;

  return (
    <>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {STATUSES.map((status) => (
            <div key={status} className="snap-start shrink-0">
              <DroppableColumn
                status={status}
                apps={applications.filter((a) => a.status === status)}
                onCardClick={(id) => onSelectApp(id)}
              />
            </div>
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeApp ? <KanbanCard app={activeApp} isOverlay /> : null}
        </DragOverlay>
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
