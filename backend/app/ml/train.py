"""Offline training pipeline (Section 6.3). Run manually / on a schedule
(every 6 months per Section 15.2), not from the request path:

    python -m app.ml.train

Reads the already-cleaned reference datasets from ../ml_pipeline/clean/
(esco_tech_skills, linkedin_jobs_clean — produced by
ml_pipeline/scripts/run_all.py), builds a multi-hot skill-vector per job
posting restricted to the curated tech-skill vocabulary (Section 15.1 —
the same vocabulary that ends up in the app's `skills` table via
app/refdata/promote_to_app.py, so a trained model's feature space actually
matches what a live user's skill vector can populate), trains
XGBClassifier(objective='multi:softprob'), and only writes
models/role_predictor_v1.pkl if it beats a cosine-similarity baseline (role
centroids in the same feature space — the offline analog of
app/ml/role_predictor.py's live cosine baseline) by >=10% top-3 accuracy
(Section 6.3 / Appendix B).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import top_k_accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

CLEAN_DATA_DIR = Path(__file__).resolve().parents[3] / "ml_pipeline" / "clean"
MODEL_OUT_DIR = Path(__file__).parent / "models"

MIN_EXAMPLES_PER_ROLE = 15  # below this, neither a stratified split nor SMOTE is meaningful
TOP3_IMPROVEMENT_REQUIRED = 1.10  # Section 6.3: XGBoost must beat the baseline by >=10%


def load_training_frames() -> dict[str, pd.DataFrame]:
    frames = {}
    for name in ("esco_skills", "esco_occupations", "esco_tech_skills", "esco_tech_occupations", "linkedin_jobs_clean", "stackoverflow_survey_clean"):
        path = CLEAN_DATA_DIR / f"{name}.parquet"
        if path.exists():
            frames[name] = pd.read_parquet(path)
    return frames


def build_feature_matrix(jobs: pd.DataFrame, vocab: list[str]) -> tuple[np.ndarray, np.ndarray]:
    """Multi-hot encode `skills_linked` against `vocab` (Section 15.1's
    curated tech-skill layer, not the full ESCO skill space) and return
    (X, y) with rows that end up all-zero (no tech skill recognized) dropped
    — they carry no training signal for this feature space."""
    vocab_index = {uri: i for i, uri in enumerate(vocab)}
    rows, labels = [], []
    for skills_linked, role in zip(jobs["skills_linked"], jobs["target_role"]):
        vec = np.zeros(len(vocab), dtype=np.float32)
        hit = False
        for uri in skills_linked:
            idx = vocab_index.get(uri)
            if idx is not None:
                vec[idx] = 1.0
                hit = True
        if hit:
            rows.append(vec)
            labels.append(role)
    if not rows:
        return np.zeros((0, len(vocab))), np.array([])
    return np.vstack(rows), np.array(labels)


def cosine_baseline_predict_proba(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, classes: list[str]) -> np.ndarray:
    """Offline analog of app/ml/role_predictor.py's live cosine-similarity
    baseline: build a centroid skill-vector per role from the training set,
    score test examples by cosine similarity to each centroid. Evaluated in
    the same feature space as XGBoost so the >=10% top-3 comparison is
    apples-to-apples (role_predictor.py's live function instead operates on
    a user's DB-derived confidence vector, a different runtime input this
    offline eval can't reproduce)."""
    centroids = np.zeros((len(classes), X_train.shape[1]), dtype=np.float32)
    for i, role in enumerate(classes):
        mask = y_train == role
        if mask.any():
            centroids[i] = X_train[mask].mean(axis=0)

    def row_cosine(x: np.ndarray) -> np.ndarray:
        norm_x = np.linalg.norm(x)
        norm_c = np.linalg.norm(centroids, axis=1)
        denom = norm_x * norm_c
        denom[denom == 0] = 1e-9
        return (centroids @ x) / denom

    return np.vstack([row_cosine(x) for x in X_test])


def main() -> None:
    frames = load_training_frames()
    if not frames:
        raise SystemExit(f"No cleaned reference data found under {CLEAN_DATA_DIR}. Run ml_pipeline/scripts/run_all.py first.")
    if "linkedin_jobs_clean" not in frames or "esco_tech_skills" not in frames:
        raise SystemExit("Need both linkedin_jobs_clean.parquet and esco_tech_skills.parquet to train a role predictor.")

    jobs = frames["linkedin_jobs_clean"]
    vocab = sorted(frames["esco_tech_skills"]["skill_uri"].unique().tolist())
    print(f"Tech-skill vocabulary: {len(vocab)} skills")

    role_counts = jobs["target_role"].value_counts()
    eligible_roles = role_counts[role_counts >= MIN_EXAMPLES_PER_ROLE].index.tolist()
    dropped_roles = role_counts[role_counts < MIN_EXAMPLES_PER_ROLE]
    if len(dropped_roles):
        print(f"Dropping {len(dropped_roles)} roles with <{MIN_EXAMPLES_PER_ROLE} labeled examples: {dropped_roles.index.tolist()}")
    jobs = jobs[jobs["target_role"].isin(eligible_roles)]

    X, y = build_feature_matrix(jobs, vocab)
    print(f"Feature matrix: {X.shape[0]} examples x {X.shape[1]} features across {len(set(y))} roles")
    if X.shape[0] < 50:
        raise SystemExit("Not enough labeled examples with tech-skill coverage to train reliably.")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    label_encoder = LabelEncoder().fit(y_train)
    classes = list(label_encoder.classes_)
    y_train_enc = label_encoder.transform(y_train)
    y_test_enc = label_encoder.transform(y_test)

    # --- SMOTE for class imbalance (Section 6.3 step 2) ---
    X_train_bal, y_train_bal_enc = X_train, y_train_enc
    try:
        from imblearn.over_sampling import SMOTE

        min_class_count = pd.Series(y_train_enc).value_counts().min()
        k_neighbors = min(5, max(1, min_class_count - 1))
        if min_class_count > 1:
            smote = SMOTE(k_neighbors=k_neighbors, random_state=42)
            X_train_bal, y_train_bal_enc = smote.fit_resample(X_train, y_train_enc)
            print(f"SMOTE: {X_train.shape[0]} -> {X_train_bal.shape[0]} training examples (k_neighbors={k_neighbors})")
    except ImportError:
        print("imbalanced-learn not installed — training without SMOTE augmentation.", file=sys.stderr)

    # --- Baseline: cosine similarity against role centroids ---
    baseline_proba = cosine_baseline_predict_proba(X_train, y_train, X_test, classes)
    baseline_top1 = top_k_accuracy_score(y_test_enc, baseline_proba, k=1, labels=range(len(classes)))
    baseline_top3 = top_k_accuracy_score(y_test_enc, baseline_proba, k=min(3, len(classes)), labels=range(len(classes)))

    # --- XGBoost ---
    model = XGBClassifier(
        objective="multi:softprob",
        eval_metric="mlogloss",
        num_class=len(classes),
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
    )
    model.fit(X_train_bal, y_train_bal_enc)
    xgb_proba = model.predict_proba(X_test)
    xgb_top1 = top_k_accuracy_score(y_test_enc, xgb_proba, k=1, labels=range(len(classes)))
    xgb_top3 = top_k_accuracy_score(y_test_enc, xgb_proba, k=min(3, len(classes)), labels=range(len(classes)))
    xgb_top5 = top_k_accuracy_score(y_test_enc, xgb_proba, k=min(5, len(classes)), labels=range(len(classes)))

    print("\n--- Held-out evaluation (20% split) ---")
    print(f"Cosine baseline : top-1={baseline_top1:.3f}  top-3={baseline_top3:.3f}")
    print(f"XGBoost         : top-1={xgb_top1:.3f}  top-3={xgb_top3:.3f}  top-5={xgb_top5:.3f}")

    required_top3 = baseline_top3 * TOP3_IMPROVEMENT_REQUIRED
    if xgb_top3 >= required_top3:
        MODEL_OUT_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, MODEL_OUT_DIR / "role_predictor_v1.pkl")
        meta = {
            "vocab": vocab,
            "classes": classes,
            "baseline_top3": baseline_top3,
            "xgb_top3": xgb_top3,
            "trained_on_examples": int(X.shape[0]),
        }
        (MODEL_OUT_DIR / "role_predictor_v1_meta.json").write_text(json.dumps(meta, indent=2))
        print(f"\nXGBoost beat the baseline by {(xgb_top3 / baseline_top3 - 1):.1%} (>= 10% required) "
              f"-> wrote models/role_predictor_v1.pkl")
    else:
        print(f"\nXGBoost top-3 ({xgb_top3:.3f}) did not beat baseline*{TOP3_IMPROVEMENT_REQUIRED} ({required_top3:.3f}) "
              f"-> keeping the cosine-similarity baseline in production (Section 6.3 / Appendix B).")


if __name__ == "__main__":
    main()
