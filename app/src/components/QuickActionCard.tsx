import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, typography, layout } from '@/theme';

const { width } = Dimensions.get('window');

interface QuickActionCardProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const cardWidth = (width - layout.screenPadding * 2 - layout.quickActionCardGap) / 2;

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: layout.quickActionCardHeight,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 24,
    height: 24,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
});
