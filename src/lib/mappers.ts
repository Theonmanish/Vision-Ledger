import type {
  ClaimType,
  HistoryRecord,
  VerificationResult,
  VerificationStatus,
} from '../types';
import type { BackendClaim } from './api';

function isClaimType(value: string): value is ClaimType {
  return (
    value === 'tree_plantation' ||
    value === 'solar_installation' ||
    value === 'construction_progress' ||
    value === 'package_delivery' ||
    value === 'waste_processing' ||
    value === 'infrastructure_inspection' ||
    value === 'agricultural_monitoring' ||
    value === 'water_body_monitoring'
  );
}

export function mapBackendStatus(
  status: string,
  claimSupported: boolean | undefined,
  confidence: number
): VerificationStatus {
  if (claimSupported === true) {
    return confidence >= 0.75 ? 'verified' : 'partially_verified';
  }
  if (claimSupported === false) {
    return confidence >= 0.4 ? 'inconclusive' : 'failed';
  }

  const normalized = status.toLowerCase();
  if (normalized === 'verified') {
    return confidence >= 0.75 ? 'verified' : 'partially_verified';
  }
  return confidence >= 0.4 ? 'inconclusive' : 'failed';
}

const ETHERSCAN_BASE = 'https://sepolia.etherscan.io';

/**
 * Build the Etherscan transaction URL for a real on-chain tx hash.
 * Returns an empty string if the hash is not a real 0x transaction.
 */
function buildExplorerUrl(
  transactionHash: string | undefined,
  fallbackExplorer?: string
): string {
  if (fallbackExplorer) return fallbackExplorer;
  if (!transactionHash) return '';
  if (/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
    return `${ETHERSCAN_BASE}/tx/${transactionHash}`;
  }
  return '';
}

export function placeholderTxHash(claimId: string): string {
  let hash = 0;
  const input = `visionledger:${claimId}`;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  const hex = hash.toString(16).padStart(8, '0');
  return `0x${(hex + claimId.replace(/[^a-zA-Z0-9]/g, '')).padEnd(40, '0').slice(0, 40)}`;
}

export function mapClaimToResult(claim: BackendClaim): VerificationResult {
  const claimType = isClaimType(claim.claim_type)
    ? claim.claim_type
    : 'tree_plantation';
  const confidence = claim.confidence ?? 0;
  const status = mapBackendStatus(
    claim.status,
    claim.claim_supported,
    confidence
  );
  const objects = claim.objects_detected ?? [];
  const createdAt = claim.created_at ?? new Date().toISOString();
  const claimId = claim.claim_id;

  // Real on-chain transaction hash if anchored; otherwise a placeholder
  // so the UI always has something to render.
  const realTx = claim.transaction_hash ?? claim.tx_hash;
  const isRealAnchor =
    !!realTx && /^0x[a-fA-F0-9]{64}$/.test(realTx) && claim.blockchain_status === 'Confirmed';
  const transactionHash = realTx && realTx.startsWith('0x')
    ? realTx
    : isRealAnchor
      ? `0x${realTx}`
      : placeholderTxHash(claimId);
  const anchorTime = claim.verification_anchor_time ?? createdAt;

  return {
    id: claimId,
    claimType,
    status,
    confidenceScore: confidence,
    visionConfidence: claim.vision_confidence ?? 0,
    claimMatchConfidence: claim.claim_match_confidence ?? 0,
    verificationConfidence: claim.verification_confidence ?? 0,
    detectedObjects: objects.map((obj) => ({
      label: typeof obj === 'string' ? obj : obj.label,
      confidence: typeof obj === 'string' ? confidence : obj.confidence / 100,
    })),
    aiExplanation: claim.reason ?? 'No analysis summary available.',
    imageUrl: claim.image_url ?? '',
    createdAt,
    blockchain: {
      transactionHash,
      network: claim.network ?? 'Ethereum Sepolia',
      blockNumber: claim.block_number ?? 0,
      timestamp: anchorTime,
      verificationHash: claim.blockchain_hash,
      contractAddress: claim.contract_address,
      explorerUrl: buildExplorerUrl(
        transactionHash.startsWith('0x') ? transactionHash : undefined,
        claim.explorer_url
      ),
      blockchainStatus: claim.blockchain_status,
    },
    certificate: {
      issuedAt: createdAt,
      downloadUrl: `#certificate-${claimId}`,
    },
  };
}

export function mapHistoryRecord(claim: BackendClaim): HistoryRecord {
  const claimType = isClaimType(claim.claim_type)
    ? claim.claim_type
    : 'tree_plantation';
  const confidence = claim.confidence ?? 0;
  const realTx = claim.transaction_hash ?? claim.tx_hash;
  const transactionHash =
    realTx && realTx.startsWith('0x')
      ? realTx
      : placeholderTxHash(claim.claim_id);

  return {
    id: claim.claim_id,
    claimId: claim.claim_id,
    claimType,
    status: mapBackendStatus(
      claim.status,
      claim.claim_supported,
      confidence
    ),
    confidence,
    date: claim.created_at ?? new Date().toISOString(),
    transactionHash,
    blockchainStatus: claim.blockchain_status,
  };
}
