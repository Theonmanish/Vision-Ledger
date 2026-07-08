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
    value === 'construction_progress'
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

  return {
    id: claimId,
    claimType,
    status,
    confidenceScore: confidence,
    detectedObjects: objects.map((label) => ({
      label,
      confidence,
    })),
    aiExplanation: claim.reason ?? 'No analysis summary available.',
    imageUrl: claim.image_url ?? '',
    createdAt,
    blockchain: {
      transactionHash: claim.tx_hash ?? placeholderTxHash(claimId),
      network: 'Ethereum Sepolia (placeholder)',
      blockNumber: Math.abs(claimId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)),
      timestamp: createdAt,
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
    transactionHash: claim.tx_hash ?? placeholderTxHash(claim.claim_id),
  };
}
