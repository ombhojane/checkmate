export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  region: string;
  language: string;
  createdAt: string;
}

export interface VerificationRequest {
  type: 'text' | 'image' | 'url' | 'voice';
  content: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface VerificationResult {
  id: string;
  score: number;
  verdict: 'false' | 'partial' | 'verified';
  analysis: string;
  sources: Source[];
  createdAt: string;
  request: VerificationRequest;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  favicon?: string;
}

export interface Threat {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category: 'scam' | 'phishing' | 'deepfake' | 'misinformation';
  region: string;
  timestamp: string;
}

export interface HistoryItem {
  id: string;
  score: number;
  verdict: 'false' | 'partial' | 'verified';
  title: string;
  timestamp: string;
}

// New types for CheckmateAI API
export interface FeedItem {
  id: string;
  title: string;
  description: string;
  intensity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  topic: string;
  timestamp: string;
  source?: string;
  region?: string;
}

export interface TrendingThreat {
  id: string;
  title: string;
  description: string;
  intensity: string;
  trendScore: number;
  timestamp: string;
}

export interface TrendingTopic {
  topic: string;
  count: number;
  trending: boolean;
}

export interface VaccineDigest {
  id: string;
  title: string;
  summary: string;
  content: string;
  generatedAt: string;
  topics: string[];
}

export interface VerificationResponse {
  id: string;
  claim: string;
  verdict: 'false' | 'partial' | 'verified';
  confidence: number;
  analysis: string;
  sources: Array<{ name: string; url: string; reliability: number }>;
  similarClaims?: Array<{ id: string; claim: string; verdict: string }>;
  createdAt: string;
}

export interface SimilarClaim {
  id: string;
  claim: string;
  verdict: string;
  similarity: number;
}

export interface ApiStatus {
  status: string;
  version: string;
  uptime: number;
  timestamp: string;
}

export type RootStackParamList = {
  Main: undefined;
  VerificationResult: { verificationId: string };
  ThreatDetail: { threatId: string };
};

export type BottomTabParamList = {
  Verify: undefined;
  Alerts: undefined;
  History: undefined;
  Profile: undefined;
};
