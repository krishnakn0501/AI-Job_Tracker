"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import FileDropzone from "@/components/features/resume/FileDropzone";
import ResumeCard from "@/components/features/resume/ResumeCard";

type Resume = {
  id: string;
  label: string;
  filename: string;
  fileId: string;
  isBase: boolean;
  createdAt: string;
  applications: Array<{ id: string; company: string; role: string; status: string }>;
};

export default function MyResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");

  useEffect(() => {
    document.title = "JobTrack — My Resumes";
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resumes");
      if (res.ok) {
        const data = await res.json();
        setResumes(data);
      }
    } catch (err) {
      console.error("[MyResumes] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleUploadSuccess = (result: { success: boolean; id: string; fileId: string; filename: string; label: string }) => {
    setLabel("");
    fetchResumes();
    toast.success(`Resume uploaded: ${result.label}`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-8 mb-8 shadow-sm group transform-gpu">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-700"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
              <FileText className="h-3.5 w-3.5" />
              Document Library
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              My Resumes
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl text-sm md:text-base font-medium">
              Manage your base resumes here. Upload your standard PDF or Word docs, and we'll use them as the foundation to generate perfectly tailored resumes for every application.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Upload section */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 shrink-0">
          <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-sm transform-gpu sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Upload New
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
                  Resume Name
                </label>
                <Input
                  placeholder="e.g. Frontend Engineer v2"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="h-11 rounded-xl bg-white/50 dark:bg-black/40 backdrop-blur-sm border-slate-200 dark:border-white/10 shadow-sm transition-all focus:bg-white dark:focus:bg-black/60 font-medium"
                />
              </div>
              <FileDropzone
                onSuccess={handleUploadSuccess}
                extraFormData={{ label }}
              />
            </div>
          </div>
        </div>

        {/* Resume list */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-sm transform-gpu min-h-[400px]">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
              Your Library
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">
                  No resumes uploaded yet
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Upload your first resume using the form to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {resumes.map((resume) => (
                  <ResumeCard key={resume.id} resume={resume} onUpdate={fetchResumes} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
