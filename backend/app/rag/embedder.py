"""Lightweight local embeddings for the free deployment.

The database keeps its 384-dimensional vector contract. A deterministic
hashed token embedding avoids loading PyTorch and a sentence-transformer
model into Render's small free instance.
"""

from __future__ import annotations

import hashlib
import math
import re

EMBEDDING_DIMENSIONS = 384
_TOKEN_PATTERN = re.compile(r"[a-z0-9]+")


def _token_index(token: str) -> int:
    digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
    return int.from_bytes(digest, "big") % EMBEDDING_DIMENSIONS


def _embed_one(text: str) -> list[float]:
    values = [0.0] * EMBEDDING_DIMENSIONS
    for token in _TOKEN_PATTERN.findall(text.lower()):
        values[_token_index(token)] += 1.0

    norm = math.sqrt(sum(value * value for value in values))
    if norm:
        values = [value / norm for value in values]
    return values


def embed(texts: list[str]) -> list[list[float]]:
    return [_embed_one(text) for text in texts]


def embed_one(text: str) -> list[float]:
    return embed([text])[0]
