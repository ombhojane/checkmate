// CheckmateAI API Types

// Verify API Types
export interface VerifyRequest {
  text: string;
  language?: string;
  image_base64?: string;
}

export interface Source {
  credibility_score: number;
  snippet: string;
  title: string;
  url: string;
}

export interface VerifyResponse {
  confidence: number;
  detailed_analysis: string;
  intensity: 'low' | 'medium' | 'high';
  processing_time_ms: number;
  sources: Source[];
  summary: string;
  verdict: string;
  verification_id: string;
}

// Verification History Types
export interface VerificationHistoryItem {
  id: string;
  claim_text: string;
  confidence_score: number;
  created_at: string;
  intensity: 'low' | 'medium' | 'high';
  language: string;
  summary: string;
  verdict: string;
}

// Similar Claims Types
export interface SimilarClaim {
  verification_id: string;
  claim_text: string;
  verdict: string;
  confidence_score: number;
  summary: string;
  similarity: number;
}

// Feed/Threat Types
export interface FeedSource {
  name: string;
  url: string;
}

export interface FeedItem {
  id: string;
  topic: string;
  claim_summary: string;
  intensity: 'low' | 'medium' | 'high';
  language: string;
  first_seen: string;
  last_updated: string;
  graph_centrality_score: number;
  source_count: number;
  sources: FeedSource[];
}

// Vaccine Digest Types
export interface VaccineClaim {
  rank: number;
  lie: string;
  truth: string;
  why_it_matters: string;
  spread_velocity: string;
  regions_affected: string[];
  sources_debunked: string[];
}

export interface VaccineDigest {
  id: string;
  week_start: string;
  week_end: string;
  generated_at: string;
  view_count: number;
  claims: VaccineClaim[];
}

// Regional Claims Types
export interface RegionalClaim {
  claim_id: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  country: string;
  region: string;
  location_confidence: string;
  virality_score: number;
  language: string;
  published_at: string;
  last_updated: string;
}

// Scam Report Types
export interface ScamReportRequest {
  title: string;
  description: string;
  evidence_urls?: string[];
}

export interface ScamReportResponse {
  id: string;
  title: string;
  description: string;
  evidence_urls: string[];
  status: 'pending' | 'reviewing' | 'verified' | 'dismissed';
  created_at: string;
}

// API Status Types
export interface HealthStatus {
  status: string;
  timestamp?: string;
}
