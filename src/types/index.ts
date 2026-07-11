export type ClaimType =
  | 'tree_plantation'
  | 'solar_installation'
  | 'construction_progress'
  | 'package_delivery'
  | 'waste_processing'
  | 'infrastructure_inspection'
  | 'agricultural_monitoring'
  | 'water_body_monitoring';

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
  visionConfidence: number;
  claimMatchConfidence: number;
  verificationConfidence: number;
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
  package_delivery: 'Package Delivery',
  waste_processing: 'Waste Processing',
  infrastructure_inspection: 'Infrastructure Inspection',
  agricultural_monitoring: 'Agricultural Monitoring',
  water_body_monitoring: 'Water Body Monitoring',
};

export const CLAIM_TYPE_ICONS: Record<ClaimType, string> = {
  tree_plantation: '🌳',
  solar_installation: '☀️',
  construction_progress: '🏗️',
  package_delivery: '🚚',
  waste_processing: '♻️',
  infrastructure_inspection: '🏢',
  agricultural_monitoring: '🌾',
  water_body_monitoring: '🌊',
};

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  verified: 'Verified',
  partially_verified: 'Partially Verified',
  inconclusive: 'Inconclusive',
  failed: 'Failed',
};

// ── Batch Verification Types ──────────────────────────────────

export type BatchStatus = 'processing' | 'completed' | 'partial' | 'failed';

export interface BatchImageItem {
  image_url: string;
  claim_type: ClaimType;
  description: string;
}

export interface BatchImageResult {
  index: number;
  filename: string | null;
  claim_id: string | null;
  status: 'success' | 'failed';
  confidence: number | null;
  error: string | null;
}

export interface Batch {
  id: string;
  project_name: string | null;
  total_images: number;
  completed_images: number;
  failed_images: number;
  average_confidence: number;
  status: BatchStatus;
  created_at: string;
}

export interface BatchWithResults extends Batch {
  results: BatchImageResult[];
}

export interface BatchListResponse {
  batches: Batch[];
  count: number;
}