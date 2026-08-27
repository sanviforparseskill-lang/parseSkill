"""bge-small-en-v1.5 embeddings (Section 6.4): open, free, 384-dim, matches
the `profile_chunks.embedding vector(384)` column."""

from __future__ import annotations

from functools import lru_cache

MODEL_NAME = "BAAI/bge-small-en-v1.5"


@lru_cache
def _model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODEL_NAME)


def embed(texts: list[str]) -> list[list[float]]:
    return _model().encode(texts, normalize_embeddings=True).tolist()


def embed_one(text: str) -> list[float]:
    return embed([text])[0]
