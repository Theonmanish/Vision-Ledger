import type { ClaimType, HistoryRecord, VerificationResult } from '../types';
import { mapClaimToResult, mapHistoryRecord } from './mappers';
import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = await response.json();
    const code = body?.error?.code as string | undefined;
    const message = body?.error?.message ?? response.statusText;
    return new ApiError(message, response.status, code);
  } catch {
    return new ApiError(response.statusText || 'Request failed', response.status);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const headers = {
    ...authHeaders,
    ...init?.headers,
  };
  
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
  
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json() as Promise<T>;
}

export interface UploadResult {
  imageUrl: string;
  fileName: string;
}

export interface VerifyApiResult {
  claimId: string;
  status: string;
  confidence: number;
  reason: string;
  claim_supported: boolean;
  objects_detected: string[];
  estimated_quantity: number | null;
  limitations: string;
  recommendation: string;
}

export interface BackendClaim {
  id?: string;
  claim_id: string;
  claim_code?: string;
  claim_type: string;
  description?: string;
  status: string;
  confidence: number;
  reason?: string;
  image_url?: string;
  created_at?: string;
  tx_hash?: string;
  claim_supported?: boolean;
  objects_detected?: string[];
  estimated_quantity?: number | null;
  limitations?: string;
  recommendation?: string;
  // Blockchain proof (real on-chain values)
  blockchain_hash?: string;
  transaction_hash?: string;
  block_number?: number | null;
  network?: string;
  verification_anchor_time?: string;
  blockchain_status?: string;
  contract_address?: string;
  explorer_url?: string;
}

export async function checkHealth(): Promise<boolean> {
  try {
    await request<{ healthy: boolean }>('/health');
    return true;
  } catch {
    return false;
  }
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  return request<UploadResult>('/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function verifyClaim(params: {
  claimType: ClaimType;
  description: string;
  imageUrl: string;
}): Promise<VerifyApiResult> {
  const formData = new FormData();
  formData.append('claim_type', params.claimType);
  formData.append('description', params.description);
  formData.append('image_url', params.imageUrl);
  return request<VerifyApiResult>('/verify', {
    method: 'POST',
    body: formData,
  });
}

export async function fetchHistory(): Promise<HistoryRecord[]> {
  const data = await request<{ claims: BackendClaim[]; count: number }>('/history');
  return data.claims.map(mapHistoryRecord);
}

export async function fetchClaim(claimId: string): Promise<VerificationResult> {
  const claim = await request<BackendClaim>(`/claims/${encodeURIComponent(claimId)}`);
  return mapClaimToResult(claim);
}

export async function downloadCertificate(claimId: string): Promise<void> {
  const authHeaders = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE}/certificate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ claim_id: claimId }),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `VisionLedger-Certificate-${claimId}.pdf`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
