// This file provides the structure for Android native notification listener
// To implement in a bare React Native project, these files should be added to:
// android/app/src/main/java/com/checkmate/notifications/

/*
 * MyNotificationListenerService.kt
 * 
 * Place at: android/app/src/main/java/com/checkmate/notifications/MyNotificationListenerService.kt
 */

/*
package com.checkmate.notifications

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.content.Intent
import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Locale

class MyNotificationListenerService : NotificationListenerService(), TextToSpeech.OnInitListener {
    private lateinit var tts: TextToSpeech
    private var ttsReady: Boolean = false
    private lateinit var prefs: SharedPreferences

    companion object {
        private const val PREFS_NAME = "NotificationListenerPrefs"
        private const val KEY_TTS_ENABLED = "tts_enabled"
        private const val KEY_WHITELIST = "whitelist"
    }

    override fun onCreate() {
        super.onCreate()
        tts = TextToSpeech(this, this)
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        try {
            val pkg = sbn.packageName
            val notif = sbn.notification
            val extras: Bundle = notif.extras

            val title = extras.getString("android.title") ?: ""
            val text = extras.getCharSequence("android.text")?.toString() ?: ""
            
            // Skip empty notifications
            if (title.isEmpty() && text.isEmpty()) return

            // Check if package is in whitelist
            val whitelist = getWhitelist()
            val shouldSpeak = whitelist.isEmpty() || whitelist.contains(pkg)

            // Prepare notification data
            val notificationData = Arguments.createMap().apply {
                putString("package", pkg)
                putString("title", title)
                putString("text", text)
                putDouble("time", sbn.postTime.toDouble())
                putString("id", sbn.key)
            }

            // Send event to React Native
            sendEventToReactNative("NotificationPosted", notificationData)

            // Speak via TTS if enabled and whitelisted
            val ttsEnabled = prefs.getBoolean(KEY_TTS_ENABLED, false)
            if (ttsReady && ttsEnabled && shouldSpeak) {
                val full = "$title. $text"
                tts.speak(full, TextToSpeech.QUEUE_ADD, null, "notif_${sbn.id}")
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        try {
            val notificationData = Arguments.createMap().apply {
                putString("package", sbn.packageName)
                putString("id", sbn.key)
            }
            sendEventToReactNative("NotificationRemoved", notificationData)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts.setLanguage(Locale.US)
            ttsReady = result != TextToSpeech.LANG_MISSING_DATA && 
                      result != TextToSpeech.LANG_NOT_SUPPORTED
            
            if (ttsReady) {
                tts.setSpeechRate(0.9f)
            }
        }
    }

    override fun onDestroy() {
        if (::tts.isInitialized) {
            tts.stop()
            tts.shutdown()
        }
        super.onDestroy()
    }

    private fun sendEventToReactNative(eventName: String, params: WritableMap) {
        try {
            // This requires getting the React context
            // In a full implementation, you'd store a reference to ReactApplicationContext
            // and use it here to emit events
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun getWhitelist(): Set<String> {
        val whitelistStr = prefs.getString(KEY_WHITELIST, "") ?: ""
        return if (whitelistStr.isEmpty()) {
            emptySet()
        } else {
            whitelistStr.split(",").toSet()
        }
    }

    fun setTTSEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_TTS_ENABLED, enabled).apply()
    }

    fun setWhitelist(packages: Set<String>) {
        val whitelistStr = packages.joinToString(",")
        prefs.edit().putString(KEY_WHITELIST, whitelistStr).apply()
    }
}
*/

export const ANDROID_NOTIFICATION_LISTENER_CODE = `
// Add this service to AndroidManifest.xml inside <application> tag:

<service android:name=".notifications.MyNotificationListenerService"
    android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.service.notification.NotificationListenerService" />
    </intent-filter>
</service>

// Add permissions to AndroidManifest.xml:

<uses-permission android:name="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE" 
    tools:ignore="ProtectedPermissions" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
`;

export default ANDROID_NOTIFICATION_LISTENER_CODE;
