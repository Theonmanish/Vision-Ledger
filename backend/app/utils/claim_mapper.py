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

    # Blockchain proof — prefer typed columns (post-migration 001) and
    # fall back to the same values persisted inside claim_input JSON so
    # the data is correct whether or not the migration has run.
    blockchain = claim_input.get("blockchain") if isinstance(claim_input.get("blockchain"), dict) else {}
    transaction_hash = (
        row.get("transaction_hash")
        or row.get("tx_hash")
        or blockchain.get("transaction_hash")
    )
    blockchain_hash = row.get("blockchain_hash") or blockchain.get("verification_hash")
    block_number = row.get("block_number") or blockchain.get("block_number")
    network = row.get("network") or blockchain.get("network")
    anchor_time = (
        row.get("verification_anchor_time")
        or blockchain.get("anchor_time")
        or blockchain.get("verification_anchor_time")
    )
    blockchain_status = (
        row.get("blockchain_status")
        or blockchain.get("status")
        or ("Confirmed" if transaction_hash else "Pending")
    )

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
        "tx_hash": transaction_hash,
        # ── User ownership (migration 002) ────────────────────────
        "user_id": row.get("user_id"),
        "created_by_email": row.get("created_by_email"),
        # ── Blockchain proof (real on-chain values) ───────────────
        "blockchain_hash": blockchain_hash,
        "transaction_hash": transaction_hash,
        "block_number": block_number,
        "network": network,
        "verification_anchor_time": anchor_time,
        "blockchain_status": blockchain_status,
        "contract_address": blockchain.get("contract_address"),
        "explorer_url": blockchain.get("explorer_url"),
        # ── AI assessment ──────────────────────────────────────────
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
    blockchain: dict[str, Any] | None = None,
    user_id: str | None = None,
    user_email: str | None = None,
) -> dict[str, Any]:
    """Build an insert payload compatible with the live Supabase schema.

    The blockchain proof is written to *both* the typed columns (when
    migration 001 is applied) and inside ``claim_input.blockchain`` so
    it survives even before the migration runs.
    """
    blockchain = blockchain or {}
    claim_input = {
        "claim_code": claim_code,
        "claim_supported": claim_supported,
        "objects_detected": objects_detected,
        "estimated_quantity": estimated_quantity,
        "limitations": limitations,
        "recommendation": recommendation,
    }
    if blockchain:
        claim_input["blockchain"] = blockchain

    payload: dict[str, Any] = {
        "claim_type": CLAIM_TYPE_TO_LABEL.get(claim_type, claim_type),
        "description": description,
        "image_url": image_url.rstrip("?"),
        "status": status,
        "confidence": int(round(confidence * 100)),
        "reason": reason,
        "tx_hash": tx_hash,
        "claim_input": claim_input,
    }

    # Typed blockchain columns. These are no-ops until migration 001
    # is applied; the insert path tolerates their absence (see
    # SupabaseService._safe_insert).
    if blockchain:
        payload["blockchain_hash"] = blockchain.get("verification_hash")
        payload["transaction_hash"] = blockchain.get("transaction_hash")
        payload["block_number"] = blockchain.get("block_number")
        payload["network"] = blockchain.get("network")
        payload["verification_anchor_time"] = blockchain.get("anchor_time")
        payload["blockchain_status"] = blockchain.get("status") or "Pending"

    # User ownership (migration 002)
    if user_id:
        payload["user_id"] = user_id
    if user_email:
        payload["created_by_email"] = user_email

    return payload
