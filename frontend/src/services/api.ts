import type { 
  VerifyRequest, 
  VerifyResponse, 
  VerificationHistoryItem,
  SimilarClaim,
  FeedItem,
  VaccineDigest,
  RegionalClaim,
  ScamReportRequest,
  ScamReportResponse,
  HealthStatus
} from '../types';

const API_BASE_URL = 'https://checkmate-gtdw.onrender.com';

async function fetchApi<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const apiService = {
  // Health Check
  async checkHealth(): Promise<HealthStatus> {
    return fetchApi<HealthStatus>('/health');
  },

  // Verify Claim - Main endpoint
  async verifyClaim(text: string, language: string = 'en', image_base64?: string): Promise<VerifyResponse> {
    const body: VerifyRequest = { text, language };
    if (image_base64) {
      body.image_base64 = image_base64;
    }
    
    return fetchApi<VerifyResponse>('/api/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Get Verification by ID
  async getVerification(verificationId: string): Promise<VerifyResponse> {
    return fetchApi<VerifyResponse>(`/api/verify/${verificationId}`);
  },

  // Get Verification History
  async getVerificationHistory(
    limit: number = 20, 
    offset: number = 0, 
    language?: string
  ): Promise<VerificationHistoryItem[]> {
    const params = new URLSearchParams({ 
      limit: limit.toString(), 
      offset: offset.toString() 
    });
    if (language) params.append('language', language);
    
    return fetchApi<VerificationHistoryItem[]>(`/api/verify/history?${params}`);
  },

  // Get Similar Claims
  async getSimilarClaims(verificationId: string, limit: number = 5): Promise<SimilarClaim[]> {
    return fetchApi<SimilarClaim[]>(`/api/verify/similar/${verificationId}?limit=${limit}`);
  },

  // Threat Feed
  async getFeed(
    limit: number = 10, 
    intensity?: string, 
    language?: string
  ): Promise<FeedItem[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (intensity) params.append('intensity', intensity);
    if (language) params.append('language', language);
    
    return fetchApi<FeedItem[]>(`/api/feed?${params}`);
  },

  async getTrendingThreats(limit: number = 5): Promise<FeedItem[]> {
    return fetchApi<FeedItem[]>(`/api/feed/trending?limit=${limit}`);
  },

  // Vaccine Digest
  async getLatestVaccine(): Promise<VaccineDigest> {
    return fetchApi<VaccineDigest>('/api/vaccine/latest');
  },

  // Regional Claims
  async getRegionalClaims(
    country?: string, 
    language?: string, 
    limit: number = 20
  ): Promise<RegionalClaim[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (country) params.append('country', country);
    if (language) params.append('language', language);
    
    return fetchApi<RegionalClaim[]>(`/api/proximity/claims?${params}`);
  },

  // Scam Reports
  async reportScam(report: ScamReportRequest): Promise<ScamReportResponse> {
    return fetchApi<ScamReportResponse>('/api/report-scam', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  async getScamReports(limit: number = 20, status?: string): Promise<ScamReportResponse[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (status) params.append('status', status);
    
    return fetchApi<ScamReportResponse[]>(`/api/scam-reports?${params}`);
  },
};
