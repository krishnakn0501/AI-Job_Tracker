"""
coherence.py — Gemini-powered coherence check and auto-fix node.

Low severity  → Gemini auto-fixes inline (syntax issues)
High severity → routes back to specific Qwen nodes (quality issues)
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from nodes.convert import normalize_markdown
from state import ResumeState, CoherenceIssue
from prompts import COHERENCE_SYSTEM, coherence_prompt, autofix_prompt


def _get_gemini() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemini-1.5-pro"),
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.1,
    )


def _parse_issues(raw: str) -> list[CoherenceIssue]:
    """Parse Gemini's JSON response into a list of CoherenceIssue dicts."""
    clean = raw.strip()
    # Strip markdown fences if Gemini added them despite instructions
    clean = clean.replace("```json", "").replace("```", "").strip()
    try:
        items = json.loads(clean)
        return [
            CoherenceIssue(
                section=i.get("section", "unknown"),
                type=i.get("type", "syntax"),
                severity=i.get("severity", "low"),
                suggestion=i.get("suggestion", ""),
            )
            for i in items
            if isinstance(i, dict)
        ]
    except json.JSONDecodeError:
        # If Gemini returns unparseable output, treat as no issues found
        return []


def _auto_fix(merged_md: str, low_issues: list[CoherenceIssue],
              gemini: ChatGoogleGenerativeAI) -> str:
    """Ask Gemini to fix only the low-severity syntax issues in-place."""
    if not low_issues:
        return merged_md
    messages = [
        HumanMessage(content=autofix_prompt(merged_md, low_issues))
    ]
    response = gemini.invoke(messages)
    fixed = response.content.strip()
    # Always normalize after any fix
    return normalize_markdown(fixed)


def coherence_node(state: ResumeState) -> dict:
    """
    LangGraph node: audit merged_resume_md, auto-fix low issues, flag high issues.

    Returns:
      coherence_issues   — high-severity issues only (low ones are already fixed)
      coherence_passed   — True if no high-severity issues remain
      auto_fixed_md      — merged markdown after low-severity auto-fixes
      best_attempt_md    — updated if coherence passed
    """
    gemini = _get_gemini()
    merged_md = state.get("merged_resume_md", "")

    # Run coherence audit
    audit_messages = [
        SystemMessage(content=COHERENCE_SYSTEM),
        HumanMessage(content=coherence_prompt(
            merged_md,
            state["job_description"],
            state["company"],
            state["role"],
        )),
    ]
    raw = gemini.invoke(audit_messages).content
    all_issues = _parse_issues(raw)

    low_issues = [i for i in all_issues if i["severity"] == "low"]
    high_issues = [i for i in all_issues if i["severity"] == "high"]

    # Auto-fix low-severity issues
    fixed_md = _auto_fix(merged_md, low_issues, gemini)

    coherence_passed = len(high_issues) == 0

    result = {
        "coherence_issues": high_issues,
        "coherence_passed": coherence_passed,
        "auto_fixed_md": fixed_md,
        "merged_resume_md": fixed_md,   # downstream always reads merged_resume_md
    }

    # Update best attempt whenever coherence passes
    if coherence_passed:
        result["best_attempt_md"] = fixed_md

    return result