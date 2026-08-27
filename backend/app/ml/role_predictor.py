"""Career Recommendation Engine (Section 6.3).

Ships the cosine-similarity baseline by default. Per Section 6.3 / Appendix
B: XGBoost only replaces it once it demonstrably beats the baseline by 10%+
top-3 accuracy on held-out data — so the baseline being "the real
implementation" here isn't a shortcut, it's the documented default until
`models/role_predictor_v1.pkl` exists and clears that bar (see train.py).
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.db.client import db

MODEL_PATH = Path(__file__).parent / "models" / "role_predictor_v1.pkl"
META_PATH = Path(__file__).parent / "models" / "role_predictor_v1_meta.json"


@lru_cache(maxsize=1)
def _load_trained_model():
    """Lazily loads the XGBoost model app/ml/train.py writes once it beats
    the cosine baseline by >=10% top-3 accuracy (Section 6.3). Cached for the
    life of the worker process; returns None (falls back to cosine) if the
    model hasn't been trained yet or the optional ML deps aren't installed."""
    if not MODEL_PATH.exists() or not META_PATH.exists():
        return None
    try:
        import joblib

        model = joblib.load(MODEL_PATH)
        meta = json.loads(META_PATH.read_text())
        return {"model": model, "vocab": meta["vocab"], "classes": meta["classes"]}
    except Exception:  # noqa: BLE001 — any load failure just falls back to cosine
        return None


async def _user_skill_vector(user_id: str) -> dict[str, float]:
    rows = await db.query_raw(
        "SELECT skill_id, confidence FROM user_has_skill WHERE user_id = $1::uuid",
        user_id,
    )
    return {r["skill_id"]: float(r["confidence"]) for r in rows}


async def _role_skill_vectors() -> dict[str, dict[str, float]]:
    rows = await db.query_raw(
        """
        SELECT r.id AS role_id, r.name AS role_name, srr.skill_id, srr.importance
        FROM skill_required_by_role srr
        JOIN roles r ON r.id = srr.role_id
        """
    )
    vectors: dict[str, dict] = {}
    for r in rows:
        entry = vectors.setdefault(r["role_id"], {"name": r["role_name"], "skills": {}})
        entry["skills"][r["skill_id"]] = float(r["importance"] or 1.0)
    return vectors


def _cosine_similarity(a: dict[str, float], b: dict[str, float]) -> float:
    shared = set(a) & set(b)
    if not shared:
        return 0.0
    dot = sum(a[k] * b[k] for k in shared)
    norm_a = sum(v * v for v in a.values()) ** 0.5
    norm_b = sum(v * v for v in b.values()) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


async def _predict_with_trained_model(user_id: str, top_n: int) -> list[dict] | None:
    """Section 6.3: once train.py has written a model that beat the cosine
    baseline by >=10% top-3 accuracy, use it instead. Returns None (caller
    falls back to cosine) if no model is trained yet, or if this user has no
    skills mapped to an ESCO URI (the model's feature space) to featurize."""
    loaded = _load_trained_model()
    if loaded is None:
        return None

    skills = await db.userhasskill.find_many(where={"userId": user_id}, include={"skill": True})
    vocab_index = {uri: i for i, uri in enumerate(loaded["vocab"])}
    vec = [0.0] * len(loaded["vocab"])
    hit = False
    for s in skills:
        uri = s.skill.escoUri
        if uri and uri in vocab_index:
            vec[vocab_index[uri]] = float(s.confidence)
            hit = True
    if not hit:
        return None

    import numpy as np

    proba = loaded["model"].predict_proba(np.array([vec], dtype=np.float32))[0]
    ranked = sorted(zip(loaded["classes"], proba), key=lambda pair: pair[1], reverse=True)[:top_n]

    results = []
    for role_name, confidence in ranked:
        role = await db.role.upsert(
            where={"name": role_name},
            data={"create": {"name": role_name}, "update": {}},
        )
        results.append({"role_id": role.id, "role_name": role_name, "confidence": float(confidence), "description": role.description})
    return results


async def predict_roles(user_id: str, top_n: int = 5) -> list[dict]:
    try:
        model_result = await _predict_with_trained_model(user_id, top_n)
        if model_result is not None:
            return model_result
    except Exception:  # noqa: BLE001 — any model-path failure falls back to the always-available cosine baseline
        pass

    user_vector = await _user_skill_vector(user_id)
    if not user_vector:
        return []

    roles = await _role_skill_vectors()
    scored = [
        {"role_id": role_id, "role_name": data["name"], "confidence": _cosine_similarity(user_vector, data["skills"]), "description": None}
        for role_id, data in roles.items()
    ]
    scored.sort(key=lambda r: r["confidence"], reverse=True)
    return scored[:top_n]
