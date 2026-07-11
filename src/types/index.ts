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