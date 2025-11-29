import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows, radius } from '@/theme';
import ttsService from '@/services/tts.service';
import voiceService from '@/services/voice.service';
import notificationService from '@/services/notification.service';
import notificationBridge from '@/native/NotificationBridge';

export default function AccessibilitySettingsScreen() {
  // TTS Settings
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsRate, setTtsRate] = useState(0.5);
  const [ttsPitch, setTtsPitch] = useState(1.0);

  // Voice Settings
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(true);

  // Notification Settings
  const [readNotificationsAloud, setReadNotificationsAloud] = useState(false);
  const [readOtherAppsNotifications, setReadOtherAppsNotifications] = useState(false);
  const [notificationListenerEnabled, setNotificationListenerEnabled] = useState(false);

  // Screen Reader Settings
  const [announceScreenChanges, setAnnounceScreenChanges] = useState(true);
  const [announceActionResults, setAnnounceActionResults] = useState(true);

  useEffect(() => {
    loadSettings();
    checkNotificationListenerStatus();
  }, []);

  const loadSettings = async () => {
    const ttsConfig = ttsService.getConfig();
    setTtsEnabled(ttsConfig.enabled);
    setTtsRate(ttsConfig.rate);
    setTtsPitch(ttsConfig.pitch);

    setReadNotificationsAloud(notificationService.isReadNotificationsAloudEnabled());
  };

  const checkNotificationListenerStatus = async () => {
    if (Platform.OS === 'android' && notificationBridge.isAvailable()) {
      const isEnabled = await notificationBridge.isNotificationServiceEnabled();
      setNotificationListenerEnabled(isEnabled);
    }
  };

  const handleTTSToggle = async (value: boolean) => {
    setTtsEnabled(value);
    ttsService.setEnabled(value);

    if (value) {
      await ttsService.speak('Text to speech enabled');
    }
  };

  const handleTTSRateChange = async (rate: number) => {
    setTtsRate(rate);
    await ttsService.setRate(rate);
    await ttsService.speak('Speaking at new rate');
  };

  const handleTTSPitchChange = async (pitch: number) => {
    setTtsPitch(pitch);
    await ttsService.setPitch(pitch);
    await ttsService.speak('Speaking at new pitch');
  };

  const handleVoiceCommandsToggle = async (value: boolean) => {
    setVoiceCommandsEnabled(value);

    if (value) {
      await voiceService.init();
      await ttsService.speak('Voice commands enabled');
    } else {
      await ttsService.speak('Voice commands disabled');
    }
  };

  const handleReadNotificationsToggle = async (value: boolean) => {
    setReadNotificationsAloud(value);
    notificationService.setReadNotificationsAloud(value);

    if (value) {
      await ttsService.speak('Will read notifications aloud');
    } else {
      await ttsService.speak('Stopped reading notifications aloud');
    }
  };

  const handleReadOtherAppsToggle = async (value: boolean) => {
    if (value && Platform.OS === 'android') {
      // Check if notification listener is enabled
      if (!notificationListenerEnabled) {
        Alert.alert(
          'Notification Access Required',
          'To read notifications from other apps, you need to grant notification access in your device settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: async () => {
                const success = await notificationBridge.openNotificationSettings();
                if (success) {
                  await ttsService.speak('Please enable CheckMate in notification access');
                }
              },
            },
          ]
        );
        return;
      }

      await notificationBridge.setTTSEnabled(true);
      setReadOtherAppsNotifications(true);
      await ttsService.speak('Will read notifications from other apps');
    } else {
      if (Platform.OS === 'android') {
        await notificationBridge.setTTSEnabled(false);
      }
      setReadOtherAppsNotifications(false);
      await ttsService.speak('Stopped reading other app notifications');
    }
  };

  const handleTestTTS = async () => {
    await ttsService.speak(
      'This is a test of the text to speech system. You can adjust the speed and pitch in the settings above.'
    );
  };

  const handleTestVoiceCommand = async () => {
    const isAvailable = await voiceService.isAvailable();
    if (!isAvailable) {
      Alert.alert('Voice Commands', 'Voice recognition is not available on this device');
      return;
    }

    await voiceService.speakCommands();
  };

  return (
    <SafeAreaView 
      style={styles.container}
      accessible={true}
      accessibilityLabel="Accessibility Settings"
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Accessibility</Text>
          <Text style={styles.subtitle}>
            Customize voice, speech, and notification features
          </Text>
        </View>

        {/* Text-to-Speech Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text-to-Speech</Text>

          <SettingRow
            icon="volume-high"
            title="Enable Text-to-Speech"
            description="Read screen content and notifications aloud"
            value={ttsEnabled}
            onValueChange={handleTTSToggle}
          />

          {ttsEnabled && (
            <>
              <SliderRow
                icon="speedometer"
                title="Speaking Rate"
                description={`Current: ${(ttsRate * 100).toFixed(0)}%`}
                value={ttsRate}
                minimumValue={0.1}
                maximumValue={1.0}
                onValueChange={handleTTSRateChange}
              />

              <SliderRow
                icon="musical-notes"
                title="Voice Pitch"
                description={`Current: ${(ttsPitch * 100).toFixed(0)}%`}
                value={ttsPitch}
                minimumValue={0.5}
                maximumValue={2.0}
                onValueChange={handleTTSPitchChange}
              />

              <TouchableOpacity
                style={styles.testButton}
                onPress={handleTestTTS}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Test text to speech"
                accessibilityHint="Plays a sample audio to test current settings"
              >
                <Ionicons name="play-circle" size={20} color={colors.blue} />
                <Text style={styles.testButtonText}>Test Voice</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Voice Commands Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Commands</Text>

          <SettingRow
            icon="mic"
            title="Enable Voice Commands"
            description="Control the app using voice"
            value={voiceCommandsEnabled}
            onValueChange={handleVoiceCommandsToggle}
          />

          {voiceCommandsEnabled && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestVoiceCommand}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View available commands"
              accessibilityHint="Lists all voice commands you can use"
            >
              <Ionicons name="list" size={20} color={colors.blue} />
              <Text style={styles.testButtonText}>Available Commands</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <SettingRow
            icon="notifications"
            title="Read App Notifications"
            description="Read CheckMate notifications aloud"
            value={readNotificationsAloud}
            onValueChange={handleReadNotificationsToggle}
          />

          {Platform.OS === 'android' && (
            <>
              <SettingRow
                icon="phone-portrait"
                title="Read Other App Notifications"
                description="Read notifications from all apps (Android only)"
                value={readOtherAppsNotifications}
                onValueChange={handleReadOtherAppsToggle}
              />

              {!notificationListenerEnabled && readOtherAppsNotifications && (
                <View style={styles.warningCard}>
                  <Ionicons name="warning" size={20} color={colors.amber} />
                  <Text style={styles.warningText}>
                    Notification access not granted. Tap "Read Other App Notifications" to enable.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Screen Reader Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Screen Reader</Text>

          <SettingRow
            icon="navigate"
            title="Announce Screen Changes"
            description="Announce when navigating to new screens"
            value={announceScreenChanges}
            onValueChange={setAnnounceScreenChanges}
          />

          <SettingRow
            icon="checkmark-circle"
            title="Announce Action Results"
            description="Announce success or failure of actions"
            value={announceActionResults}
            onValueChange={setAnnounceActionResults}
          />
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Ionicons name="information-circle" size={24} color={colors.blue} />
          <Text style={styles.helpText}>
            These accessibility features work best with TalkBack (Android) or VoiceOver (iOS) enabled.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingRowProps {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  description,
  value,
  onValueChange,
}) => {
  return (
    <View 
      style={styles.settingRow}
      accessible={true}
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color={colors.text} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.gray200, true: colors.greenLight }}
        thumbColor={value ? colors.green : colors.gray400}
        importantForAccessibility="no"
      />
    </View>
  );
};

interface SliderRowProps {
  icon: string;
  title: string;
  description: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange: (value: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  icon,
  title,
  description,
  value,
  minimumValue,
  maximumValue,
  onValueChange,
}) => {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={20} color={colors.textSecondary} />
        </View>
        <View style={styles.sliderTextContainer}>
          <Text style={styles.sliderTitle}>{title}</Text>
          <Text style={styles.sliderDescription}>{description}</Text>
        </View>
      </View>
      {/* Note: React Native Slider component would go here */}
      <View style={styles.sliderPlaceholder}>
        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => onValueChange(Math.max(minimumValue, value - 0.1))}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${title.toLowerCase()}`}
        >
          <Ionicons name="remove" size={20} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.sliderValueContainer}>
          <View
            style={[
              styles.sliderTrack,
              {
                width: `${
                  ((value - minimumValue) / (maximumValue - minimumValue)) * 100
                }%`,
              },
            ]}
          />
        </View>
        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => onValueChange(Math.min(maximumValue, value + 0.1))}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${title.toLowerCase()}`}
        >
          <Ionicons name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.base,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sliderRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sliderTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sliderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  sliderDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sliderPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderValueContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  sliderTrack: {
    height: '100%',
    backgroundColor: colors.blue,
    borderRadius: radius.full,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.blueLight,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.blue,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.amberLight,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.amber,
    lineHeight: 18,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.blueLight,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: colors.blue,
    lineHeight: 20,
  },
});
