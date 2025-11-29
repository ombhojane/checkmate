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
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, radius } from '@/theme';
import ttsService from '@/services/tts.service';
import voiceService from '@/services/voice.service';
import { screenCaptureService, AnalysisResult } from '@/services/screen-capture.service';
import permissionsService from '@/services/permissions.service';
import { apiService, VerifyResponse } from '@/services/api.service';

type ActionType = 'voice' | 'camera' | 'image' | 'url' | 'screen';

interface Action {
  id: ActionType;
  icon: string;
  label: string;
}

const ACTIONS: Action[] = [
  { id: 'voice', icon: 'mic-outline', label: 'Voice' },
  { id: 'camera', icon: 'camera-outline', label: 'Camera' },
  { id: 'image', icon: 'image-outline', label: 'Image' },
  { id: 'url', icon: 'link-outline', label: 'URL' },
  { id: 'screen', icon: 'desktop-outline', label: 'Screen' },
];

export default function VerifyScreen() {
  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScreenCapturing, setIsScreenCapturing] = useState(false);
  const [recentAnalysis, setRecentAnalysis] = useState<AnalysisResult | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerifyResponse | null>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    initializeServices();

    voiceService.onIntent(handleVoiceIntent);
    voiceService.onResult((result) => {
      setTextInput(result.text);
      ttsService.speak(`Text captured`);
    });

    screenCaptureService.onAnalysis((result) => {
      setRecentAnalysis(result);
      if (result.riskLevel !== 'none') {
        ttsService.speak(`Threat detected`);
      }
    });

    screenCaptureService.onStatus((status) => {
      setIsScreenCapturing(status === 'started');
    });

    return () => {
      voiceService.destroy();
      screenCaptureService.stopCapturing();
    };
  }, []);

  const initializeServices = async () => {
    try {
      await ttsService.init();
      await voiceService.init();
    } catch (error) {
      console.log('Services init:', error);
    }
  };

  const handleVoiceIntent = async (intent: any) => {
    if (intent.intent === 'verify_claim' && intent.params?.query) {
      setTextInput(intent.params.query);
    }
  };

  const handleVerify = async () => {
    if (!textInput.trim()) {
      ttsService.speak('Enter text to verify');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Call the verification API
      const result = await apiService.verifyClaim(textInput);
      const confidencePercent = Math.round(result.confidence * 100);
      
      // Set the result for display
      setVerificationResult(result);
      
      // Announce the result
      const verdictText = result.verdict === 'verified' ? 'verified as true' 
        : result.verdict === 'false' ? 'identified as false' 
        : 'partially verified';
      ttsService.speak(`Analysis complete. Content ${verdictText} with ${confidencePercent}% confidence`);
    } catch (error: any) {
      console.error('Verification error:', error);
      ttsService.speak('Analysis failed. Please try again.');
      Alert.alert('Error', error.message || 'Failed to verify content');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAction = async (action: ActionType) => {
    switch (action) {
      case 'voice':
        if (isListening) {
          await voiceService.stopListening();
          setIsListening(false);
        } else {
          // Request microphone permission first
          const hasMicPermission = await permissionsService.requestMicrophonePermission();
          if (!hasMicPermission) {
            ttsService.speak('Microphone permission required');
            return;
          }
          setIsListening(true);
          await voiceService.startListening();
        }
        break;
      case 'camera':
        // Request camera permission
        const hasCameraPermission = await permissionsService.requestCameraPermission();
        if (!hasCameraPermission) {
          ttsService.speak('Camera permission required');
          return;
        }
        // Launch camera
        const cameraResult = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          quality: 0.8,
          allowsEditing: true,
        });
        if (!cameraResult.canceled && cameraResult.assets[0]) {
          ttsService.speak('Image captured, analyzing');
          setIsAnalyzing(true);
          try {
            const result = await apiService.verifyImage(cameraResult.assets[0].uri);
            setVerificationResult(result);
            ttsService.speak(`Image analysis complete. ${result.verdict}`);
          } catch (error: any) {
            ttsService.speak('Image analysis failed');
            Alert.alert('Error', error.message || 'Failed to analyze image');
          } finally {
            setIsAnalyzing(false);
          }
        }
        break;
      case 'image':
        // Request media library permission
        const hasMediaPermission = await permissionsService.requestMediaLibraryPermission();
        if (!hasMediaPermission) {
          ttsService.speak('Photo library permission required');
          return;
        }
        // Launch image picker
        const pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          quality: 0.8,
          allowsEditing: true,
        });
        if (!pickerResult.canceled && pickerResult.assets[0]) {
          ttsService.speak('Image selected, analyzing');
          setIsAnalyzing(true);
          try {
            const result = await apiService.verifyImage(pickerResult.assets[0].uri);
            setVerificationResult(result);
            ttsService.speak(`Image analysis complete. ${result.verdict}`);
          } catch (error: any) {
            ttsService.speak('Image analysis failed');
            Alert.alert('Error', error.message || 'Failed to analyze image');
          } finally {
            setIsAnalyzing(false);
          }
        }
        break;
      case 'screen':
        if (isScreenCapturing) {
          screenCaptureService.stopCapturing();
          ttsService.speak('Screen monitoring stopped');
        } else {
          // Request overlay permission on Android
          if (Platform.OS === 'android') {
            const hasOverlay = await permissionsService.requestOverlayPermission();
            if (!hasOverlay) {
              return;
            }
          }
          const started = await screenCaptureService.startCapturing();
          if (started) {
            ttsService.speak('Screen monitoring started');
          } else {
            Alert.alert(
              'Screen Capture Unavailable',
              'Screen capture requires a development build with native modules. Please build the app using EAS Build.',
              [{ text: 'OK' }]
            );
          }
        }
        break;
      case 'url':
        ttsService.speak('Paste a URL to verify');
        textInputRef.current?.focus();
        break;
      default:
        ttsService.speak(`${action} selected`);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return colors.error;
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return colors.success;
      default: return colors.textTertiary;
    }
  };

  const getVerdictColor = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes('true') || v.includes('verified')) return colors.success;
    if (v.includes('false') || v.includes('fake')) return colors.error;
    if (v.includes('partial') || v.includes('mixed')) return '#F59E0B';
    return colors.textSecondary;
  };

  const getVerdictIcon = (verdict: string): any => {
    const v = verdict.toLowerCase();
    if (v.includes('true') || v.includes('verified')) return 'checkmark-circle';
    if (v.includes('false') || v.includes('fake')) return 'close-circle';
    return 'help-circle';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/checkmate-logo.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandContainer}>
                <Text style={styles.brand}>CheckMate</Text>
                <Text style={styles.tagline}>Truth verification</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {isScreenCapturing ? (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.headerIcon}>
                  <Ionicons name="notifications-outline" size={22} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Input Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verify Content</Text>
            
            {isListening && (
              <View style={styles.listening}>
                <View style={styles.pulse}>
                  <Ionicons name="mic" size={16} color={colors.text} />
                </View>
                <Text style={styles.listeningText}>Listening...</Text>
              </View>
            )}

            <View style={styles.inputCard}>
              <TextInput
                ref={textInputRef}
                style={styles.input}
                placeholder="Enter text, URL, or claim to verify"
                placeholderTextColor={colors.textTertiary}
                value={textInput}
                onChangeText={setTextInput}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              {textInput.length > 0 && (
                <TouchableOpacity 
                  style={styles.clear}
                  onPress={() => setTextInput('')}
                >
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.charCount}>{textInput.length} characters</Text>

            <TouchableOpacity
              style={[styles.button, (!textInput.trim() || isAnalyzing) && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={!textInput.trim() || isAnalyzing}
              activeOpacity={0.7}
            >
              {isAnalyzing ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.white} />
                  <Text style={styles.buttonText}>Verify</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actions}>
              {ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.action,
                    (action.id === 'voice' && isListening) && styles.actionActive,
                    (action.id === 'screen' && isScreenCapturing) && styles.actionActive,
                  ]}
                  onPress={() => handleAction(action.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name={action.icon as any} size={20} color={colors.text} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  {((action.id === 'voice' && isListening) || 
                    (action.id === 'screen' && isScreenCapturing)) && (
                    <View style={styles.activeDot} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Verification Result */}
          {verificationResult && (
            <View style={styles.section}>
              <View style={styles.resultHeader}>
                <Text style={styles.sectionTitle}>Verification Result</Text>
                <TouchableOpacity onPress={() => setVerificationResult(null)}>
                  <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
              <View style={styles.verificationCard}>
                <View style={styles.verdictRow}>
                  <View style={[
                    styles.verdictBadge, 
                    { backgroundColor: getVerdictColor(verificationResult.verdict) }
                  ]}>
                    <Ionicons 
                      name={getVerdictIcon(verificationResult.verdict)} 
                      size={16} 
                      color={colors.white} 
                    />
                    <Text style={styles.verdictText}>{verificationResult.verdict.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.confidenceText}>
                    {Math.round(verificationResult.confidence * 100)}% confidence
                  </Text>
                </View>
                
                <Text style={styles.summaryText}>{verificationResult.summary}</Text>
                
                {verificationResult.detailed_analysis && (
                  <View style={styles.analysisBox}>
                    <Text style={styles.analysisLabel}>Analysis</Text>
                    <Text style={styles.analysisText}>{verificationResult.detailed_analysis}</Text>
                  </View>
                )}
                
                {verificationResult.sources && verificationResult.sources.length > 0 && (
                  <View style={styles.sourcesBox}>
                    <Text style={styles.sourcesLabel}>Sources ({verificationResult.sources.length})</Text>
                    {verificationResult.sources.slice(0, 3).map((source, idx) => (
                      <View key={idx} style={styles.sourceItem}>
                        <Text style={styles.sourceTitle} numberOfLines={1}>{source.title}</Text>
                        <Text style={styles.sourceSnippet} numberOfLines={2}>{source.snippet}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                <Text style={styles.processingTime}>
                  Processed in {verificationResult.processing_time_ms}ms
                </Text>
              </View>
            </View>
          )}

          {/* Recent Analysis */}
          {recentAnalysis && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Analysis</Text>
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={[styles.risk, { backgroundColor: getRiskColor(recentAnalysis.riskLevel) }]}>
                    <Text style={styles.riskText}>{recentAnalysis.riskLevel.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.time}>
                    {new Date(recentAnalysis.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
                <Text style={styles.summary}>{recentAnalysis.summary}</Text>
                {recentAnalysis.threats.length > 0 && (
                  <View style={styles.threats}>
                    {recentAnalysis.threats.map((threat, idx) => (
                      <View key={idx} style={styles.threat}>
                        <View style={styles.threatDot} />
                        <Text style={styles.threatText}>{threat.description}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Tip */}
          <View style={styles.tip}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.tipText}>
              Use Screen Capture to automatically detect suspicious content
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 32,
    height: 32,
  },
  brandContainer: {
    gap: 2,
  },
  brand: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  liveText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.error,
    marginRight: spacing.xs,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },

  // Section
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Listening
  listening: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  pulse: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listeningText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },

  // Input
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    minHeight: 140,
  },
  input: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  clear: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },

  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
    borderRadius: radius.md,
    height: 44,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    letterSpacing: -0.2,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    width: 68,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  actionActive: {
    borderColor: colors.black,
    backgroundColor: colors.background,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },

  // Result
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  risk: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  riskText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  summary: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  threats: {
    gap: spacing.xs,
  },
  threat: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  threatDot: {
    width: 4,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.textTertiary,
    marginTop: 6,
    marginRight: spacing.xs,
  },
  threatText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.xs,
  },

  // Tip
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
  },

  // Verification Result
  verificationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
  },
  verdictRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  verdictText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  confidenceText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  summaryText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    marginBottom: spacing.base,
  },
  analysisBox: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.base,
  },
  analysisLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  analysisText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  sourcesBox: {
    marginBottom: spacing.sm,
  },
  sourcesLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sourceItem: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  sourceTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: 2,
  },
  sourceSnippet: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.xs,
  },
  processingTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
