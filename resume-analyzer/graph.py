"""
graph.py — LangGraph graph definition.

Flow:
  convert_docx
    └─> [tailor_summary, tailor_competencies, tailor_experience,
         tailor_earlier_roles, preserve_sections]  ← parallel
              └─> merge_sections
                    └─> coherence_check
                          ├─ high issues → route_rejected → specific Qwen nodes (parallel) → merge → coherence
                          └─ passed     → hitl_review (interrupt)
                                            ├─ any rejected → route_rejected → ... (max 3 iterations)
                                            └─ all approved → finalize → cover_letter → END
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command, Send

from state import ResumeState
from nodes.convert import convert_node
from nodes.tailor import (
    tailor_summary_node,
    tailor_competencies_node,
    tailor_experience_node,
    tailor_earlier_roles_node,
    preserve_sections_node,
)
from nodes.merge import merge_node
from nodes.coherence import coherence_node
from nodes.cover_letter import cover_letter_node

MAX_ITERATIONS = 3

# Map section names to their Qwen node names in the graph
SECTION_TO_NODE = {
    "summary": "tailor_summary",
    "competencies": "tailor_competencies",
    "experience": "tailor_experience",
    "earlier_roles": "tailor_earlier_roles",
    "preserved_sections": "preserve_sections",
}


# ── HITL node (uses LangGraph interrupt) ──────────────────────────────────────

def hitl_node(state: ResumeState) -> dict:
    """
    Pause execution and surface the coherence-checked resume to the human.
    The Streamlit app calls graph.invoke() with a Command(resume=...) to continue.

    interrupt() pauses the graph here. The value passed to interrupt() is available
    to the Streamlit frontend via the graph's current state snapshot.
    """
    interrupt({
        "merged_resume_md": state.get("merged_resume_md", ""),
        "iteration": state.get("iteration_count", 0),
    })
    # This line is only reached after the graph is resumed with Command(resume=feedback)
    return {}


# ── Routing nodes ─────────────────────────────────────────────────────────────

def route_after_coherence(state: ResumeState):
    """After coherence check: if high issues exist, re-run only affected sections."""
    if state.get("coherence_passed", False):
        return "hitl_node"
    # Fan out to only the nodes that need re-running based on high-severity issues
    rejected = list({
        issue["section"]
        for issue in state.get("coherence_issues", [])
        if issue["section"] in SECTION_TO_NODE
    })
    if not rejected:
        return "hitl_node"
    return [Send(SECTION_TO_NODE[s], state) for s in rejected]


def route_after_hitl(state: ResumeState):
    """
    After HITL review:
    - All sections approved → finalize
    - Any rejected → check iteration count, fan out to rejected Qwen nodes
    """
    rejected = state.get("rejected_sections", [])
    iteration = state.get("iteration_count", 0)

    if not rejected:
        return "finalize"

    if iteration >= MAX_ITERATIONS:
        # Max reached — use best_attempt_md and move on
        return "finalize"

    # Fan out to only rejected section nodes
    return [
        Send(SECTION_TO_NODE[s], state)
        for s in rejected
        if s in SECTION_TO_NODE
    ]


def finalize_node(state: ResumeState) -> dict:
    """
    Set final_resume_md to the approved merged output.
    If called after max iterations, use best_attempt_md.
    """
    rejected = state.get("rejected_sections", [])
    iteration = state.get("iteration_count", 0)

    if rejected and iteration >= MAX_ITERATIONS:
        final = state.get("best_attempt_md", state.get("merged_resume_md", ""))
    else:
        final = state.get("merged_resume_md", "")

    return {
        "final_resume_md": final,
        "rejected_sections": [],
        "section_feedback": {},
    }


def increment_iteration(state: ResumeState) -> dict:
    """Increment the HITL iteration counter before re-running rejected sections."""
    return {"iteration_count": state.get("iteration_count", 0) + 1}


# ── Graph builder ─────────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    builder = StateGraph(ResumeState)

    # Nodes
    builder.add_node("convert_docx", convert_node)
    builder.add_node("tailor_summary", tailor_summary_node)
    builder.add_node("tailor_competencies", tailor_competencies_node)
    builder.add_node("tailor_experience", tailor_experience_node)
    builder.add_node("tailor_earlier_roles", tailor_earlier_roles_node)
    builder.add_node("preserve_sections", preserve_sections_node)
    builder.add_node("merge_sections", merge_node)
    builder.add_node("coherence_check", coherence_node)
    builder.add_node("hitl_node", hitl_node)
    builder.add_node("increment_iteration", increment_iteration)
    builder.add_node("finalize", finalize_node)
    builder.add_node("cover_letter", cover_letter_node)

    # Entry
    builder.set_entry_point("convert_docx")

    # convert_docx → parallel tailor branches (fan-out)
    for node in ["tailor_summary", "tailor_competencies", "tailor_experience",
                 "tailor_earlier_roles", "preserve_sections"]:
        builder.add_edge("convert_docx", node)

    # All tailor branches → merge (fan-in)
    builder.add_edge(
        ["tailor_summary", "tailor_competencies", "tailor_experience",
         "tailor_earlier_roles", "preserve_sections"],
        "merge_sections",
    )

    # merge → coherence
    builder.add_edge("merge_sections", "coherence_check")

    # coherence → either hitl or re-run rejected sections
    builder.add_conditional_edges(
        "coherence_check",
        route_after_coherence,
        {
            "hitl_node": "hitl_node",
            # Send() paths are handled dynamically — no static mapping needed here
        },
    )

    # hitl → either finalize or increment + re-run rejected sections
    builder.add_conditional_edges(
        "hitl_node",
        route_after_hitl,
        {
            "finalize": "finalize",
            # Send() paths for rejected sections handled dynamically
        },
    )

    # After re-running a rejected section, go back through merge → coherence
    # (the increment_iteration node is inserted before re-run via the routing above)
    builder.add_edge("increment_iteration", "merge_sections")

    # finalize → cover letter → END
    builder.add_edge("finalize", "cover_letter")
    builder.add_edge("cover_letter", END)

    return builder


def compile_graph():
    """Compile the graph with in-memory checkpointing for HITL resume support."""
    builder = build_graph()
    memory = MemorySaver()
    return builder.compile(
        checkpointer=memory,
        interrupt_before=["hitl_node"],
    )