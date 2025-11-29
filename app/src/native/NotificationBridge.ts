// This file provides the structure for the React Native bridge module
// To implement in a bare React Native project, these files should be added to:
// android/app/src/main/java/com/checkmate/notifications/

/*
 * NotificationBridgeModule.kt
 * 
 * Place at: android/app/src/main/java/com/checkmate/notifications/NotificationBridgeModule.kt
 */

/*
package com.checkmate.notifications

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NotificationBridgeModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NotificationBridge"
    }

    @ReactMethod
    fun openNotificationSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to open notification settings", e)
        }
    }

    @ReactMethod
    fun isNotificationServiceEnabled(promise: Promise) {
        try {
            val enabledListeners = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                "enabled_notification_listeners"
            )
            val packageName = reactApplicationContext.packageName
            val isEnabled = enabledListeners?.contains(packageName) == true
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to check notification service status", e)
        }
    }

    @ReactMethod
    fun setTTSEnabled(enabled: Boolean, promise: Promise) {
        try {
            // Store preference that the service will read
            val prefs = reactApplicationContext.getSharedPreferences(
                "NotificationListenerPrefs",
                android.content.Context.MODE_PRIVATE
            )
            prefs.edit().putBoolean("tts_enabled", enabled).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to set TTS preference", e)
        }
    }

    @ReactMethod
    fun setNotificationWhitelist(packages: ReadableArray, promise: Promise) {
        try {
            val packageList = mutableListOf<String>()
            for (i in 0 until packages.size()) {
                packages.getString(i)?.let { packageList.add(it) }
            }
            
            val prefs = reactApplicationContext.getSharedPreferences(
                "NotificationListenerPrefs",
                android.content.Context.MODE_PRIVATE
            )
            val whitelistStr = packageList.joinToString(",")
            prefs.edit().putString("whitelist", whitelistStr).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to set whitelist", e)
        }
    }

    fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
*/

/*
 * NotificationBridgePackage.kt
 * 
 * Place at: android/app/src/main/java/com/checkmate/notifications/NotificationBridgePackage.kt
 */

/*
package com.checkmate.notifications

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class NotificationBridgePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): 
        List<NativeModule> {
        return listOf(NotificationBridgeModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): 
        List<ViewManager<*, *>> {
        return emptyList()
    }
}
*/

// TypeScript interface for the native module
import { NativeModules, NativeEventEmitter, EmitterSubscription, Platform } from 'react-native';

interface NotificationEvent {
  package: string;
  title: string;
  text: string;
  time: number;
  id: string;
}

interface NotificationBridgeInterface {
  openNotificationSettings(): Promise<boolean>;
  isNotificationServiceEnabled(): Promise<boolean>;
  setTTSEnabled(enabled: boolean): Promise<boolean>;
  setNotificationWhitelist(packages: string[]): Promise<boolean>;
}

class NotificationBridge {
  private module: NotificationBridgeInterface | null = null;
  private emitter: NativeEventEmitter | null = null;
  private listeners: EmitterSubscription[] = [];

  constructor() {
    if (Platform.OS === 'android') {
      this.module = NativeModules.NotificationBridge;
      if (this.module) {
        this.emitter = new NativeEventEmitter(NativeModules.NotificationBridge);
      }
    }
  }

  async openNotificationSettings(): Promise<boolean> {
    if (!this.module) {
      console.warn('[NotificationBridge] Module not available');
      return false;
    }

    try {
      return await this.module.openNotificationSettings();
    } catch (error) {
      console.error('[NotificationBridge] Open settings error:', error);
      return false;
    }
  }

  async isNotificationServiceEnabled(): Promise<boolean> {
    if (!this.module) {
      return false;
    }

    try {
      return await this.module.isNotificationServiceEnabled();
    } catch (error) {
      console.error('[NotificationBridge] Check status error:', error);
      return false;
    }
  }

  async setTTSEnabled(enabled: boolean): Promise<boolean> {
    if (!this.module) {
      return false;
    }

    try {
      return await this.module.setTTSEnabled(enabled);
    } catch (error) {
      console.error('[NotificationBridge] Set TTS error:', error);
      return false;
    }
  }

  async setNotificationWhitelist(packages: string[]): Promise<boolean> {
    if (!this.module) {
      return false;
    }

    try {
      return await this.module.setNotificationWhitelist(packages);
    } catch (error) {
      console.error('[NotificationBridge] Set whitelist error:', error);
      return false;
    }
  }

  onNotificationPosted(callback: (event: NotificationEvent) => void): EmitterSubscription | null {
    if (!this.emitter) {
      return null;
    }

    const subscription = this.emitter.addListener('NotificationPosted', callback);
    this.listeners.push(subscription);
    return subscription;
  }

  onNotificationRemoved(callback: (event: { package: string; id: string }) => void): EmitterSubscription | null {
    if (!this.emitter) {
      return null;
    }

    const subscription = this.emitter.addListener('NotificationRemoved', callback);
    this.listeners.push(subscription);
    return subscription;
  }

  removeAllListeners() {
    this.listeners.forEach((listener) => listener.remove());
    this.listeners = [];
  }

  isAvailable(): boolean {
    return Platform.OS === 'android' && this.module !== null;
  }
}

// Export singleton instance
export const notificationBridge = new NotificationBridge();
export default notificationBridge;

// Instructions for implementation
export const NOTIFICATION_BRIDGE_SETUP = `
SETUP INSTRUCTIONS FOR BARE REACT NATIVE:

1. Create the Kotlin files in android/app/src/main/java/com/checkmate/notifications/
   - MyNotificationListenerService.kt
   - NotificationBridgeModule.kt
   - NotificationBridgePackage.kt

2. Register the package in MainApplication.kt:

   import com.checkmate.notifications.NotificationBridgePackage

   override fun getPackages(): List<ReactPackage> {
       return PackageList(this).packages.apply {
           add(NotificationBridgePackage())
       }
   }

3. Update AndroidManifest.xml (see NotificationListener.android.ts)

4. Run: npx react-native run-android

FOR EXPO:
This requires ejecting to bare workflow or creating a custom development build.
Use 'npx expo prebuild' to generate native code.
`;
