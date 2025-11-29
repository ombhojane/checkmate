import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { apiService } from './api.service';

interface ScreenCaptureConfig {
  intervalMs?: number;
  quality?: number;
  format?: 'jpg' | 'png';
  maxWidth?: number;
  enabled?: boolean;
}

interface AnalysisResult {
  id: string;
  timestamp: number;
  threats: ThreatDetection[];
  summary: string;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

interface ThreatDetection {
  type: 'deepfake' | 'misinformation' | 'scam' | 'phishing' | 'manipulation';
  confidence: number;
  description: string;
  region?: { x: number; y: number; width: number; height: number };
}

// Dynamic imports for packages that need to be installed
let captureScreen: any = null;
let captureRef: any = null;

// Try to load optional dependencies
const loadDependencies = async () => {
  try {
    const viewShot = await import('react-native-view-shot');
    captureScreen = viewShot.captureScreen;
    captureRef = viewShot.captureRef;
  } catch (e) {
    console.warn('[ScreenCapture] react-native-view-shot not available');
  }
};

// Load on import
loadDependencies();

class ScreenCaptureService {
  private isCapturing: boolean = false;
  private captureInterval: NodeJS.Timeout | null = null;
  private config: ScreenCaptureConfig = {
    intervalMs: 3000, // Capture every 3 seconds
    quality: 0.7,
    format: 'jpg',
    maxWidth: 720,
    enabled: false,
  };
  private onAnalysisCallback: ((result: AnalysisResult) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private onStatusCallback: ((status: string) => void) | null = null;
  private captureCount: number = 0;
  private lastAnalysisTime: number = 0;
  private isAvailable: boolean = false;

  constructor() {
    this.checkAvailability();
  }

  /**
   * Check if screen capture is available
   */
  private async checkAvailability() {
    await loadDependencies();
    this.isAvailable = captureScreen !== null;
    if (!this.isAvailable) {
      console.warn('[ScreenCapture] Screen capture not available - missing dependencies');
    }
  }

  /**
   * Request screen capture permission
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn('[ScreenCapture] Not available');
      return false;
    }

    try {
      if (Platform.OS === 'android') {
        // Android requires media projection permission for screen capture
        // This is handled by the native module when available
        // For now, we use view-shot which doesn't need special permissions
        return true;
      } else if (Platform.OS === 'ios') {
        // iOS doesn't allow screen recording without user consent
        // We'll use view-shot for capturing views instead
        return true;
      }
      return false;
    } catch (error) {
      console.error('[ScreenCapture] Permission error:', error);
      return false;
    }
  }

  /**
   * Configure the screen capture service
   */
  configure(config: Partial<ScreenCaptureConfig>) {
    this.config = { ...this.config, ...config };
    console.log('[ScreenCapture] Configuration updated:', this.config);
  }

  /**
   * Start continuous screen capture and analysis
   */
  async startCapturing(viewRef?: any): Promise<boolean> {
    if (!this.isAvailable) {
      this.onErrorCallback?.(new Error('Screen capture not available. Install required packages.'));
      return false;
    }

    if (this.isCapturing) {
      console.warn('[ScreenCapture] Already capturing');
      return false;
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      this.onErrorCallback?.(new Error('Screen capture permission denied'));
      return false;
    }

    this.isCapturing = true;
    this.captureCount = 0;
    this.onStatusCallback?.('started');
    console.log('[ScreenCapture] Started capturing');

    // Start capture interval
    this.captureInterval = setInterval(async () => {
      await this.captureAndAnalyze(viewRef);
    }, this.config.intervalMs);

    // Capture immediately
    await this.captureAndAnalyze(viewRef);

    return true;
  }

  /**
   * Stop continuous screen capture
   */
  stopCapturing() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    this.isCapturing = false;
    this.onStatusCallback?.('stopped');
    console.log('[ScreenCapture] Stopped capturing. Total captures:', this.captureCount);
  }

  /**
   * Capture screen and send to backend for analysis
   */
  private async captureAndAnalyze(viewRef?: any): Promise<void> {
    if (!this.isCapturing || !this.isAvailable) return;

    try {
      // Capture screen/view
      let imageUri: string;
      
      if (viewRef?.current && captureRef) {
        // Capture specific view reference
        imageUri = await captureRef(viewRef, {
          format: this.config.format,
          quality: this.config.quality,
          result: 'tmpfile',
        });
      } else if (captureScreen) {
        // Capture entire screen
        imageUri = await captureScreen({
          format: this.config.format,
          quality: this.config.quality,
          result: 'tmpfile',
        });
      } else {
        throw new Error('No capture method available');
      }

      this.captureCount++;
      console.log(`[ScreenCapture] Captured frame ${this.captureCount}`);

      // Convert to base64 for sending using new File API
      try {
        const file = new File(imageUri);
        const base64Image = await file.base64();

        // Send to backend for analysis
        await this.sendForAnalysis(base64Image);

        // Clean up temp file
        file.delete();
      } catch (fileError) {
        console.error('[ScreenCapture] File processing error:', fileError);
      }
    } catch (error) {
      console.error('[ScreenCapture] Capture error:', error);
      this.onErrorCallback?.(error as Error);
    }
  }

  /**
   * Send captured image to backend for AI analysis
   */
  private async sendForAnalysis(base64Image: string): Promise<void> {
    try {
      const now = Date.now();
      
      // Throttle analysis to prevent overwhelming the backend
      if (now - this.lastAnalysisTime < 2000) {
        console.log('[ScreenCapture] Throttling analysis request');
        return;
      }
      this.lastAnalysisTime = now;

      // Send to backend API
      const response = await (apiService as any).analyzeScreenCapture?.({
        image: base64Image,
        timestamp: now,
        platform: Platform.OS,
        captureNumber: this.captureCount,
      });

      if (response && response.threats && response.threats.length > 0) {
        const result: AnalysisResult = {
          id: response.id || `analysis-${now}`,
          timestamp: now,
          threats: response.threats,
          summary: response.summary || 'Analysis complete',
          riskLevel: response.riskLevel || 'none',
        };

        this.onAnalysisCallback?.(result);
        console.log('[ScreenCapture] Analysis result:', result.riskLevel);
      }
    } catch (error) {
      console.error('[ScreenCapture] Analysis error:', error);
      // Don't propagate analysis errors to user - just log them
    }
  }

  /**
   * Capture single screenshot for manual analysis
   */
  async captureOnce(viewRef?: any): Promise<string | null> {
    if (!this.isAvailable) {
      console.warn('[ScreenCapture] Not available');
      return null;
    }

    try {
      let imageUri: string;
      
      if (viewRef?.current && captureRef) {
        imageUri = await captureRef(viewRef, {
          format: this.config.format,
          quality: this.config.quality,
          result: 'tmpfile',
        });
      } else if (captureScreen) {
        imageUri = await captureScreen({
          format: this.config.format,
          quality: this.config.quality,
          result: 'tmpfile',
        });
      } else {
        throw new Error('No capture method available');
      }

      console.log('[ScreenCapture] Single capture complete');
      return imageUri;
    } catch (error) {
      console.error('[ScreenCapture] Single capture error:', error);
      return null;
    }
  }

  /**
   * Analyze a single image (from gallery or camera)
   */
  async analyzeImage(imageUri: string): Promise<AnalysisResult | null> {
    try {
      const file = new File(imageUri);
      const base64Image = await file.base64();

      const response = await (apiService as any).analyzeScreenCapture?.({
        image: base64Image,
        timestamp: Date.now(),
        platform: Platform.OS,
        captureNumber: 0,
        mode: 'single',
      });

      if (response) {
        return {
          id: response.id || `analysis-${Date.now()}`,
          timestamp: Date.now(),
          threats: response.threats || [],
          summary: response.summary || 'No threats detected',
          riskLevel: response.riskLevel || 'none',
        };
      }

      return null;
    } catch (error) {
      console.error('[ScreenCapture] Image analysis error:', error);
      throw error;
    }
  }

  /**
   * Register callback for analysis results
   */
  onAnalysis(callback: (result: AnalysisResult) => void) {
    this.onAnalysisCallback = callback;
  }

  /**
   * Register callback for errors
   */
  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback;
  }

  /**
   * Register callback for status changes
   */
  onStatus(callback: (status: string) => void) {
    this.onStatusCallback = callback;
  }

  /**
   * Check if currently capturing
   */
  isActive(): boolean {
    return this.isCapturing;
  }

  /**
   * Check if service is available
   */
  checkIsAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Get capture statistics
   */
  getStats() {
    return {
      isCapturing: this.isCapturing,
      captureCount: this.captureCount,
      config: this.config,
      isAvailable: this.isAvailable,
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopCapturing();
    this.onAnalysisCallback = null;
    this.onErrorCallback = null;
    this.onStatusCallback = null;
  }
}

// Export singleton instance
export const screenCaptureService = new ScreenCaptureService();
export default screenCaptureService;
export type { ScreenCaptureConfig, AnalysisResult, ThreatDetection };
