// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VisionLedgerVerifier
 * @notice Cryptographic anchor for AI claim verifications.
 *
 * Stores an immutable, timestamped record of each verification hash
 * on Ethereum Sepolia. The contract intentionally exposes a single
 * function — `storeVerification` — and no access control, token,
 * payment, or ownership logic. Anyone may write a hash; the trust
 * model is "anchored, not gated".
 */
contract VisionLedgerVerifier {
    /// @dev Emitted once for every verification hash written on-chain.
    event VerificationStored(
        bytes32 indexed verificationHash,
        address indexed verifier,
        uint256 timestamp
    );

    /**
     * @notice Anchor a verification hash on-chain.
     * @param verificationHash SHA-256 derived hash of the claim payload.
     * @return timestamp The block timestamp at which the hash was stored.
     *
     * The contract does not store redundant state — the emitted event
     * (indexed by hash and verifier) is the durable, queryable record,
     * which keeps gas cost to a single SSTORE-free cold write.
     */
    function storeVerification(bytes32 verificationHash)
        external
        returns (uint256 timestamp)
    {
        timestamp = block.timestamp;
        emit VerificationStored(verificationHash, msg.sender, timestamp);
    }
}
