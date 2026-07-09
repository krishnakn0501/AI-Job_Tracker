"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, MessageCircleQuestion } from "lucide-react";

type FAQ = {
  question: string;
  answer: string;
};

const FAQS: FAQ[] = [
  {
    question: "How does the AI tailor my resume?",
    answer:
      "JobTrack uses Claude 3.5 Sonnet to analyze your base resume alongside the provided job description. It identifies the key requirements (ATS keywords, skills, and experiences) and subtly rewrites bullet points in your resume to highlight your most relevant experience without fabricating any information.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Yes. Your base resumes and generated documents are stored securely. We only send your resume content and the job description to Anthropic's API for the duration of the tailoring process. We do not use your data to train our own models.",
  },
  {
    question: "How do the follow-up reminders work?",
    answer:
      "When you set a 'Follow-up date' on an application, JobTrack can send you email reminders so you don't forget. You can configure when these reminders start (e.g., 2 days before) and whether they repeat daily in your Settings > Preferences tab.",
  },
  {
    question: "Can I use multiple base resumes?",
    answer:
      "Absolutely! If you apply to different types of roles (e.g., Frontend Developer vs. Product Manager), you can upload multiple base resumes in the 'My Resumes' section. When adding a new application, you can select which base resume Claude should use for tailoring.",
  },
  {
    question: "Why did the AI change my job title?",
    answer:
      "Sometimes, job descriptions use specific industry terminology (like 'Talent Acquisition Specialist' instead of 'Technical Recruiter'). If the AI determines that your experience perfectly matches the requested title, it may adjust it to help you pass automated ATS filters. You will always see a 'Role title changed' flag when this happens so you can review it.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center gap-3 bg-white/60 dark:bg-black/30 p-4 rounded-2xl border border-white/40 dark:border-white/10 backdrop-blur-xl">
        <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
          <MessageCircleQuestion className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Frequently Asked Questions
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quick answers to common questions about JobTrack.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                isOpen
                  ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-500/30 shadow-md ring-1 ring-indigo-100 dark:ring-indigo-900/50"
                  : "bg-white/60 dark:bg-black/30 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white/80 dark:hover:bg-black/50"
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                type="button"
              >
                <span
                  className={`text-base font-medium pr-4 ${
                    isOpen
                      ? "text-indigo-900 dark:text-indigo-100"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {faq.question}
                </span>
                <div
                  className={`p-1 rounded-full shrink-0 transition-colors ${
                    isOpen
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                >
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>
              
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pt-1 text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-white/5 mt-2">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
