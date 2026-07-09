"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { GlossaryTerm } from "@/lib/glossary-terms";

export function SearchableGlossary({ terms }: { terms: GlossaryTerm[] }) {
  const [query, setQuery] = useState("");
  const [openTerm, setOpenTerm] = useState<string | null>(null);

  const filtered = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(query.toLowerCase()) ||
      t.definition.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="relative mb-8">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
        <Input
          placeholder="Search glossary terms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-11 bg-white/60 dark:bg-black/30 border-white/40 dark:border-white/10 backdrop-blur-xl text-base rounded-2xl shadow-sm focus-visible:ring-indigo-500"
        />
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/40 dark:bg-black/20 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
          <p className="text-base font-medium text-slate-600 dark:text-slate-400 text-center">
            No terms match &quot;<span className="text-indigo-600 dark:text-indigo-400">{query}</span>&quot;
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            Try adjusting your search query.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((t) => {
          const isOpen = openTerm === t.term;
          return (
            <div
              key={t.term}
              className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                isOpen
                  ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-500/30 shadow-md ring-1 ring-indigo-100 dark:ring-indigo-900/50"
                  : "bg-white/60 dark:bg-black/30 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white/80 dark:hover:bg-black/50"
              }`}
            >
              <button
                onClick={() => setOpenTerm(isOpen ? null : t.term)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                type="button"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg tracking-wide ${
                      isOpen
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                        : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
                    }`}
                  >
                    {t.category}
                  </span>
                  <span
                    className={`text-base font-medium ${
                      isOpen
                        ? "text-indigo-900 dark:text-indigo-100"
                        : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {t.term}
                  </span>
                </div>
                <div
                  className={`p-1 rounded-full transition-colors ${
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
                    {t.definition}
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
