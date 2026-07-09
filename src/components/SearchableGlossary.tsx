"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
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
    <div>
      <Input
        placeholder="Search terms…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6"
      />
      {filtered.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">
          No terms match &quot;{query}&quot;
        </p>
      )}
      <div className="space-y-2">
        {filtered.map((t) => (
          <div key={t.term} className="border border-slate-200 rounded-lg bg-white">
            <button
              onClick={() => setOpenTerm(openTerm === t.term ? null : t.term)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              type="button"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {t.category}
                </span>
                <span className="text-sm font-medium text-slate-800">{t.term}</span>
              </div>
              {openTerm === t.term ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {openTerm === t.term && (
              <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {t.definition}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
