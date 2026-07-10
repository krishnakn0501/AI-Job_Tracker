"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";

type Props = {
  onSuccess: (result: { success: boolean; id: string; fileId: string; filename: string; label: string }) => void;
  extraFormData?: Record<string, string>;
  disabled?: boolean;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropzone({ onSuccess, extraFormData = {}, disabled = false }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      for (const [key, value] of Object.entries(extraFormData)) {
        formData.append(key, value);
      }
      const res = await fetch("/api/upload-resume", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Upload failed");
      }
      const result = await res.json();
      toast.success(`Resume uploaded: ${result.label}`);
      setFile(null);
      onSuccess(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 transform-gpu",
          dragOver ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10 scale-[1.02]" : "border-slate-300 dark:border-white/20 hover:border-indigo-400 dark:hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-white/5",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <div className="h-12 w-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <UploadCloud className="h-6 w-6 text-indigo-500" />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 truncate px-4">
          {file ? file.name : "Drag your resume here"}
        </p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {file ? formatFileSize(file.size) : "or click to browse (PDF or .docx)"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {file && !loading && (
        <Button
          onClick={handleUpload}
          className="w-full mt-4 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          disabled={disabled}
        >
          <span className="truncate px-2">Upload {file.name}</span>
        </Button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 mt-4 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-sm font-bold text-indigo-600 dark:text-indigo-400 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Uploading to Storage…
        </div>
      )}
    </div>
  );
}
