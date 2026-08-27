from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sse_starlette.sse import EventSourceResponse

from app.api.deps import get_current_user
from app.db import pubsub, queue
from app.db.client import db
from app.schemas.chat import ChatMessageEnqueued, ChatMessageIn, ChatMessageOut
from app.services import rate_limit

router = APIRouter(prefix="/chat", tags=["chat"])

_RATE_LIMIT_PER_HOUR = 30  # Section 5.6 / 16 App B


@router.post("/message", response_model=ChatMessageEnqueued)
async def post_message(body: ChatMessageIn, user=Depends(get_current_user)):
    allowed = await rate_limit.check_and_increment(user.id, "chat_message", limit=_RATE_LIMIT_PER_HOUR, window_minutes=60)
    if not allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded: 30 messages/hour")

    user_msg = await db.chatmessage.create(data={"userId": user.id, "role": "user", "content": body.content})
    await queue.enqueue("assistant_reply", {"user_id": user.id, "message_id": user_msg.id, "question": body.content})
    return ChatMessageEnqueued(message_id=user_msg.id)


@router.get("/stream/{message_id}")
async def stream_reply(message_id: str, request: Request, user=Depends(get_current_user)):
    """Tokens are pushed via `user_chat:{user_id}` NOTIFY as the worker's RAG
    pipeline (Section 6.4) streams the LLM response (Section 9 Flow 3)."""

    async def event_generator():
        async for payload in pubsub.subscribe(pubsub.chat_channel(user.id)):
            if await request.is_disconnected():
                break
            if payload.get("message_id") != message_id:
                continue
            yield {"event": "token", "data": json.dumps(payload)}
            if payload.get("done"):
                break

    return EventSourceResponse(event_generator())


@router.get("/history", response_model=list[ChatMessageOut])
async def history(user=Depends(get_current_user)):
    rows = await db.chatmessage.find_many(where={"userId": user.id}, order={"createdAt": "asc"}, take=200)
    return [
        ChatMessageOut(id=r.id, role=r.role, content=r.content, citations=r.citations, created_at=r.createdAt)
        for r in rows
    ]


@router.delete("/history")
async def clear_history(user=Depends(get_current_user)):
    await db.chatmessage.delete_many(where={"userId": user.id})
    return {"ok": True}
