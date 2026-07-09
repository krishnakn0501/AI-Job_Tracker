"use client";

import { useState } from "react";
import { BookA, MessageCircleQuestion, LifeBuoy, ArrowRight } from "lucide-react";
import { SearchableGlossary } from "@/components/SearchableGlossary";
import { FAQSection } from "@/components/features/help/FAQSection";
import { GLOSSARY_TERMS } from "@/lib/glossary-terms";
import Link from "next/link";

type TabType = "glossary" | "faq";

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<TabType>("faq");

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-900/80 dark:to-purple-900/80 rounded-3xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-indigo-100 text-lg mb-0 leading-relaxed">
            Browse our knowledge base, learn about AI tailoring, or get in touch with our support team.
          </p>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/add"
          className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 hover:bg-white/80 dark:hover:bg-black/50 transition-all group shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Getting Started</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
            Learn how to upload your first resume and let Claude tailor it for your dream job.
          </p>
          <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Add Application <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <div 
          onClick={() => {
            setActiveTab("faq");
            document.getElementById("help-content-area")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 hover:bg-white/80 dark:hover:bg-black/50 transition-all group shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <MessageCircleQuestion className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">FAQs</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
            Find quick answers to common questions about JobTrack&apos;s AI, privacy, and reminders.
          </p>
          <div className="text-amber-600 dark:text-amber-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Read FAQs <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        <Link 
          href="/settings?tab=support"
          className="bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 hover:bg-white/80 dark:hover:bg-black/50 transition-all group shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Contact Support</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
            Can&apos;t find what you need? Send a message directly to our support team.
          </p>
          <div className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Get Support <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row gap-8 pt-4">
        {/* Sidebar Navigation for Help */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
            <button
              onClick={() => setActiveTab("faq")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === "faq"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MessageCircleQuestion
                className={`h-4 w-4 ${
                  activeTab === "faq"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400"
                }`}
              />
              FAQs
            </button>
            <button
              onClick={() => setActiveTab("glossary")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === "glossary"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BookA
                className={`h-4 w-4 ${
                  activeTab === "glossary"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400"
                }`}
              />
              Glossary
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div id="help-content-area" className="flex-1 min-h-[500px]">
          {activeTab === "faq" && <FAQSection />}
          {activeTab === "glossary" && <SearchableGlossary terms={GLOSSARY_TERMS} />}
        </div>
      </div>
    </div>
  );
}
