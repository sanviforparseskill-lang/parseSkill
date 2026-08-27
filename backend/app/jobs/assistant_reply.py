"""The `assistant_reply` job (Section 9 Flow 3): embeds the question,
retrieves grounded context, streams the LLM response token-by-token over
`user_chat:{user_id}` NOTIFY, and persists the final assistant message with
citations.
"""

from __future__ import annotations

from app.db import pubsub
from app.db.client import db
from app.rag.guardrails import check_numeric_claims
from app.rag.llm_client import stream_completion
from app.rag.prompt_builder import build_messages
from app.rag.retriever import retrieve
from prisma import Json


async def run(payload: dict) -> None:
    user_id = payload["user_id"]
    message_id = payload["message_id"]
    question = payload["question"]
    channel = pubsub.chat_channel(user_id)

    profile_summary = await _load_profile_summary(user_id)
    chunks = await retrieve(user_id, question)
    messages = build_messages(profile_summary=profile_summary, retrieved_chunks=chunks, question=question)

    full_reply = ""
    async for token in stream_completion(messages):
        full_reply += token
        await pubsub.notify(channel, {"message_id": message_id, "token": token, "done": False})

    citations = [{"chunk_type": c["chunk_type"], "reference_id": c["reference_id"]} for c in chunks]
    suspicious = check_numeric_claims(full_reply, profile_summary)
    if suspicious:
        citations.append({"warning": "unverified_numeric_claims", "values": suspicious})
        await db.evallog.create(
            data={
                "userId": user_id,
                "messageId": message_id,
                "kind": "hallucination_flag",
                "payload": Json({"question": question, "reply": full_reply, "suspicious_values": suspicious}),
            }
        )

    await db.chatmessage.create(data={"userId": user_id, "role": "assistant", "content": full_reply, "citations": Json(citations)})
    await pubsub.notify(channel, {"message_id": message_id, "token": "", "done": True, "citations": citations})


async def _load_profile_summary(user_id: str) -> dict:
    user = await db.user.find_unique(where={"id": user_id})
    top_skills = await db.userhasskill.find_many(
        where={"userId": user_id}, include={"skill": True}, order={"confidence": "desc"}, take=10
    )
    return {
        "display_name": user.displayName,
        "coding_score": float(user.codingScore) if user.codingScore else None,
        "project_quality_score": float(user.projectQualityScore) if user.projectQualityScore else None,
        "consistency_score": float(user.consistencyScore) if user.consistencyScore else None,
        "learning_velocity": float(user.learningVelocity) if user.learningVelocity else None,
        "top_skills": [{"name": s.skill.name, "confidence": float(s.confidence)} for s in top_skills],
    }
