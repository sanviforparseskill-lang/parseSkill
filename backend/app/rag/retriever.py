"""Hybrid retrieval: BM25 (Postgres tsvector) + vector cosine, merged by
reciprocal rank fusion (Section 6.4)."""

from __future__ import annotations

from app.rag.embedder import embed_one
from app.rag.vectorstore import bm25_search, vector_search


async def retrieve(user_id: str, query: str, top_k: int = 8) -> list[dict]:
    query_embedding = embed_one(query)
    vector_hits = await vector_search(user_id, query_embedding, limit=top_k * 2)
    bm25_hits = await bm25_search(user_id, query, limit=top_k * 2)

    scores: dict[str, float] = {}
    chunks: dict[str, dict] = {}
    for rank, hit in enumerate(vector_hits):
        scores[hit["id"]] = scores.get(hit["id"], 0.0) + 1.0 / (60 + rank)
        chunks[hit["id"]] = hit
    for rank, hit in enumerate(bm25_hits):
        scores[hit["id"]] = scores.get(hit["id"], 0.0) + 1.0 / (60 + rank)
        chunks[hit["id"]] = hit

    ranked_ids = sorted(scores, key=scores.get, reverse=True)[:top_k]
    return [chunks[i] for i in ranked_ids]
