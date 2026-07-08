"""
Map between the live Supabase ``claims`` table schema and API payloads.

The production table stores extended AI fields inside ``claim_input`` JSON
and uses human-readable ``claim_type`` labels.
"""

from __future__ import annotations

import json
from typing import Any

CLAIM_TYPE_TO_LABEL: dict[str, str] = {
    "tree_plantation": "Tree Plantation",
    "solar_installation": "Solar Installation",
    "construction_progress": "Construction Progress",
}

LABEL_TO_CLAIM_TYPE: dict[str, str] = {
    label: key for key, label in CLAIM_TYPE_TO_LABEL.items()
}


def _parse_claim_input(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}


def normalize_claim_record(row: dict[str, Any]) -> dict[str, Any]:
    """Convert a database row into the API response shape."""
    claim_input = _parse_claim_input(row.get("claim_input"))
    label = row.get("claim_type") or ""
    claim_type = LABEL_TO_CLAIM_TYPE.get(label, label)

    return {
        "id": row.get("id"),
        "claim_id": row.get("id"),
        "claim_code": claim_input.get("claim_code"),
        "claim_type": claim_type,
        "claim_type_label": label,
        "description": row.get("description"),
        "status": row.get("status"),
        "confidence": float(row.get("confidence") or 0) / 100.0,
        "reason": row.get("reason"),
        "image_url": (row.get("image_url") or "").rstrip("?"),
        "created_at": row.get("created_at"),
        "tx_hash": row.get("tx_hash"),
        "claim_supported": claim_input.get("claim_supported"),
        "objects_detected": claim_input.get("objects_detected") if isinstance(claim_input.get("objects_detected"), list) else [],
        "estimated_quantity": claim_input.get("estimated_quantity"),
        "limitations": claim_input.get("limitations"),
        "recommendation": claim_input.get("recommendation"),
    }


def build_claim_payload(
    *,
    claim_code: str,
    claim_type: str,
    description: str,
    image_url: str,
    status: str,
    confidence: float,
    reason: str,
    tx_hash: str,
    claim_supported: bool,
    objects_detected: list[str],
    estimated_quantity: int | None,
    limitations: str,
    recommendation: str,
) -> dict[str, Any]:
    """Build an insert payload compatible with the live Supabase schema."""
    return {
        "claim_type": CLAIM_TYPE_TO_LABEL.get(claim_type, claim_type),
        "description": description,
        "image_url": image_url.rstrip("?"),
        "status": status,
        "confidence": int(round(confidence * 100)),
        "reason": reason,
        "tx_hash": tx_hash,
        "claim_input": {
            "claim_code": claim_code,
            "claim_supported": claim_supported,
            "objects_detected": objects_detected,
            "estimated_quantity": estimated_quantity,
            "limitations": limitations,
            "recommendation": recommendation,
        },
    }
