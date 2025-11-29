/**
 * Voice Service - Mock Implementation
 * Voice recognition is disabled until @react-native-voice/voice compatibility is resolved
 */

interface VoiceResult {
  text: string;
  confidence?: number;
}

interface VoiceIntent {
  intent: string;
  text: string;
  params?: { [key: string]: any };
}

type VoiceEventCallback = (result: VoiceResult) => void;
type VoiceErrorCallback = (error: any) => void;
type VoiceIntentCallback = (intent: VoiceIntent) => void;

class VoiceService {
  private initialized: boolean = false;
  private listening: boolean = false;
  private available: boolean = false;
  private onResultCallback?: VoiceEventCallback;
  private onErrorCallback?: VoiceErrorCallback;
  private onIntentCallback?: VoiceIntentCallback;

  async init() {
    if (this.initialized) return;
    console.log("[Voice] Voice service disabled - native module not available");
    this.available = false;
    this.initialized = true;
  }

  isAvailable(): boolean {
    return this.available;
  }

  isListening(): boolean {
    return this.listening;
  }

  onResult(callback: VoiceEventCallback) {
    this.onResultCallback = callback;
  }

  onError(callback: VoiceErrorCallback) {
    this.onErrorCallback = callback;
  }

  onIntent(callback: VoiceIntentCallback) {
    this.onIntentCallback = callback;
  }

  async startListening(): Promise<boolean> {
    console.warn("[Voice] Voice recognition not available");
    return false;
  }

  async stopListening(): Promise<void> {
    this.listening = false;
  }

  async cancel(): Promise<void> {
    this.listening = false;
  }

  destroy() {
    this.initialized = false;
    this.listening = false;
    this.onResultCallback = undefined;
    this.onErrorCallback = undefined;
    this.onIntentCallback = undefined;
  }

  parseCommand(text: string): VoiceIntent | null {
    const lowerText = text.toLowerCase().trim();
    
    if (lowerText.includes("verify") || lowerText.includes("check")) {
      const query = lowerText.replace(/verify|check|is|true|false|fact/gi, "").trim();
      if (query) {
        return { intent: "verify_claim", text: lowerText, params: { query } };
      }
    }

    if (lowerText.includes("go to") || lowerText.includes("open") || lowerText.includes("show")) {
      const screens = ["home", "verify", "alerts", "history", "profile", "settings", "community"];
      for (const screen of screens) {
        if (lowerText.includes(screen)) {
          return { intent: "navigate", text: lowerText, params: { screen } };
        }
      }
    }

    if (lowerText.includes("help")) {
      return { intent: "help", text: lowerText };
    }

    return null;
  }
}

const voiceService = new VoiceService();
export default voiceService;

