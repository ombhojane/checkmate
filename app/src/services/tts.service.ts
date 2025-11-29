import { Platform } from 'react-native';

// Dynamic import to prevent errors when native module is not available
let Tts: any = null;

// Check if TTS is available
const checkTtsAvailable = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TtsModule = require('react-native-tts').default;
    if (TtsModule && typeof TtsModule.setDefaultLanguage === 'function') {
      Tts = TtsModule;
      return true;
    }
  } catch (e) {
    // Silently fail - TTS not available
  }
  return false;
};

interface TTSConfig {
  defaultLanguage?: string;
  defaultRate?: number;
  defaultPitch?: number;
  ducking?: boolean;
}

class TTSService {
  private initialized: boolean = false;
  private enabled: boolean = true;
  private currentRate: number = 0.5;
  private currentPitch: number = 1.0;
  private currentLanguage: string = 'en-US';
  private isAvailable: boolean = false;

  constructor() {
    // Check availability on construction
    this.isAvailable = checkTtsAvailable();
    if (this.isAvailable) {
      this.setupListeners();
    }
  }

  private setupListeners() {
    if (!this.isAvailable || !Tts) return;

    try {
      Tts.addEventListener('tts-start', () => {
        console.log('[TTS] Speech started');
      });

      Tts.addEventListener('tts-finish', () => {
        console.log('[TTS] Speech finished');
      });

      Tts.addEventListener('tts-cancel', () => {
        console.log('[TTS] Speech cancelled');
      });
    } catch (error) {
      // Silent fail - listeners not critical
      this.isAvailable = false;
    }
  }

  async init(config: TTSConfig = {}) {
    if (this.initialized) return;

    // Re-check availability
    if (!this.isAvailable) {
      this.isAvailable = checkTtsAvailable();
    }

    if (!this.isAvailable || !Tts) {
      // Silent fail - TTS not available in this environment (e.g., Expo Go)
      console.log('[TTS] Not available in this environment');
      return;
    }

    try {
      const {
        defaultLanguage = 'en-US',
        defaultRate = 0.5,
        defaultPitch = 1.0,
        ducking = true,
      } = config;

      this.currentLanguage = defaultLanguage;
      this.currentRate = defaultRate;
      this.currentPitch = defaultPitch;

      await Tts.setDefaultLanguage(defaultLanguage);
      await Tts.setDefaultRate(defaultRate);
      await Tts.setDefaultPitch(defaultPitch);

      if (Platform.OS === 'ios') {
        await Tts.setDucking(ducking);
      }

      // Get available voices
      const voices = await Tts.voices();
      console.log('[TTS] Available voices:', voices?.length || 0);

      this.initialized = true;
      console.log('[TTS] Initialized successfully');
    } catch (error) {
      // Silent fail - don't spam console with errors in Expo Go
      this.isAvailable = false;
    }
  }

  async speak(text: string, options: { interrupt?: boolean; queue?: boolean } = {}) {
    if (!text || !this.enabled) return;
    
    if (!this.isAvailable || !Tts) {
      // Silent fail - TTS not available
      return;
    }

    try {
      const { interrupt = false } = options;

      if (interrupt) {
        await this.stop();
      }

      await Tts.speak(text);
      console.log('[TTS] Speaking:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    } catch (error) {
      // Silent fail
      this.isAvailable = false;
    }
  }

  async stop() {
    if (!this.isAvailable || !Tts) {
      return;
    }

    try {
      await Tts.stop();
    } catch (error) {
      // Silent fail
      this.isAvailable = false;
    }
  }

  async setRate(rate: number) {
    if (!this.isAvailable || !Tts) {
      return;
    }

    try {
      this.currentRate = rate;
      await Tts.setDefaultRate(rate);
    } catch (error) {
      // Silent fail
      this.isAvailable = false;
    }
  }

  async setPitch(pitch: number) {
    if (!this.isAvailable || !Tts) {
      return;
    }

    try {
      this.currentPitch = pitch;
      await Tts.setDefaultPitch(pitch);
    } catch (error) {
      // Silent fail
      this.isAvailable = false;
    }
  }

  async setLanguage(language: string) {
    if (!this.isAvailable || !Tts) {
      return;
    }

    try {
      this.currentLanguage = language;
      await Tts.setDefaultLanguage(language);
    } catch (error) {
      // Silent fail
      this.isAvailable = false;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isTtsAvailable(): boolean {
    return this.isAvailable;
  }

  getConfig() {
    return {
      language: this.currentLanguage,
      rate: this.currentRate,
      pitch: this.currentPitch,
      enabled: this.enabled,
      available: this.isAvailable,
    };
  }

  async getVoices() {
    if (!this.isAvailable || !Tts) {
      return [];
    }

    try {
      return await Tts.voices();
    } catch (error) {
      // Silent fail
      this.isAvailable = false;
      return [];
    }
  }

  // Utility method for announcing screen changes
  async announceScreenChange(screenName: string) {
    if (!this.isAvailable) return;
    await this.speak(`Navigated to ${screenName} screen`, { interrupt: true });
  }

  // Utility method for announcing action results
  async announceActionResult(result: string, isSuccess: boolean) {
    if (!this.isAvailable) return;
    const prefix = isSuccess ? 'Success' : 'Error';
    await this.speak(`${prefix}. ${result}`, { interrupt: true });
  }

  // Utility method for reading notifications
  async readNotification(title: string, body: string) {
    const text = `Notification. ${title}. ${body}`;
    await this.speak(text, { interrupt: false, queue: true });
  }

  // Utility method for reading alert details
  async readAlert(severity: string, title: string, description: string) {
    const severityText = severity === 'critical' ? 'Critical alert' : `${severity} priority alert`;
    const text = `${severityText}. ${title}. ${description}`;
    await this.speak(text, { interrupt: false });
  }

  destroy() {
    if (Tts && typeof Tts.removeAllListeners === 'function') {
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
    }
    this.initialized = false;
  }
}

// Export singleton instance
export const ttsService = new TTSService();
export default ttsService;
