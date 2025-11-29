import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '@/theme';

interface MicrophoneButtonProps {
  isActive: boolean;
  onPress: () => void;
  size?: number;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ 
  isActive, 
  onPress,
  size = 120 
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) {
      // Gentle pulse animation when inactive
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isActive, pulseAnim]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isActive ? colors.blue : colors.white,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.icon}>
          {/* Microphone Icon SVG */}
          <View style={[styles.micBody, { backgroundColor: isActive ? colors.white : colors.black }]} />
          <View style={[styles.micStand, { backgroundColor: isActive ? colors.white : colors.black }]} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.black,
  },
  icon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBody: {
    width: 14,
    height: 20,
    borderRadius: 7,
  },
  micStand: {
    width: 20,
    height: 8,
    marginTop: 2,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 2,
  },
});
