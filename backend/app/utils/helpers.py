"""
Small pure-function helpers shared across the project.
"""

import uuid
import re
import hashlib


def generate_claim_id() -> str:
    """
    Produce a human-friendly claim identifier.

    Format: CLM-XXXXXX (e.g. CLM-A3F9K1).
    """
    token = uuid.uuid4().hex[:6].upper()
    return f"CLM-{token}"


def sanitise_filename(filename: str) -> str:
    """
    Strip problematic characters from an uploaded file's name
    while preserving the original extension.

    Returns a safe filename string.
    """
    # Keep only alphanumeric, dots, dashes, and underscores.
    safe = re.sub(r"[^A-Za-z0-9._-]", "_", filename)
    # Collapse multiple underscores into one.
    safe = re.sub(r"_+", "_", safe)
    # Prefix with a short UUID segment to avoid storage collisions.
    prefix = uuid.uuid4().hex[:8]
    return f"{prefix}_{safe}"


def placeholder_tx_hash(seed: str) -> str:
    """Deterministic placeholder hash until blockchain integration is live."""
    digest = hashlib.sha256(f"visionledger:{seed}".encode()).hexdigest()
    return f"0x{digest[:40]}"
