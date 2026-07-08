import type { VerificationResult, HistoryRecord } from '../types';

export const MOCK_RESULTS: Record<string, VerificationResult> = {
  'v-001': {
    id: 'v-001',
    claimType: 'tree_plantation',
    status: 'verified',
    confidenceScore: 0.94,
    detectedObjects: [
      { label: 'Tree sapling', confidence: 0.98 },
      { label: 'Soil bed', confidence: 0.92 },
      { label: 'Mulch layer', confidence: 0.87 },
      { label: 'Drip irrigation', confidence: 0.79 },
    ],
    aiExplanation:
      'Analysis confirms newly planted saplings with proper spacing and soil preparation. The presence of drip irrigation and mulch layer indicates sustainable planting practices. 94% confidence in successful plantation verification.',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb082b14?w=800&q=80',
    createdAt: '2026-06-15T10:30:00Z',
    blockchain: {
      transactionHash: '0x7a3b5c2d1e8f4a9b6c0d3e7f1a2b4c5d6e7f8a9',
      network: 'Ethereum Sepolia',
      blockNumber: 4857291,
      timestamp: '2026-06-15T10:32:15Z',
    },
    certificate: {
      issuedAt: '2026-06-15T10:35:00Z',
      downloadUrl: '#',
    },
  },
  'v-002': {
    id: 'v-002',
    claimType: 'solar_installation',
    status: 'verified',
    confidenceScore: 0.97,
    detectedObjects: [
      { label: 'Photovoltaic panels', confidence: 0.99 },
      { label: 'Mounting structure', confidence: 0.95 },
      { label: 'Inverter unit', confidence: 0.93 },
      { label: 'Wiring conduit', confidence: 0.88 },
    ],
    aiExplanation:
      'Solar panel installation detected with high confidence. Panels are properly aligned with optimal tilt angle. Mounting structure appears secure. Inverter and wiring comply with standard installation practices.',
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80',
    createdAt: '2026-06-14T14:00:00Z',
    blockchain: {
      transactionHash: '0x9b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
      network: 'Ethereum Sepolia',
      blockNumber: 4857188,
      timestamp: '2026-06-14T14:02:30Z',
    },
    certificate: {
      issuedAt: '2026-06-14T14:05:00Z',
      downloadUrl: '#',
    },
  },
  'v-003': {
    id: 'v-003',
    claimType: 'construction_progress',
    status: 'partially_verified',
    confidenceScore: 0.72,
    detectedObjects: [
      { label: 'Foundation', confidence: 0.95 },
      { label: 'Steel reinforcement', confidence: 0.88 },
      { label: 'Concrete pouring', confidence: 0.76 },
      { label: 'Scaffolding', confidence: 0.65 },
    ],
    aiExplanation:
      'Foundation work and steel reinforcement detected. However, concrete curing appears incomplete in some areas. Additional progress documentation recommended for full verification. 72% confidence in partial verification.',
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
    createdAt: '2026-06-13T09:00:00Z',
    blockchain: {
      transactionHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
      network: 'Ethereum Sepolia',
      blockNumber: 4857085,
      timestamp: '2026-06-13T09:02:45Z',
    },
    certificate: {
      issuedAt: '2026-06-13T09:05:00Z',
      downloadUrl: '#',
    },
  },
  'v-004': {
    id: 'v-004',
    claimType: 'tree_plantation',
    status: 'inconclusive',
    confidenceScore: 0.45,
    detectedObjects: [
      { label: 'Vegetation', confidence: 0.82 },
      { label: 'Possible saplings', confidence: 0.55 },
      { label: 'Overgrown area', confidence: 0.48 },
    ],
    aiExplanation:
      'Vegetation detected but unable to conclusively identify newly planted saplings. Image quality and lighting conditions limit analysis. Recommend submitting a clearer image for re-evaluation.',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    createdAt: '2026-06-12T16:00:00Z',
    blockchain: {
      transactionHash: '0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
      network: 'Ethereum Sepolia',
      blockNumber: 4856982,
      timestamp: '2026-06-12T16:02:20Z',
    },
    certificate: {
      issuedAt: '2026-06-12T16:05:00Z',
      downloadUrl: '#',
    },
  },
  'v-005': {
    id: 'v-005',
    claimType: 'solar_installation',
    status: 'failed',
    confidenceScore: 0.18,
    detectedObjects: [
      { label: 'Roof tiles', confidence: 0.91 },
      { label: 'Possible mounting bracket', confidence: 0.32 },
    ],
    aiExplanation:
      'No solar panels detected in the submitted image. The image shows roof tiles with a possible mounting bracket, but no photovoltaic panels are visible. Verification cannot be confirmed.',
    imageUrl: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80',
    createdAt: '2026-06-11T11:00:00Z',
    blockchain: {
      transactionHash: '0x2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
      network: 'Ethereum Sepolia',
      blockNumber: 4856879,
      timestamp: '2026-06-11T11:02:10Z',
    },
    certificate: {
      issuedAt: '2026-06-11T11:05:00Z',
      downloadUrl: '#',
    },
  },
};

export const MOCK_HISTORY: HistoryRecord[] = [
  {
    id: 'v-001',
    claimId: 'VLED-001',
    claimType: 'tree_plantation',
    status: 'verified',
    confidence: 0.94,
    date: '2026-06-15T10:30:00Z',
    transactionHash: '0x7a3b5c2d1e8f4a9b6c0d3e7f1a2b4c5d6e7f8a9',
  },
  {
    id: 'v-002',
    claimId: 'VLED-002',
    claimType: 'solar_installation',
    status: 'verified',
    confidence: 0.97,
    date: '2026-06-14T14:00:00Z',
    transactionHash: '0x9b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
  },
  {
    id: 'v-003',
    claimId: 'VLED-003',
    claimType: 'construction_progress',
    status: 'partially_verified',
    confidence: 0.72,
    date: '2026-06-13T09:00:00Z',
    transactionHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
  },
  {
    id: 'v-004',
    claimId: 'VLED-004',
    claimType: 'tree_plantation',
    status: 'inconclusive',
    confidence: 0.45,
    date: '2026-06-12T16:00:00Z',
    transactionHash: '0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
  },
  {
    id: 'v-005',
    claimId: 'VLED-005',
    claimType: 'solar_installation',
    status: 'failed',
    confidence: 0.18,
    date: '2026-06-11T11:00:00Z',
    transactionHash: '0x2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
  },
  {
    id: 'v-006',
    claimId: 'VLED-006',
    claimType: 'construction_progress',
    status: 'verified',
    confidence: 0.91,
    date: '2026-06-10T08:00:00Z',
    transactionHash: '0x5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a',
  },
  {
    id: 'v-007',
    claimId: 'VLED-007',
    claimType: 'tree_plantation',
    status: 'partially_verified',
    confidence: 0.68,
    date: '2026-06-09T13:00:00Z',
    transactionHash: '0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
  },
  {
    id: 'v-008',
    claimId: 'VLED-008',
    claimType: 'solar_installation',
    status: 'verified',
    confidence: 0.95,
    date: '2026-06-08T15:00:00Z',
    transactionHash: '0x0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d',
  },
  {
    id: 'v-009',
    claimId: 'VLED-009',
    claimType: 'construction_progress',
    status: 'inconclusive',
    confidence: 0.41,
    date: '2026-06-07T10:00:00Z',
    transactionHash: '0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
  },
  {
    id: 'v-010',
    claimId: 'VLED-010',
    claimType: 'tree_plantation',
    status: 'verified',
    confidence: 0.88,
    date: '2026-06-06T09:00:00Z',
    transactionHash: '0x6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f',
  },
];

export function getStatusColor(status: string): string {
  switch (status) {
    case 'verified':
      return 'success';
    case 'partially_verified':
      return 'warning';
    case 'inconclusive':
      return 'muted';
    case 'failed':
      return 'danger';
    default:
      return 'muted';
  }
}