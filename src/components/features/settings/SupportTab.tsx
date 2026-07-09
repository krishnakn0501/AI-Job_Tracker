"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { HelpCircle, Clock, CheckCircle2 } from "lucide-react";

export default function SupportTab() {
  const [supportForm, setSupportForm] = useState({
    category: "Bug Report",
    message: "",
  });
  const [supportQueries, setSupportQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueries = async () => {
    try {
      const res = await fetch("/api/support-queries");
      if (res.ok) {
        const data = await res.json();
        setSupportQueries(data);
      }
    } catch (error) {
      console.error("Failed to fetch support queries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleSubmitSupport = async () => {
    if (!supportForm.category || !supportForm.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/support-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportForm),
      });

      if (res.ok) {
        toast.success("Support query submitted successfully");
        setSupportForm({ category: "Bug Report", message: "" });
        fetchQueries();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to submit support query");
      }
    } catch (error) {
      toast.error("Failed to submit support query");
    }
  };

  return (
    <div className="space-y-10">
      {/* Submit Query */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-1">
            Submit a Request
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Encountered a bug or have a feature request? Let us know!
          </p>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2 max-w-sm">
            <Label
              htmlFor="support-category"
              className="text-slate-700 dark:text-slate-300"
            >
              Category
            </Label>
            <Select
              value={supportForm.category}
              onValueChange={(value) =>
                setSupportForm({ ...supportForm, category: value })
              }
            >
              <SelectTrigger className="w-full bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bug Report">Bug Report</SelectItem>
                <SelectItem value="Feature Request">Feature Request</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="support-message"
              className="text-slate-700 dark:text-slate-300"
            >
              Message
            </Label>
            <Textarea
              id="support-message"
              value={supportForm.message}
              onChange={(e) =>
                setSupportForm({ ...supportForm, message: e.target.value })
              }
              placeholder="Describe your issue or suggestion in detail..."
              className="h-32 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10 resize-none"
            />
          </div>

          <Button
            onClick={handleSubmitSupport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all mt-2"
          >
            Submit Request
          </Button>
        </div>
      </section>

      {/* Past Queries */}
      <section className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/10">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-1">
            Your Past Requests
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track the status of your previously submitted requests.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          </div>
        ) : supportQueries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 bg-slate-50/50 dark:bg-black/10 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
            <HelpCircle className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              No requests submitted yet
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {supportQueries.map((query) => (
              <div
                key={query.id}
                className="bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-5 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {query.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${
                        query.status === "open"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                      }`}
                    >
                      {query.status === "open" ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {query.status}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {format(new Date(query.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {query.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
