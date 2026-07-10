"""
Blockchain service — cryptographically anchors AI verifications on
Ethereum Sepolia via the ``VisionLedgerVerifier`` contract.

Responsibilities:
  * Build a deterministic SHA-256 verification hash from the claim
    payload (claim_id, claim_type, description, image_url, confidence,
    timestamp).
  * Submit the hash on-chain through ``storeVerification(bytes32)``.
  * Return the transaction hash, block number, contract address and
    network so the rest of the system can persist and surface them.

Design notes
------------
* The contract ABI is loaded from ``blockchain/.deployed.json`` (the
  single source of truth produced by the Hardhat deploy script) and
  falls back to a minimal inline ABI so the service still imports if
  that file is absent.
* This service is **best-effort by design**. A blockchain failure
  must never break an otherwise-successful AI verification — callers
  receive a ``BlockchainResult`` with ``status="Pending"`` and may
  retry later.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# Minimal ABI for the one function we call. Used only if the richer
# ABI produced at deploy time cannot be located on disk.
_FALLBACK_ABI: list[dict[str, Any]] = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "verificationHash", "type": "bytes32"},
            {"indexed": True, "name": "verifier", "type": "address"},
            {"indexed": False, "name": "timestamp", "type": "uint256"},
        ],
        "name": "VerificationStored",
        "type": "event",
    },
    {
        "inputs": [{"name": "verificationHash", "type": "bytes32"}],
        "name": "storeVerification",
        "outputs": [{"name": "timestamp", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]

# Status values persisted alongside the anchor.
STATUS_PENDING = "Pending"
STATUS_CONFIRMED = "Confirmed"
STATUS_FAILED = "Failed"

_HEX64 = re.compile(r"^[0-9a-fA-F]{64}$")


# ── Data containers ────────────────────────────────────────────────

class BlockchainResult:
    """
    Outcome of an anchoring attempt.

    ``status`` is one of ``Confirmed`` / ``Pending`` / ``Failed`` and
    drives how the rest of the system records the anchor.
    """

    def __init__(
        self,
        *,
        status: str,
        verification_hash: str,
        transaction_hash: str | None = None,
        block_number: int | None = None,
        contract_address: str | None = None,
        network: str | None = None,
        anchor_time: str | None = None,
        error: str | None = None,
    ) -> None:
        self.status = status
        self.verification_hash = verification_hash
        self.transaction_hash = transaction_hash
        self.block_number = block_number
        self.contract_address = contract_address
        self.network = network
        self.anchor_time = anchor_time or datetime.now(timezone.utc).isoformat()
        self.error = error

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "verification_hash": self.verification_hash,
            "transaction_hash": self.transaction_hash,
            "block_number": self.block_number,
            "contract_address": self.contract_address,
            "network": self.network,
            "verification_anchor_time": self.anchor_time,
            "error": self.error,
        }


# ── Hash generation ────────────────────────────────────────────────

def generate_verification_hash(
    *,
    claim_id: str,
    claim_type: str,
    description: str,
    image_url: str,
    confidence: float,
    timestamp: str,
) -> str:
    """
    Build a deterministic SHA-256 hash (0x-prefixed) over the claim
    payload, in a fixed field order.

    The returned string is a 66-char ``bytes32`` hex value suitable for
    passing directly to the contract's ``storeVerification`` function.
    """
    payload = "|".join(
        [
            str(claim_id),
            str(claim_type),
            str(description or ""),
            str(image_url or ""),
            f"{float(confidence):.6f}",
            str(timestamp),
        ]
    )
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    return f"0x{digest}"


# ── ABI resolution ─────────────────────────────────────────────────

def _load_contract_abi() -> list[dict[str, Any]]:
    """
    Resolve the contract ABI.

    Prefer ``backend/../blockchain/.deployed.json`` (written by the
    Hardhat deploy script), otherwise fall back to the inline ABI.
    """
    candidates = [
        # backend/app/services/ -> backend/ -> repo/blockchain/
        Path(__file__).resolve().parents[3] / "blockchain" / ".deployed.json",
        Path(__file__).resolve().parents[4] / "blockchain" / ".deployed.json",
    ]
    for path in candidates:
        try:
            if path.is_file():
                data = json.loads(path.read_text(encoding="utf-8"))
                abi = data.get("abi")
                if isinstance(abi, list) and abi:
                    logger.debug("Loaded contract ABI from %s", path)
                    return abi
        except Exception:
            logger.warning("Could not read ABI from %s", path, exc_info=True)
    return _FALLBACK_ABI


def _normalize_private_key(key: str) -> str:
    """Accept keys with or without a ``0x`` prefix."""
    key = key.strip()
    if key.startswith("0x"):
        return key
    return f"0x{key}"


def _is_configured() -> bool:
    """True when all values required to talk to the chain are present."""
    return all(
        [
            bool(settings.SEPOLIA_RPC_URL),
            bool(settings.PRIVATE_KEY),
            bool(_HEX64.match(settings.PRIVATE_KEY.strip().removeprefix("0x")))
            or bool(_HEX64.match(settings.PRIVATE_KEY.strip())),
            bool(settings.CONTRACT_ADDRESS),
        ]
    )


# ── Service ────────────────────────────────────────────────────────

class BlockchainService:
    """
    Anchors verification hashes on Ethereum Sepolia.

    The class lazily constructs its Web3/contract handles so the
    service imports cleanly even when blockchain is unconfigured.
    """

    def __init__(self) -> None:
        self._w3: Any = None
        self._contract: Any = None
        self._abi: list[dict[str, Any]] = _load_contract_abi()

    # -- lazy initialisation ------------------------------------------

    def _ensure_ready(self) -> None:
        if self._w3 is not None:
            return
        from web3 import Web3  # imported lazily to keep startup light

        w3 = Web3(Web3.HTTPProvider(settings.SEPOLIA_RPC_URL))
        if not w3.is_connected():
            raise ConnectionError("Cannot reach Sepolia RPC endpoint.")
        account = w3.eth.account.from_key(_normalize_private_key(settings.PRIVATE_KEY))
        self._w3 = w3
        self._account = account
        self._contract = w3.eth.contract(
            address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
            abi=self._abi,
        )

    # -- public API ---------------------------------------------------

    def anchor_verification(
        self,
        *,
        verification_hash: str,
    ) -> BlockchainResult:
        """
        Submit ``verification_hash`` (a 0x-prefixed bytes32) to the
        contract and return the on-chain receipt details.

        Never raises: a failure is returned as ``status="Pending"``.
        """
        if not _is_configured():
            return BlockchainResult(
                status=STATUS_PENDING,
                verification_hash=verification_hash,
                error="Blockchain not configured (missing RPC/key/address).",
            )

        try:
            self._ensure_ready()
            return self._send_transaction(verification_hash)
        except Exception as exc:  # noqa: BLE001 — best-effort anchor
            logger.exception("Blockchain anchor failed")
            return BlockchainResult(
                status=STATUS_PENDING,
                verification_hash=verification_hash,
                contract_address=settings.CONTRACT_ADDRESS or None,
                network=settings.BLOCKCHAIN_NETWORK,
                error=str(exc),
            )

    # -- internals ----------------------------------------------------

    def _send_transaction(self, verification_hash: str) -> BlockchainResult:
        w3 = self._w3
        account = self._account
        contract = self._contract
        sender = account.address

        nonce = w3.eth.get_transaction_count(sender)
        latest = w3.eth.gas_price

        tx = contract.functions.storeVerification(
            bytes.fromhex(verification_hash[2:])
        ).build_transaction(
            {
                "from": sender,
                "nonce": nonce,
                "gas": 120_000,
                "gasPrice": latest,
                "chainId": w3.eth.chain_id,
            }
        )

        signed = account.sign_transaction(tx)
        raw = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction")
        tx_hash = w3.eth.send_raw_transaction(raw)

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
        status_ok = receipt.get("status") == 1
        block_number = receipt.get("blockNumber")

        anchor_time = datetime.now(timezone.utc).isoformat()
        hex_tx = tx_hash.hex() if isinstance(tx_hash, (bytes, bytearray)) else str(tx_hash)
        # Normalise to a 0x-prefixed lowercase hex string — web3.py may
        # return an un-prefixed HexBytes representation depending on version.
        if not hex_tx.startswith("0x"):
            hex_tx = "0x" + hex_tx
        hex_tx = hex_tx.lower()

        return BlockchainResult(
            status=STATUS_CONFIRMED if status_ok else STATUS_FAILED,
            verification_hash=verification_hash,
            transaction_hash=hex_tx,
            block_number=block_number,
            contract_address=settings.CONTRACT_ADDRESS,
            network=settings.BLOCKCHAIN_NETWORK,
            anchor_time=anchor_time,
            error=None if status_ok else "Transaction reverted on-chain.",
        )
