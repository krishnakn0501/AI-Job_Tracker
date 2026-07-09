"""
cover_letter.py — generates cover letter after tailoring is fully approved.
Uses the approved tailored resume as source of facts. Never invents metrics.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from state import ResumeState
from prompts import COVER_LETTER_SYSTEM, cover_letter_prompt


def cover_letter_node(state: ResumeState) -> dict:
    llm = ChatOpenAI(
        model=os.getenv("QWEN_MODEL", "qwen-plus"),
        api_key=os.getenv("QWEN_API_KEY"),
        base_url=os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
        temperature=0.4,
    )

    # Use the coherence-checked, HITL-approved resume as the factual source
    final_md = state.get("final_resume_md") or state.get("best_attempt_md", "")

    messages = [
        SystemMessage(content=COVER_LETTER_SYSTEM),
        HumanMessage(content=cover_letter_prompt(
            final_md,
            state["job_description"],
            state["company"],
            state["role"],
        )),
    ]

    response = llm.invoke(messages)
    return {"cover_letter_md": response.content.strip()}