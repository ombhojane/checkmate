import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, layout, borderRadius } from '@/theme';
import { format } from 'date-fns';

export default function HistoryScreen() {
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Past verifications</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search history..."
            placeholderTextColor={colors.textTertiary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* History Items */}
        <View style={styles.historyList}>
          {/* Today */}
          <Text style={styles.dateSeparator}>Today</Text>
          <HistoryItem
            score={72}
            verdict="partial"
            title='"Free iPhone giveaway..."'
            timestamp="2:34 PM"
          />
          <HistoryItem
            score={95}
            verdict="verified"
            title="Image of moon landing..."
            timestamp="11:20 AM"
          />

          {/* Yesterday */}
          <Text style={styles.dateSeparator}>Yesterday</Text>
          <HistoryItem
            score={12}
            verdict="false"
            title='"Cure for cancer found..."'
            timestamp="8:15 PM"
          />
          <HistoryItem
            score={88}
            verdict="verified"
            title="News article verification"
            timestamp="3:45 PM"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface HistoryItemProps {
  score: number;
  verdict: 'false' | 'partial' | 'verified';
  title: string;
  timestamp: string;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ score, verdict, title, timestamp }) => {
  const getScoreColor = (score: number) => {
    if (score <= 33) return colors.red;
    if (score <= 66) return colors.amber;
    return colors.green;
  };

  const getVerdictLabel = (verdict: string) => {
    const labels = {
      false: 'False Information',
      partial: 'Partially Verified',
      verified: 'Verified True',
    };
    return labels[verdict as keyof typeof labels];
  };

  const scoreColor = getScoreColor(score);
  const verdictLabel = getVerdictLabel(verdict);

  return (
    <TouchableOpacity style={styles.historyItem}>
      <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}1A` }]}>
        <Text style={[styles.scoreText, { color: scoreColor }]}>{score}</Text>
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.historyMeta}>
          {verdictLabel} · {timestamp}
        </Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
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
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.base,
  },
  searchInput: {
    height: layout.inputHeight,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  historyList: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing.sm,
  },
  dateSeparator: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  historyItem: {
    height: layout.historyItemHeight,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  historyContent: {
    flex: 1,
    gap: spacing.xs,
  },
  historyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  historyMeta: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textTertiary,
  },
  arrow: {
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
  },
});
