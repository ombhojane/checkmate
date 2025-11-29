import { Platform, Linking, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

export interface PermissionStatus {
  camera: boolean;
  microphone: boolean;
  mediaLibrary: boolean;
  overlay: boolean;
}

class PermissionsService {
  private permissionStatus: PermissionStatus = {
    camera: false,
    microphone: false,
    mediaLibrary: false,
    overlay: false,
  };

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      this.permissionStatus.camera = status === 'granted';
      
      if (status !== 'granted') {
        this.showPermissionDeniedAlert('Camera', 'take photos and scan content');
      }
      
      return this.permissionStatus.camera;
    } catch (error) {
      console.error('[Permissions] Camera permission error:', error);
      return false;
    }
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      this.permissionStatus.microphone = status === 'granted';
      
      if (status !== 'granted') {
        this.showPermissionDeniedAlert('Microphone', 'use voice commands');
      }
      
      return this.permissionStatus.microphone;
    } catch (error) {
      console.error('[Permissions] Microphone permission error:', error);
      return false;
    }
  }

  /**
   * Request media library permission
   */
  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      this.permissionStatus.mediaLibrary = status === 'granted';
      
      if (status !== 'granted') {
        this.showPermissionDeniedAlert('Photo Library', 'select images for verification');
      }
      
      return this.permissionStatus.mediaLibrary;
    } catch (error) {
      console.error('[Permissions] Media library permission error:', error);
      return false;
    }
  }

  /**
   * Check and request overlay permission (Android only)
   * This is required for "Draw Over Other Apps" / screen capture functionality
   */
  async requestOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      // iOS doesn't have this permission concept
      this.permissionStatus.overlay = true;
      return true;
    }

    try {
      // On Android, we need to check if SYSTEM_ALERT_WINDOW is granted
      // This requires opening system settings as it can't be granted programmatically
      const { canAskAgain, status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      // For overlay, we need to guide users to settings
      // The actual check requires native code, so we'll show a prompt
      return new Promise((resolve) => {
        Alert.alert(
          'Screen Capture Permission',
          'To enable real-time screen monitoring, CheckMate needs "Display over other apps" permission.\n\nThis allows the app to analyze content on your screen for potential threats.',
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: () => {
                this.permissionStatus.overlay = false;
                resolve(false);
              },
            },
            {
              text: 'Open Settings',
              onPress: async () => {
                await this.openOverlaySettings();
                // We can't know if user actually granted it, assume they did
                this.permissionStatus.overlay = true;
                resolve(true);
              },
            },
          ],
        );
      });
    } catch (error) {
      console.error('[Permissions] Overlay permission error:', error);
      return false;
    }
  }

  /**
   * Open Android overlay permission settings
   */
  async openOverlaySettings(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        // Try to open the specific overlay settings
        await Linking.openSettings();
      } catch (error) {
        console.error('[Permissions] Failed to open settings:', error);
        // Fallback to general settings
        await Linking.openURL('package:com.checkmate.app');
      }
    }
  }

  /**
   * Request all permissions needed for full functionality
   */
  async requestAllPermissions(): Promise<PermissionStatus> {
    await Promise.all([
      this.requestCameraPermission(),
      this.requestMicrophonePermission(),
      this.requestMediaLibraryPermission(),
    ]);

    return this.permissionStatus;
  }

  /**
   * Check all permission statuses without requesting
   */
  async checkAllPermissions(): Promise<PermissionStatus> {
    try {
      const [cameraStatus, micStatus, mediaStatus] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        Audio.getPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(),
      ]);

      this.permissionStatus = {
        camera: cameraStatus.status === 'granted',
        microphone: micStatus.status === 'granted',
        mediaLibrary: mediaStatus.status === 'granted',
        overlay: Platform.OS !== 'android', // Can't check programmatically on Android
      };

      return this.permissionStatus;
    } catch (error) {
      console.error('[Permissions] Check permissions error:', error);
      return this.permissionStatus;
    }
  }

  /**
   * Get current permission status
   */
  getStatus(): PermissionStatus {
    return { ...this.permissionStatus };
  }

  /**
   * Show alert for denied permission
   */
  private showPermissionDeniedAlert(permissionName: string, purpose: string): void {
    Alert.alert(
      `${permissionName} Access Required`,
      `CheckMate needs ${permissionName.toLowerCase()} access to ${purpose}. Please enable it in your device settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  }

  /**
   * Open app settings
   */
  async openAppSettings(): Promise<void> {
    await Linking.openSettings();
  }
}

export const permissionsService = new PermissionsService();
export default permissionsService;
