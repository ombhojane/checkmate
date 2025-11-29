import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '@/theme';
import { apiService, VerificationHistoryItem } from '@/services/api.service';

interface HistoryItemData {
  id: string;
  score: number;
  status: 'false' | 'partial' | 'verified';
  title: string;
  time: string;
  date: Date;
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const mapVerdictToStatus = (verdict: string): 'false' | 'partial' | 'verified' => {
  const lower = verdict.toLowerCase();
  if (lower.includes('false') || lower.includes('fake') || lower.includes('misleading')) {
    return 'false';
  }
  if (lower.includes('partial') || lower.includes('mixed') || lower.includes('unclear')) {
    return 'partial';
  }
  return 'verified';
};

const groupByDate = (items: HistoryItemData[]): Map<string, HistoryItemData[]> => {
  const groups = new Map<string, HistoryItemData[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  items.forEach(item => {
    const itemDate = item.date;
    let label: string;
    
    if (itemDate.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (itemDate.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(item);
  });

  return groups;
};

export default function HistoryScreen() {
  const [searchText, setSearchText] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const verifications = await apiService.getVerificationHistory();
      
      const items: HistoryItemData[] = verifications.map(v => ({
        id: v.id,
        score: Math.round(v.confidence_score * 100),
        status: mapVerdictToStatus(v.verdict),
        title: v.claim_text.substring(0, 100),
        time: formatTime(v.created_at),
        date: new Date(v.created_at),
      }));
      
      // Sort by date, most recent first
      items.sort((a, b) => b.date.getTime() - a.date.getTime());
      setHistoryItems(items);
    } catch (err: any) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [fetchHistory]);

  // Filter items by search
  const filteredItems = searchText
    ? historyItems.filter(item => 
        item.title.toLowerCase().includes(searchText.toLowerCase())
      )
    : historyItems;

  const groupedItems = groupByDate(filteredItems);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={colors.textTertiary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchHistory}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        <View style={styles.list}>
          {Array.from(groupedItems.entries()).map(([label, items]) => (
            <React.Fragment key={label}>
              <Text style={styles.sectionLabel}>{label}</Text>
              {items.map(item => (
                <HistoryItem
                  key={item.id}
                  score={item.score}
                  status={item.status}
                  title={item.title}
                  time={item.time}
                />
              ))}
            </React.Fragment>
          ))}
        </View>

        {filteredItems.length === 0 && !error && (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>
              {searchText ? 'No results found' : 'No verification history'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface HistoryItemProps {
  score: number;
  status: 'false' | 'partial' | 'verified';
  title: string;
  time: string;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ score, status, title, time }) => {
  const getScoreColor = (score: number) => {
    if (score <= 33) return colors.error;
    if (score <= 66) return '#F59E0B';
    return colors.success;
  };

  const getIcon = (status: string) => {
    const icons = {
      false: 'close-circle',
      partial: 'alert-circle',
      verified: 'checkmark-circle',
    };
    return icons[status as keyof typeof icons];
  };

  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.7}>
      <View style={styles.itemLeft}>
        <Ionicons 
          name={getIcon(status) as any} 
          size={20} 
          color={getScoreColor(score)} 
        />
        <View style={styles.itemText}>
          <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.itemTime}>{time}</Text>
        </View>
      </View>
      <Text style={[styles.score, { color: getScoreColor(score) }]}>
        {score}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.base,
  },

  // Header
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    letterSpacing: -0.5,
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    height: 44,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    paddingVertical: 0,
  },

  // Error
  errorBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.base,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  retryText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },

  // List
  list: {
    gap: spacing.base,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  itemTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  score: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },

  // Empty
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
    marginTop: spacing.base,
    textAlign: 'center',
  },
});
