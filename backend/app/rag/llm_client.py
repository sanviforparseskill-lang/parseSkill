"""LLM call wrapper (Section 5.6 / 6.4): switches on LLM_PROVIDER so the
rest of the codebase (chat streaming, resume structured extraction, README
concept extraction) doesn't care which vendor is configured. Uses Google
Gemini (Section 5.6 / 6.4)."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

from app.core.config import get_settings


async def stream_completion(messages: list[dict], max_output_tokens: int = 1024) -> AsyncIterator[str]:
    settings = get_settings()
    if settings.llm_provider == "gemini":
        async for token in _stream_gemini(messages, max_output_tokens):
            yield token
    else:
        raise ValueError(f"Unknown LLM_PROVIDER: {settings.llm_provider}")


async def _stream_gemini(messages: list[dict], max_output_tokens: int) -> AsyncIterator[str]:
    from google import genai
    from google.genai import types

    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)

    system = next((m["content"] for m in messages if m["role"] == "system"), None)
    contents = [
        types.Content(role="model" if m["role"] == "assistant" else "user", parts=[types.Part(text=m["content"])])
        for m in messages
        if m["role"] != "system"
    ]

    stream = await client.aio.models.generate_content_stream(
        model=settings.gemini_model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_output_tokens,
        ),
    )
    async for chunk in stream:
        if chunk.text:
            yield chunk.text


async def complete_structured(prompt: str) -> dict:
    """Non-streaming call for structured JSON extraction (resume parsing,
    project README concept extraction)."""
    full_text = ""
    async for token in stream_completion([{"role": "user", "content": prompt}], max_output_tokens=8192):
        full_text += token
    try:
        return json.loads(_strip_json_fence(full_text))
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM did not return valid JSON: {full_text[:200]!r}") from exc


def _strip_json_fence(text: str) -> str:
    """Gemini routinely wraps structured JSON output in a ```json ... ```
    markdown fence even when the prompt asks for JSON alone; strip it
    before parsing rather than treating well-formed-but-fenced output as
    a parse failure."""
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.split("\n", 1)[1] if "\n" in stripped else stripped[3:]
        if stripped.endswith("```"):
            stripped = stripped[: -3]
        stripped = stripped.strip()
    return stripped
