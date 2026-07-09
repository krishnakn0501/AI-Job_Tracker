"""
tailor.py — 5 parallel Qwen nodes, each editing one resume section.
Each node receives full context but edits only its assigned section.
On re-runs, section_feedback is injected into the prompt.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_openai import ChatOpenAI
from state import ResumeState
from prompts import (
    TAILOR_SYSTEM,
    summary_prompt,
    competencies_prompt,
    experience_prompt,
    earlier_roles_prompt,
    preserve_prompt,
)


def _get_qwen() -> ChatOpenAI:
    return ChatOpenAI(
        model=os.getenv("QWEN_MODEL", "qwen-plus"),
        api_key=os.getenv("QWEN_API_KEY"),
        base_url=os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
        temperature=0.3,
    )


def _call_qwen(user_msg: str) -> str:
    llm = _get_qwen()
    from langchain_core.messages import SystemMessage, HumanMessage
    messages = [SystemMessage(content=TAILOR_SYSTEM), HumanMessage(content=user_msg)]
    response = llm.invoke(messages)
    return response.content.strip()


# ── Node functions ─────────────────────────────────────────────────────────────

def tailor_summary_node(state: ResumeState) -> dict:
    feedback = state.get("section_feedback", {}).get("summary", "")
    result = _call_qwen(summary_prompt(
        state["base_resume_md"],
        state["job_description"],
        state["company"],
        state["role"],
        feedback,
    ))
    return {"summary_md": result}


def tailor_competencies_node(state: ResumeState) -> dict:
    feedback = state.get("section_feedback", {}).get("competencies", "")
    result = _call_qwen(competencies_prompt(
        state["base_resume_md"],
        state["job_description"],
        state["company"],
        state["role"],
        feedback,
    ))
    return {"competencies_md": result}


def tailor_experience_node(state: ResumeState) -> dict:
    feedback = state.get("section_feedback", {}).get("experience", "")
    result = _call_qwen(experience_prompt(
        state["base_resume_md"],
        state["job_description"],
        state["company"],
        state["role"],
        feedback,
    ))
    return {"experience_md": result}


def tailor_earlier_roles_node(state: ResumeState) -> dict:
    feedback = state.get("section_feedback", {}).get("earlier_roles", "")
    result = _call_qwen(earlier_roles_prompt(
        state["base_resume_md"],
        state["job_description"],
        state["company"],
        state["role"],
        feedback,
    ))
    return {"earlier_roles_md": result}


def preserve_sections_node(state: ResumeState) -> dict:
    feedback = state.get("section_feedback", {}).get("preserved_sections", "")
    result = _call_qwen(preserve_prompt(
        state["base_resume_md"],
        state["job_description"],
        feedback,
    ))
    return {"preserved_sections_md": result}