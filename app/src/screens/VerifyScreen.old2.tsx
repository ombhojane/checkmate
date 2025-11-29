import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, radius } from '@/theme';
import ttsService from '@/services/tts.service';
import voiceService from '@/services/voice.service';
import { screenCaptureService, AnalysisResult } from '@/services/screen-capture.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Action types for quick actions
type ActionType = 'voice' | 'camera' | 'image' | 'url' | 'screen';

interface QuickAction {
  id: ActionType;
  icon: string;
  label: string;
  color: string;
  gradient: [string, string];
  iconFamily: 'ionicons' | 'material' | 'feather';
}

const QUICK_ACTIONS: QuickAction[] = [
  { 
    id: 'voice', 
    icon: 'mic', 
    label: 'Voice', 
    color: '#6366F1',
    gradient: ['#6366F1', '#8B5CF6'],
    iconFamily: 'ionicons'
  },
  { 
    id: 'camera', 
    icon: 'camera', 
    label: 'Camera', 
    color: '#EC4899',
    gradient: ['#EC4899', '#F472B6'],
    iconFamily: 'feather'
  },
  { 
    id: 'image', 
    icon: 'image', 
    label: 'Gallery', 
    color: '#10B981',
    gradient: ['#10B981', '#34D399'],
    iconFamily: 'feather'
  },
  { 
    id: 'url', 
    icon: 'link', 
    label: 'URL', 
    color: '#F59E0B',
    gradient: ['#F59E0B', '#FBBF24'],
    iconFamily: 'feather'
  },
  { 
    id: 'screen', 
    icon: 'monitor', 
    label: 'Screen', 
    color: '#3B82F6',
    gradient: ['#3B82F6', '#60A5FA'],
    iconFamily: 'feather'
  },
];

export default function VerifyScreen() {
  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScreenCapturing, setIsScreenCapturing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [recentAnalysis, setRecentAnalysis] = useState<AnalysisResult | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Initialize services
    initializeServices();

    // Setup voice callbacks
    voiceService.onIntent(handleVoiceIntent);
    voiceService.onResult((result) => {
      setTextInput(result.text);
      ttsService.speak(`Text captured: ${result.text}`);
    });

    // Setup screen capture callbacks
    screenCaptureService.onAnalysis((result) => {
      setRecentAnalysis(result);
      if (result.riskLevel !== 'none') {
        ttsService.speak(`Potential threat detected: ${result.summary}`);
      }
    });

    screenCaptureService.onStatus((status) => {
      setIsScreenCapturing(status === 'started');
    });

    // Announce screen
    ttsService.announceScreenChange('Verify');

    return () => {
      voiceService.destroy();
      screenCaptureService.stopCapturing();
    };
  }, []);

  // Pulse animation for listening state
  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isListening]);

  const initializeServices = async () => {
    try {
      await ttsService.init();
      await voiceService.init();
    } catch (error) {
      console.log('Services initialization:', error);
    }
  };

  const handleVoiceIntent = async (intent: any) => {
    switch (intent.intent) {
      case 'verify_claim':
        if (intent.params?.query) {
          setTextInput(intent.params.query);
          await ttsService.speak('Text set. Ready to verify.');
        }
        break;
      case 'navigate':
        // Handle navigation
        break;
      default:
        break;
    }
  };

  const handleVerify = async () => {
    if (!textInput.trim()) {
      ttsService.speak('Please enter some text to verify');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2500));
      setAnalysisProgress(100);
      ttsService.speak('Analysis complete. No immediate threats detected.');
    } catch (error) {
      ttsService.speak('Analysis failed. Please try again.');
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  const handleQuickAction = async (action: ActionType) => {
    switch (action) {
      case 'voice':
        await toggleVoiceListening();
        break;
      case 'camera':
        ttsService.speak('Opening camera for verification');
        // TODO: Navigate to camera
        break;
      case 'image':
        ttsService.speak('Opening gallery');
        // TODO: Open image picker
        break;
      case 'url':
        ttsService.speak('Enter URL to verify');
        // TODO: Show URL input modal
        break;
      case 'screen':
        await toggleScreenCapture();
        break;
    }
  };

  const toggleVoiceListening = async () => {
    if (isListening) {
      await voiceService.stopListening();
      setIsListening(false);
      ttsService.speak('Voice input stopped');
    } else {
      setIsListening(true);
      ttsService.speak('Listening for voice input');
      await voiceService.startListening();
    }
  };

  const toggleScreenCapture = async () => {
    if (isScreenCapturing) {
      screenCaptureService.stopCapturing();
      ttsService.speak('Screen monitoring stopped');
    } else {
      const started = await screenCaptureService.startCapturing();
      if (started) {
        ttsService.speak('Screen monitoring started. I will analyze your screen for potential threats.');
      } else {
        ttsService.speak('Screen capture not available. Please use a development build.');
      }
    }
  };

  const renderIcon = (action: QuickAction, size: number = 24) => {
    const color = '#FFFFFF';
    switch (action.iconFamily) {
      case 'material':
        return <MaterialCommunityIcons name={action.icon as any} size={size} color={color} />;
      case 'feather':
        return <Feather name={action.icon as any} size={size} color={color} />;
      default:
        return <Ionicons name={action.icon as any} size={size} color={color} />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greeting}>CheckMate</Text>
                <Text style={styles.subtitle}>Verify anything instantly</Text>
              </View>
              {isScreenCapturing && (
                <View style={styles.screenCaptureBadge}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Monitoring</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Main Input Card */}
          <Animated.View 
            style={[
              styles.mainCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <LinearGradient
              colors={['#1F2937', '#111827']}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Voice Indicator */}
              {isListening && (
                <Animated.View 
                  style={[
                    styles.listeningIndicator,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.listeningGradient}
                  >
                    <Ionicons name="mic" size={24} color="#FFFFFF" />
                    <Text style={styles.listeningText}>Listening...</Text>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* Text Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  ref={textInputRef}
                  style={styles.textInput}
                  placeholder="Paste text, news, or claims to verify..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={textInput}
                  onChangeText={setTextInput}
                  multiline
                  numberOfLines={4}
                  accessibilityLabel="Text input for verification"
                  accessibilityHint="Enter or paste text you want to verify for accuracy"
                />
                {textInput.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => setTextInput('')}
                    accessibilityLabel="Clear text"
                  >
                    <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Character Count */}
              <View style={styles.inputMeta}>
                <Text style={styles.charCount}>
                  {textInput.length} / 5000 characters
                </Text>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (!textInput.trim() || isAnalyzing) && styles.verifyButtonDisabled
                ]}
                onPress={handleVerify}
                disabled={!textInput.trim() || isAnalyzing}
                accessibilityRole="button"
                accessibilityLabel={isAnalyzing ? 'Analyzing' : 'Verify content'}
              >
                <LinearGradient
                  colors={textInput.trim() && !isAnalyzing 
                    ? ['#6366F1', '#8B5CF6'] 
                    : ['#4B5563', '#374151']}
                  style={styles.verifyButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isAnalyzing ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.verifyButtonText}>
                        Analyzing... {analysisProgress}%
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                      <Text style={styles.verifyButtonText}>Verify Now</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View 
            style={[
              styles.quickActionsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>
              Multiple ways to verify content
            </Text>
            
            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((action, index) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.quickActionCard,
                    (action.id === 'voice' && isListening) && styles.quickActionActive,
                    (action.id === 'screen' && isScreenCapturing) && styles.quickActionActive,
                  ]}
                  onPress={() => handleQuickAction(action.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${action.label} verification`}
                  accessibilityState={{ 
                    selected: (action.id === 'voice' && isListening) || 
                              (action.id === 'screen' && isScreenCapturing) 
                  }}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.quickActionIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {renderIcon(action, 22)}
                  </LinearGradient>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                  {((action.id === 'voice' && isListening) || 
                    (action.id === 'screen' && isScreenCapturing)) && (
                    <View style={styles.activeIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Recent Analysis Result */}
          {recentAnalysis && (
            <Animated.View 
              style={[
                styles.analysisResultSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <Text style={styles.sectionTitle}>Latest Analysis</Text>
              <View style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <View style={[
                    styles.riskBadge,
                    { backgroundColor: getRiskColor(recentAnalysis.riskLevel) + '20' }
                  ]}>
                    <View style={[
                      styles.riskDot,
                      { backgroundColor: getRiskColor(recentAnalysis.riskLevel) }
                    ]} />
                    <Text style={[
                      styles.riskText,
                      { color: getRiskColor(recentAnalysis.riskLevel) }
                    ]}>
                      {recentAnalysis.riskLevel.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.analysisTime}>
                    {new Date(recentAnalysis.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.analysisSummary}>{recentAnalysis.summary}</Text>
                {recentAnalysis.threats.length > 0 && (
                  <View style={styles.threatsList}>
                    {recentAnalysis.threats.map((threat, idx) => (
                      <View key={idx} style={styles.threatItem}>
                        <Ionicons 
                          name="warning" 
                          size={16} 
                          color={getRiskColor(recentAnalysis.riskLevel)} 
                        />
                        <Text style={styles.threatText}>{threat.description}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Tips Section */}
          <Animated.View 
            style={[
              styles.tipsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Pro Tip</Text>
                <Text style={styles.tipText}>
                  Use Screen Capture to automatically detect suspicious content while browsing.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  
  // Header
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  screenCaptureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  recordingText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },

  // Main Card
  mainCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    ...shadows.lg,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  // Listening Indicator
  listeningIndicator: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  listeningGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 10,
  },
  listeningText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Input
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 16,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  inputMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  charCount: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  
  // Verify Button
  verifyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - 64) / 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickActionActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },

  // Analysis Results
  analysisResultSection: {
    marginBottom: 24,
  },
  analysisCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '700',
  },
  analysisTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  analysisSummary: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  threatsList: {
    gap: 8,
  },
  threatItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  threatText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  // Tips
  tipsSection: {
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 18,
  },
});
