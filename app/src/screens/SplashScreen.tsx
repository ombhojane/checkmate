import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      // Logo scale and fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 10,
          friction: 2,
          useNativeDriver: true,
        }),
      ]),
      // Slide text up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after delay
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Animated Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* CheckMate Logo */}
          <Image 
            source={require('../../assets/checkmate-logo.png')} 
            style={styles.logo}
          />
        </Animated.View>

        {/* Animated Text */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>CheckMate</Text>
          <Text style={styles.subtitle}>Truth in Every Move</Text>
          <View style={styles.taglineContainer}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.tagline}>Verify. Protect. Trust.</Text>
          </View>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </Animated.View>
      </View>

      {/* Chess Board Pattern Background */}
      <View style={styles.patternOverlay} pointerEvents="none">
        {[...Array(8)].map((_, i) => (
          <View key={i} style={styles.patternRow}>
            {[...Array(8)].map((_, j) => (
              <View
                key={j}
                style={[
                  styles.patternSquare,
                  (i + j) % 2 === 0 ? styles.patternLight : styles.patternDark,
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  shieldContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  knightOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -25,
    marginLeft: -25,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tagline: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: spacing['4xl'],
  },
  loadingDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blue,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  patternOverlay: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 1.5,
    opacity: 0.02,
    transform: [{ rotate: '45deg' }],
    top: -height * 0.25,
    left: -width * 0.25,
  },
  patternRow: {
    flexDirection: 'row',
  },
  patternSquare: {
    width: width / 8,
    height: width / 8,
  },
  patternLight: {
    backgroundColor: colors.text,
  },
  patternDark: {
    backgroundColor: 'transparent',
  },
});

export default SplashScreen;
