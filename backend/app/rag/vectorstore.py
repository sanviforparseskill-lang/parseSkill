"""pgvector wrapper over `profile_chunks` (Section 6.4). Raw SQL because
Prisma has no vector/tsvector type support — the column is declared
`Unsupported("vector(384)")` in schema.prisma precisely so migrations still
manage it while queries go around Prisma's query builder.
"""

from __future__ import annotations

from app.db.client import db
from app.rag.embedder import embed_one


async def upsert_chunk(user_id: str, *, chunk_type: str, reference_id: str, content: str) -> None:
    vector = embed_one(content)
    vector_literal = "[" + ",".join(str(v) for v in vector) + "]"
    await db.execute_raw(
        """
        INSERT INTO profile_chunks (user_id, chunk_type, reference_id, content, content_tsv, embedding)
        VALUES ($1::uuid, $2, $3, $4, to_tsvector('english', $4), $5::vector)
        """,
        user_id,
        chunk_type,
        reference_id,
        content,
        vector_literal,
    )


async def replace_user_chunks(user_id: str, chunks: list[dict]) -> None:
    """Called at the end of every sync (Section 9 Flow 1 step 10): drop and
    rebuild this user's RAG index from the freshly computed profile."""
    await db.execute_raw("DELETE FROM profile_chunks WHERE user_id = $1::uuid", user_id)
    for chunk in chunks:
        await upsert_chunk(user_id, chunk_type=chunk["chunk_type"], reference_id=chunk["reference_id"], content=chunk["content"])


async def vector_search(user_id: str, query_embedding: list[float], limit: int = 8) -> list[dict]:
    vector_literal = "[" + ",".join(str(v) for v in query_embedding) + "]"
    return await db.query_raw(
        """
        SELECT id, chunk_type, reference_id, content,
               1 - (embedding <=> $2::vector) AS cosine_similarity
        FROM profile_chunks
        WHERE user_id = $1::uuid
        ORDER BY embedding <=> $2::vector
        LIMIT $3
        """,
        user_id,
        vector_literal,
        limit,
    )


async def bm25_search(user_id: str, query_text: str, limit: int = 8) -> list[dict]:
    return await db.query_raw(
        """
        SELECT id, chunk_type, reference_id, content,
               ts_rank(content_tsv, plainto_tsquery('english', $2)) AS bm25_rank
        FROM profile_chunks
        WHERE user_id = $1::uuid AND content_tsv @@ plainto_tsquery('english', $2)
        ORDER BY bm25_rank DESC
        LIMIT $3
        """,
        user_id,
        query_text,
        limit,
    )
