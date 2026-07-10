export type ClaimType = 'tree_plantation' | 'solar_installation' | 'construction_progress';

export type VerificationStatus = 'verified' | 'partially_verified' | 'inconclusive' | 'failed';

export interface EvidenceUpload {
  file: File | null;
  previewUrl: string | null;
  claimType: ClaimType | null;
  description: string;
}

export interface DetectedObject {
  label: string;
  confidence: number;
}

export interface BlockchainRecord {
  transactionHash: string;
  network: string;
  blockNumber: number;
  timestamp: string;
  verificationHash?: string;
  contractAddress?: string;
  explorerUrl?: string;
  blockchainStatus?: string;
}

export interface CertificateRecord {
  issuedAt: string;
  downloadUrl: string;
}

export interface VerificationResult {
  id: string;
  claimType: ClaimType;
  status: VerificationStatus;
  confidenceScore: number;
  detectedObjects: DetectedObject[];
  aiExplanation: string;
  imageUrl: string;
  createdAt: string;
  blockchain: BlockchainRecord;
  certificate: CertificateRecord;
}

export interface HistoryRecord {
  id: string;
  claimId: string;
  claimType: ClaimType;
  status: VerificationStatus;
  confidence: number;
  date: string;
  transactionHash: string;
  blockchainStatus?: string;
}

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  tree_plantation: 'Tree Plantation',
  solar_installation: 'Solar Installation',
  construction_progress: 'Construction Progress',
};

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  verified: 'Verified',
  partially_verified: 'Partially Verified',
  inconclusive: 'Inconclusive',
  failed: 'Failed',
};