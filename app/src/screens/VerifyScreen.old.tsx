import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  AccessibilityInfo,
  findNodeHandle,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows, radius } from '@/theme';
import ttsService from '@/services/tts.service';
import voiceService from '@/services/voice.service';

export default function VerifyScreen() {
  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Check if screen reader is enabled
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      setIsScreenReaderEnabled(enabled);
    });

    // Listen for screen reader state changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        setIsScreenReaderEnabled(enabled);
      }
    );

    // Initialize services
    initializeServices();

    // Setup voice command handler
    voiceService.onIntent(handleVoiceIntent);
    voiceService.onResult((result) => {
      setTextInput(result.text);
      ttsService.speak(`Text captured: ${result.text}`);
    });

    // Announce screen
    ttsService.announceScreenChange('Verify');

    return () => {
      subscription.remove();
      voiceService.destroy();
    };
  }, []);

  const initializeServices = async () => {
    try {
      await ttsService.init();
      await voiceService.init();
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  const handleVoiceIntent = async (intent: any) => {
    console.log('Voice intent:', intent);

    switch (intent.intent) {
      case 'verify_claim':
        if (intent.params?.query) {
          setTextInput(intent.params.query);
          await ttsService.speak('Text set. Do you want to verify this?');
        }
        break;
      case 'show_help':
        await voiceService.speakCommands();
        break;
      case 'cancel':
        await stopListening();
        break;
      default:
        await ttsService.speak('Command not recognized. Say help for available commands.');
    }
  };

  const handleVerify = async () => {
    if (!textInput.trim()) {
      await ttsService.speak('Please enter text to verify');
      return;
    }

    setIsAnalyzing(true);
    await ttsService.speak('Analyzing claim. Please wait.');

    // TODO: Implement verification logic
    setTimeout(async () => {
      setIsAnalyzing(false);
      await ttsService.announceActionResult('Analysis complete', true);
    }, 2000);
  };

  const handleQuickAction = async (type: string) => {
    await ttsService.speak(`Opening ${type} verification`);

    switch (type) {
      case 'voice':
        await startVoiceInput();
        break;
      case 'camera':
        await ttsService.speak('Camera feature coming soon');
        break;
      case 'image':
        await ttsService.speak('Image upload feature coming soon');
        break;
      case 'url':
        await focusTextInput();
        await ttsService.speak('Enter URL in text field');
        break;
      default:
        console.log('Quick action:', type);
    }
  };

  const startVoiceInput = async () => {
    try {
      const isAvailable = await voiceService.isAvailable();
      if (!isAvailable) {
        Alert.alert('Voice Input', 'Voice recognition is not available on this device');
        return;
      }

      if (isListening) {
        await stopListening();
      } else {
        setIsListening(true);
        await ttsService.speak('Listening');
        await voiceService.startListening();
      }
    } catch (error) {
      console.error('Voice input error:', error);
      await ttsService.speak('Voice input failed');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await voiceService.stopListening();
      setIsListening(false);
      await ttsService.speak('Stopped listening');
    } catch (error) {
      console.error('Stop listening error:', error);
    }
  };

  const focusTextInput = () => {
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  const handleTextInputFocus = () => {
    if (isScreenReaderEnabled) {
      ttsService.speak('Text input field focused. Enter text, URL, or claim to verify');
    }
  };

  return (
    <SafeAreaView 
      style={styles.container}
      accessible={true}
      accessibilityLabel="Verify Screen"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          accessible={false}
        >
          {/* Header */}
          <View 
            style={styles.header}
            accessible={true}
            accessibilityRole="header"
          >
            <Text 
              style={styles.title}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel="CheckMate"
            >
              CheckMate
            </Text>
            <Text 
              style={styles.subtitle}
              accessible={true}
              accessibilityLabel="AI-Powered Fact Verification"
            >
              AI-Powered Fact Verification
            </Text>
          </View>

          {/* Voice Listening Indicator */}
          {isListening && (
            <View 
              style={styles.listeningIndicator}
              accessible={true}
              accessibilityLabel="Voice listening active"
              accessibilityLiveRegion="polite"
            >
              <View style={styles.listeningPulse}>
                <Ionicons name="mic" size={24} color={colors.white} />
              </View>
              <Text style={styles.listeningText}>Listening...</Text>
              <TouchableOpacity 
                style={styles.stopListeningButton}
                onPress={stopListening}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Stop listening"
                accessibilityHint="Stops voice input"
              >
                <Ionicons name="stop-circle" size={32} color={colors.red} />
              </TouchableOpacity>
            </View>
          )}

          {/* Text Input Card */}
          <View 
            style={styles.inputCard}
            accessible={false}
          >
            <Text 
              style={styles.inputLabel}
              accessible={true}
              accessibilityLabel="Text input section"
            >
              Paste text, link, or claim to verify
            </Text>
            <View 
              style={styles.inputContainer}
              accessible={false}
            >
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                placeholder="Enter text, URL, or claim here..."
                placeholderTextColor={colors.gray400}
                multiline
                numberOfLines={4}
                value={textInput}
                onChangeText={setTextInput}
                onFocus={handleTextInputFocus}
                textAlignVertical="top"
                accessible={true}
                accessibilityLabel="Verification text input"
                accessibilityHint="Enter text, URL, or claim to verify for accuracy"
                accessibilityValue={{ text: textInput || 'Empty' }}
              />
            </View>
            <TouchableOpacity 
              style={[
                styles.verifyButton,
                (!textInput.trim() || isAnalyzing) && styles.verifyButtonDisabled
              ]}
              onPress={handleVerify}
              disabled={!textInput.trim() || isAnalyzing}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isAnalyzing ? 'Analyzing information' : 'Verify information'}
              accessibilityHint="Starts AI-powered fact verification of entered text"
              accessibilityState={{ 
                disabled: !textInput.trim() || isAnalyzing,
                busy: isAnalyzing 
              }}
            >
              <Ionicons 
                name={isAnalyzing ? "hourglass" : "shield-checkmark"} 
                size={20} 
                color={colors.white}
                importantForAccessibility="no"
              />
              <Text style={styles.verifyButtonText}>
                {isAnalyzing ? 'Analyzing...' : 'Verify Now'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View 
            style={styles.quickActionsSection}
            accessible={false}
          >
            <Text 
              style={styles.sectionTitle}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel="Quick verify options"
            >
              Quick Verify
            </Text>
            <View 
              style={styles.quickActionsGrid}
              accessible={false}
            >
              <QuickActionCard
                icon="mic"
                label="Voice"
                color={colors.purple}
                onPress={() => handleQuickAction('voice')}
                isActive={isListening}
              />
              <QuickActionCard
                icon="camera"
                label="Camera"
                color={colors.blue}
                onPress={() => handleQuickAction('camera')}
              />
              <QuickActionCard
                icon="image"
                label="Image"
                color={colors.green}
                onPress={() => handleQuickAction('image')}
              />
              <QuickActionCard
                icon="link"
                label="URL"
                color={colors.amber}
                onPress={() => handleQuickAction('url')}
              />
            </View>
          </View>

          {/* Recent Threats */}
          <View 
            style={styles.threatsSection}
            accessible={false}
          >
            <View style={styles.sectionHeader}>
              <Text 
                style={styles.sectionTitle}
                accessible={true}
                accessibilityRole="header"
                accessibilityLabel="Local threats section"
              >
                Local Threats
              </Text>
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="View all threats"
                accessibilityHint="Opens full list of local threats"
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <ThreatCard
              severity="critical"
              title="WhatsApp Scam Alert"
              description="Free gift card links spreading via messages. Do not click."
              time="2h ago"
              verified={true}
            />
            <ThreatCard
              severity="high"
              title="Deepfake Video Circulating"
              description="Manipulated video of politician spreading false claims."
              time="5h ago"
              verified={true}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface QuickActionCardProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  isActive?: boolean;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ 
  icon, 
  label, 
  color, 
  onPress, 
  isActive = false 
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.quickActionCard,
        isActive && styles.quickActionCardActive
      ]}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Verify with ${label}`}
      accessibilityHint={`Opens ${label.toLowerCase()} verification feature`}
      accessibilityState={{ selected: isActive }}
    >
      <View style={[styles.quickActionIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={color}
          importantForAccessibility="no"
        />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
      {isActive && (
        <View style={styles.activeIndicator}>
          <Ionicons name="checkmark-circle" size={16} color={colors.green} />
        </View>
      )}
    </TouchableOpacity>
  );
};

interface ThreatCardProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  time: string;
  verified: boolean;
}

const ThreatCard: React.FC<ThreatCardProps> = ({ severity, title, description, time, verified }) => {
  const severityColors = {
    critical: { bg: colors.redLight, text: colors.red },
    high: { bg: colors.amberLight, text: colors.amber },
    medium: { bg: colors.blueLight, text: colors.blue },
    low: { bg: colors.greenLight, text: colors.green },
  };

  const severityColor = severityColors[severity];

  const handlePress = async () => {
    await ttsService.readAlert(severity, title, description);
  };

  return (
    <TouchableOpacity 
      style={styles.threatCard}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${severity} severity threat. ${title}`}
      accessibilityHint={`${description}. Posted ${time}. ${verified ? 'Verified by CheckMate' : 'Unverified'}. Double tap for details.`}
    >
      <View 
        style={styles.threatHeader}
        accessible={false}
      >
        <View style={[styles.severityBadge, { backgroundColor: severityColor.bg }]}>
          <Ionicons 
            name="warning" 
            size={12} 
            color={severityColor.text}
            importantForAccessibility="no"
          />
          <Text style={[styles.severityText, { color: severityColor.text }]}>
            {severity.toUpperCase()}
          </Text>
        </View>
        {verified && (
          <View 
            style={styles.verifiedBadge}
            accessible={true}
            accessibilityLabel="Verified"
          >
            <Ionicons 
              name="shield-checkmark" 
              size={12} 
              color={colors.green}
              importantForAccessibility="no"
            />
          </View>
        )}
      </View>
      <Text 
        style={styles.threatTitle}
        accessible={false}
      >
        {title}
      </Text>
      <Text 
        style={styles.threatDescription} 
        numberOfLines={2}
        accessible={false}
      >
        {description}
      </Text>
      <View 
        style={styles.threatFooter}
        accessible={false}
      >
        <Ionicons 
          name="time-outline" 
          size={14} 
          color={colors.gray400}
          importantForAccessibility="no"
        />
        <Text style={styles.threatTime}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  listeningIndicator: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.purple,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  listeningPulse: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  listeningText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  stopListeningButton: {
    marginTop: spacing.sm,
  },
  inputCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputContainer: {
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 120,
    marginBottom: spacing.md,
  },
  textInput: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    flex: 1,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    gap: spacing.sm,
  },
  verifyButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  quickActionsSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.base,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    position: 'relative',
  },
  quickActionCardActive: {
    borderWidth: 2,
    borderColor: colors.green,
    backgroundColor: colors.greenLight,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  activeIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  threatsSection: {
    paddingHorizontal: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.blue,
  },
  threatCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  threatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    gap: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  threatDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  threatFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  threatTime: {
    fontSize: 12,
    color: colors.gray400,
  },
});
