"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import DashboardShell from "@/components/DashboardShell";
import FileDropzone from "@/components/FileDropzone";
import ResumeCard from "@/components/ResumeCard";

type Resume = {
  id: string;
  label: string;
  filename: string;
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

  /* ---- Top bar content ---- */
  const topBarContent = (
    <h1 className="text-base font-semibold text-slate-800">My Resumes</h1>
  );

  return (
    <DashboardShell topBarContent={topBarContent} hideReminderPanel>
      <div className="max-w-2xl mx-auto">
        {/* Upload section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Upload a new resume
          </h2>
          <Input
            placeholder="Give this resume a name, e.g. Frontend Resume"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mb-3"
          />
          <FileDropzone
            onSuccess={handleUploadSuccess}
            extraFormData={{ label }}
            disabled={!label.trim()}
          />
        </div>

        {/* Resume list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="h-10 w-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm">
              No resumes uploaded yet. Upload one above to get started.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Your resumes
            </h2>
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} onUpdate={fetchResumes} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
