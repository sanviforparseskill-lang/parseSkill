from datetime import datetime

from pydantic import BaseModel


class ChatMessageIn(BaseModel):
    content: str


class ChatMessageOut(BaseModel):
    id: str
    role: str  # user | assistant
    content: str
    citations: list[dict] | None
    created_at: datetime


class ChatMessageEnqueued(BaseModel):
    message_id: str


class ChatToken(BaseModel):
    token: str
    done: bool = False
    citations: list[dict] | None = None
