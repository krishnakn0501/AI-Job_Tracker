"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ChevronLeft, Loader2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/utils/cn";

function defaultFollowUpDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

type ResumeOption = {
  id: string;
  label: string;
  isBase: boolean;
  fileId: string;
};

export default function AddJobForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Field state
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [followUpDate, setFollowUpDate] = useState(defaultFollowUpDate());
  const [notes, setNotes] = useState("");

  // Date validation state
  const [followUpDateConfirmed, setFollowUpDateConfirmed] = useState(false);
  const [followUpDateWarning, setFollowUpDateWarning] = useState(false);

  // Validation state
  const [touched, setTouched] = useState({
    company: false,
    role: false,
    jdText: false,
  });

  // S9 — Resume selector state
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");

  // Fetch resumes on mount
  useEffect(() => {
    fetch("/api/resumes")
      .then((res) => res.json())
      .then((data: ResumeOption[]) => {
        setResumes(data);
        const base = data.find((r: ResumeOption) => r.isBase);
        if (base) setSelectedResumeId(base.id);
      })
      .catch(() => {
        // Silently fail — form still works, just no resume selector
      });
  }, []);

  // Check if follow-up date is in the past
  const checkFollowUpDate = (dateStr: string) => {
    if (!dateStr) {
      setFollowUpDateWarning(false);
      setFollowUpDateConfirmed(false);
      return;
    }

    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setFollowUpDateWarning(true);
    } else {
      setFollowUpDateWarning(false);
      setFollowUpDateConfirmed(false);
    }
  };

  // Handle follow-up date change
  const handleFollowUpDateChange = (dateStr: string) => {
    setFollowUpDate(dateStr);
    checkFollowUpDate(dateStr);
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showError = (field: "company" | "role" | "jdText") => {
    return touched[field] && !{ company, role, jdText }[field].trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if we need to confirm past dates
    if (followUpDateWarning && !followUpDateConfirmed) {
      toast.error("Please confirm the past follow-up date or select a future date.");
      return;
    }

    if (!company.trim() || !role.trim() || !jdText.trim()) {
      toast.error("Company, role, and job description are required.");
      return;
    }

    if (!selectedResumeId) {
      toast.error("Please select a resume.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          jdText,
          jdUrl,
          followUpDate,
          notes,
          resumeBaseId: selectedResumeId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create application");
      }
      toast.success("Added! Resume generating — ready in ~30 seconds.");
      router.push("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const noResumes = resumes.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* S9 — Resume selector */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
          Resume to use
        </label>
        {noResumes ? (
          <p className="text-sm text-amber-600">
            No resumes uploaded yet.{" "}
            <Link href="/my-resumes" className="underline">
              Upload one first
            </Link>
            .
          </p>
        ) : (
          <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {resumes.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label} {r.isBase && "(base)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Row 1: Company + Role */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Company *
          </label>
          <Input
            placeholder="e.g. Google"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onBlur={() => handleBlur("company")}
            required
            className={cn(showError("company") && "border-red-400")}
          />
          {showError("company") && (
            <p className="text-xs text-red-500 mt-1">Company is required</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Role *
          </label>
          <Input
            placeholder="e.g. Software Engineer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onBlur={() => handleBlur("role")}
            required
            className={cn(showError("role") && "border-red-400")}
          />
          {showError("role") && (
            <p className="text-xs text-red-500 mt-1">Role is required</p>
          )}
        </div>
      </div>

      {/* Job description */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
          Job description *
        </label>
        <Textarea
          placeholder="Paste the full job description here…"
          className={cn(
            "min-h-[220px] font-mono text-xs resize-y",
            showError("jdText") && "border-red-400"
          )}
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          onBlur={() => handleBlur("jdText")}
          required
        />
        <p className="text-xs text-slate-400 mt-1">
          The more complete the JD, the better Claude can tailor your resume.
        </p>
        {showError("jdText") && (
          <p className="text-xs text-red-500 mt-1">Job description is required</p>
        )}
      </div>

      {/* Job URL */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
          Job posting URL <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <Input
          type="url"
          placeholder="https://careers.company.com/..."
          value={jdUrl}
          onChange={(e) => setJdUrl(e.target.value)}
        />
      </div>

      {/* Row 2: Follow-up date + Notes */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Follow-up reminder <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <Input
            type="date"
            value={followUpDate}
            onChange={(e) => handleFollowUpDateChange(e.target.value)}
          />
          {followUpDateWarning && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-700">
                    This date is in the past — are you sure?
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-amber-700 hover:text-amber-900 text-xs mt-1"
                    onClick={() => setFollowUpDateConfirmed(true)}
                  >
                    Yes, confirm
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Private notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <Textarea
            placeholder="Referral from…, recruiter name…"
            className="min-h-[80px] resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-12 text-sm font-medium"
        disabled={loading || noResumes || !selectedResumeId}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          "Generate tailored resume →"
        )}
      </Button>
    </form>
  );
}
