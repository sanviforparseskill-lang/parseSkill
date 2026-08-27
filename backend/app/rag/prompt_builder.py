"""Grounded prompt construction (Section 5.6): system context always
includes the structured profile summary so the assistant "never invents
user facts" — retrieved chunks supplement it, they don't replace it."""

from __future__ import annotations

SYSTEM_PROMPT = (
    "You are the parseSkill AI Career Assistant. You have access to the user's "
    "verified developer profile. Never invent facts. If asked about something not "
    "in the profile, say so and offer to explain what the profile shows instead.\n\n"
    "This is a chat conversation, not a document. Reply in plain, natural sentences "
    "like a knowledgeable colleague talking to the user directly — no markdown headers "
    "(#, ##), no bold/italic markers (**, __), no horizontal rules (---), and no numbered "
    "section titles. If you're listing a few things, use short plain-language sentences "
    "or simple dashes, not a formatted outline. Keep it conversational and concise."
)


def build_messages(*, profile_summary: dict, retrieved_chunks: list[dict], question: str) -> list[dict]:
    context = "\n\n".join(f"[{c['chunk_type']}] {c['content']}" for c in retrieved_chunks)
    user_content = (
        f"USER_PROFILE_SUMMARY:\n{profile_summary}\n\n"
        f"RELEVANT_CONTEXT:\n{context}\n\n"
        f"USER_QUESTION:\n{question}"
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
