import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

// ============================================
// API Response Types (matching actual API)
// ============================================

// Verification Types
export interface VerifyResponse {
  verification_id: string;
  verdict: string;
  confidence: number;
  summary: string;
  detailed_analysis: string;
  intensity: 'low' | 'medium' | 'high';
  sources: SourceInfo[];
  processing_time_ms: number;
}

export interface SourceInfo {
  url: string;
  title: string;
  snippet: string;
  credibility_score: number;
}

export interface VerificationHistoryItem {
  id: string;
  claim_text: string;
  verdict: string;
  confidence_score: number;
  summary: string;
  intensity: string;
  language: string;
  created_at: string;
}

export interface SimilarClaimResponse {
  verification_id: string;
  claim_text: string;
  verdict: string;
  confidence_score: number;
  summary: string;
  similarity: number;
}

// Feed Types
export interface FeedItem {
  id: string;
  topic: string;
  claim_summary: string;
  intensity: 'low' | 'medium' | 'high';
  language: string;
  source_count: number;
  sources: Array<{ name: string; url: string }>;
  graph_centrality_score: number;
  first_seen: string;
  last_updated: string;
}

export interface TrendingTopic {
  topic: string;
  count: number;
}

// Vaccine Types
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

export interface LegacyVaccineResponse {
  week_of: string;
  trends: Array<{
    lie: string;
    truth: string;
    why_it_matters: string;
  }>;
}

// ============================================
// Configuration
// ============================================

const AUTH_BASE_URL = process.env.EXPO_PUBLIC_AUTH_URL || 'http://192.168.16.57:3000/api/v1';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.16.57:8000/api';

const TOKEN_KEY = '@checkmate_token';
const REFRESH_TOKEN_KEY = '@checkmate_refresh_token';

// ============================================
// API Service Class
// ============================================

class ApiService {
  private client: AxiosInstance;
  private authClient: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.authClient = axios.create({
      baseURL: AUTH_BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    const addToken = async (config: InternalAxiosRequestConfig) => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    };

    this.client.interceptors.request.use(addToken, (e) => Promise.reject(e));
    this.authClient.interceptors.request.use(addToken, (e) => Promise.reject(e));

    const handle401 = async (error: AxiosError) => {
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
      }
      return Promise.reject(error);
    };

    this.client.interceptors.response.use((r) => r, handle401);
    this.authClient.interceptors.response.use((r) => r, handle401);
  }

  // ============================================
  // Auth Methods (Node.js Backend - port 3000)
  // ============================================

  async login(email: string, password: string) {
    const response = await this.authClient.post('/auth/login', { email, password });
    const data = response.data.data || response.data;
    
    if (data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken || data.token);
    }
    
    return {
      token: data.token,
      refreshToken: data.refreshToken || data.token,
      user: data.user || { id: 'unknown', name: 'User', email },
    };
  }

  async register(name: string, email: string, password: string) {
    const response = await this.authClient.post('/auth/register', { name, email, password });
    const data = response.data.data || response.data;
    
    if (data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken || data.token);
    }
    
    return {
      token: data.token,
      refreshToken: data.refreshToken || data.token,
      user: data.user || { id: 'unknown', name, email },
    };
  }

  async logout() {
    try {
      await this.authClient.post('/auth/logout');
    } finally {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.authClient.get('/auth/profile');
    return response.data.data || response.data;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  }

  // ============================================
  // Verification Endpoints (CheckmateAI - port 8000)
  // ============================================

  async verifyClaim(text: string, imageBase64?: string, language: string = 'en'): Promise<VerifyResponse> {
    const body: any = { text, language };
    if (imageBase64) body.image_base64 = imageBase64;
    const response = await this.client.post('/verify', body);
    return response.data;
  }

  async verifyImage(imageUri: string, language: string = 'en'): Promise<VerifyResponse> {
    // Convert image URI to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64Data = result.split(',')[1] || result;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    return this.verifyClaim('Image verification request', base64, language);
  }

  async getVerificationHistory(limit: number = 20, offset: number = 0): Promise<VerificationHistoryItem[]> {
    const response = await this.client.get('/verify/history', { params: { limit, offset } });
    return response.data || [];
  }

  async getVerificationById(verificationId: string): Promise<VerifyResponse> {
    const response = await this.client.get(`/verify/${verificationId}`);
    return response.data;
  }

  async getSimilarClaims(verificationId: string, limit: number = 5): Promise<SimilarClaimResponse[]> {
    const response = await this.client.get(`/verify/similar/${verificationId}`, { params: { limit } });
    return response.data || [];
  }

  // ============================================
  // Feed Endpoints
  // ============================================

  async getFeed(limit: number = 10, intensity?: string): Promise<FeedItem[]> {
    const params: any = { limit };
    if (intensity) params.intensity = intensity;
    const response = await this.client.get('/feed', { params });
    return response.data || [];
  }

  async getFeedByIntensity(level: 'low' | 'medium' | 'high', limit: number = 10): Promise<FeedItem[]> {
    const response = await this.client.get(`/feed/intensity/${level}`, { params: { limit } });
    return response.data || [];
  }

  async getTrendingThreats(limit: number = 5): Promise<FeedItem[]> {
    const response = await this.client.get('/feed/trending', { params: { limit } });
    return response.data || [];
  }

  async getTrendingTopics(limit: number = 10): Promise<TrendingTopic[]> {
    const response = await this.client.get('/feed/topics', { params: { limit } });
    const data = response.data;
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch { return []; }
    }
    return data || [];
  }

  async refreshFeed(): Promise<string> {
    const response = await this.client.post('/feed/refresh');
    return response.data;
  }

  // ============================================
  // Vaccine Endpoints
  // ============================================

  async getLatestVaccine(): Promise<VaccineDigest | null> {
    try {
      const response = await this.client.get('/vaccine/latest');
      return response.data;
    } catch {
      return null;
    }
  }

  async getVaccineArchive(limit: number = 10, offset: number = 0): Promise<VaccineDigest[]> {
    const response = await this.client.get('/vaccine/archive', { params: { limit, offset } });
    return response.data || [];
  }

  async triggerVaccineGeneration(language: string = 'en'): Promise<string> {
    const response = await this.client.post('/vaccine/trigger-now', null, { params: { language } });
    return response.data;
  }

  async getVaccineLegacy(): Promise<LegacyVaccineResponse | null> {
    try {
      const response = await this.client.get('/vaccine/legacy');
      return response.data;
    } catch {
      return null;
    }
  }

  // ============================================
  // Health Check
  // ============================================

  async healthCheck(): Promise<boolean> {
    try {
      const baseUrl = API_BASE_URL.replace('/api', '');
      await axios.get(`${baseUrl}/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
