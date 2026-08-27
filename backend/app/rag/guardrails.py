"""Fact-check output against the user profile (Section 6.4 / 13). The
prompt already instructs the model not to invent facts; this is the
second line of defense referenced by the "hallucination rate" metric
(Section 13: target under 2%) — a cheap numeric-claim check, not a full
NLI verifier.
"""

from __future__ import annotations

import re


def extract_numeric_claims(text: str) -> list[str]:
    return re.findall(r"\b\d+(?:\.\d+)?%?\b", text)


def check_numeric_claims(text: str, profile_summary: dict) -> list[str]:
    """Returns numeric tokens in `text` that don't appear anywhere in the
    profile summary — candidates for a fabricated number. Best-effort: this
    catches invented scores/percentages, not every kind of hallucination."""
    known_values = {str(v) for v in _flatten(profile_summary)}
    suspicious = []
    for claim in extract_numeric_claims(text):
        bare = claim.rstrip("%")
        if bare not in known_values and claim not in known_values:
            suspicious.append(claim)
    return suspicious


def _flatten(obj) -> list:
    values = []
    if isinstance(obj, dict):
        for v in obj.values():
            values.extend(_flatten(v))
    elif isinstance(obj, list):
        for v in obj:
            values.extend(_flatten(v))
    else:
        values.append(obj)
    return values
