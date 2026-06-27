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
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
          dragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
        )}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <UploadCloud className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600 mb-1">
          {file ? file.name : "Drag your resume here"}
        </p>
        <p className="text-xs text-slate-400">
          {file ? formatFileSize(file.size) : "or click to browse · PDF or .docx"}
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
          className="w-full mt-3"
          disabled={disabled}
        >
          Upload resume
        </Button>
      )}

      {loading && (
        <div className="flex items-center gap-2 justify-center mt-3 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading to Files API…
        </div>
      )}
    </div>
  );
}
