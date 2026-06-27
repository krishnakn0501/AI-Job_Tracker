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
import { isValidTransition } from "@/lib/status-rules";
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
      className={`bg-white rounded-md border border-slate-200 p-3 mb-2 cursor-pointer hover:border-slate-300 hover:shadow-sm ${
        isFollowUpToday ? "border-l-2 border-l-red-400" : ""
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
      <p className="text-sm font-medium text-slate-800">{app.company}</p>
      <p className="text-xs text-slate-500 mt-0.5">{app.role}</p>
      <p className="text-xs text-slate-400 mt-2">
        {format(new Date(app.appliedDate), "MMM d")}
      </p>
      {isFollowUpToday && (
        <span className="text-xs text-red-500 mt-1 block">Follow-up today</span>
      )}
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
    <div className="bg-slate-100 rounded-lg p-3 min-w-[200px] flex-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {status}
        </span>
        <span className="text-xs bg-white text-slate-400 rounded-full px-2 py-0.5 border border-slate-200">
          {apps.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex-1 min-h-[60px]">
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
