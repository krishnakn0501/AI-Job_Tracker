"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

type Props = {
  open: boolean;
  fromStatus: string;
  toStatus: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const getTheme = (status: string) => {
  switch (status) {
    case "Applied": return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", ring: "focus-visible:ring-blue-500" };
    case "Screening": return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", ring: "focus-visible:ring-amber-500" };
    case "Interview": return { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", ring: "focus-visible:ring-purple-500" };
    case "Offer": return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", ring: "focus-visible:ring-emerald-500" };
    case "Rejected": return { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20", ring: "focus-visible:ring-red-500" };
    default: return { color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-500/10", border: "border-slate-200 dark:border-slate-500/20", ring: "focus-visible:ring-slate-500" };
  }
};

export function StatusChangeDialog({ open, fromStatus, toStatus, onConfirm, onCancel }: Props) {
  const [typedText, setTypedText] = useState("");
  const isConfirmed = typedText === toStatus;

  useEffect(() => {
    if (open) setTypedText("");
  }, [open]);

  const theme = getTheme(toStatus);
  const fromTheme = getTheme(fromStatus);

  const showsWarning = ["Offer", "Rejected"].includes(toStatus);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0 shadow-2xl rounded-3xl dark:bg-[#1a1a1a] gap-0">
        <div className={`h-2 w-full ${theme.bg}`}></div>
        
        <div className="px-8 pt-8 pb-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Confirm Status Move
            </DialogTitle>
            
            <div className="flex items-center gap-4 py-5">
              <div className={`px-4 py-2 rounded-xl text-sm font-bold tracking-widest uppercase ${fromTheme.bg} ${fromTheme.color} border ${fromTheme.border}`}>
                {fromStatus}
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600" />
              <div className={`px-4 py-2 rounded-xl text-sm font-bold tracking-widest uppercase ${theme.bg} ${theme.color} border ${theme.border} shadow-sm transform scale-105`}>
                {toStatus}
              </div>
            </div>

            <DialogDescription className="text-base text-slate-500 dark:text-slate-400">
              Please type <span className="font-bold text-slate-800 dark:text-slate-200 select-all px-1 py-0.5 bg-slate-100 dark:bg-white/10 rounded">{toStatus}</span> to verify this action.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 pb-8 space-y-5">
          {showsWarning && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-200/50 dark:border-amber-500/20">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">
                This will automatically clear any pending follow-up or interview reminders for this application.
              </p>
            </div>
          )}

          <div className="relative group">
            <Input
              placeholder={`Type "${toStatus}"`}
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              className={`pl-5 py-6 text-lg font-medium rounded-2xl transition-all duration-300 bg-slate-50/50 dark:bg-black/20 ${
                isConfirmed 
                  ? `border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5` 
                  : `border-slate-200 dark:border-white/10 ${theme.ring} group-hover:border-slate-300 dark:group-hover:border-white/20`
              }`}
              autoFocus
            />
            {isConfirmed && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 h-8 w-8 rounded-full animate-in zoom-in duration-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-8 py-5 bg-slate-50/80 dark:bg-black/40 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3 sm:justify-end">
          <Button variant="ghost" onClick={onCancel} className="rounded-xl px-6 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5 font-semibold">
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={!isConfirmed}
            className={`rounded-xl px-8 font-bold transition-all duration-500 relative overflow-hidden ${
              isConfirmed 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_-3px_rgba(5,150,105,0.4)] hover:shadow-[0_0_25px_-3px_rgba(5,150,105,0.6)] scale-105' 
                : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="relative z-10">Confirm Move</span>
            {isConfirmed && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}