import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '@/theme';
import { apiService, FeedItem, TrendingTopic, VaccineDigest } from '@/services/api.service';

// Map FeedItem to Alert format
interface Alert {
  id: string;
  type: 'threat' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  intensity?: string;
}

const mapIntensityToType = (intensity: string): 'threat' | 'warning' | 'info' => {
  if (intensity === 'critical' || intensity === 'high') return 'threat';
  if (intensity === 'medium') return 'warning';
  return 'info';
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 172800000) return 'Yesterday';
  return date.toLocaleDateString();
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [latestVaccine, setLatestVaccine] = useState<VaccineDigest | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch feed, trending topics, and vaccine digest in parallel
      const [feedItems, topics, vaccine] = await Promise.all([
        apiService.getFeed(20),
        apiService.getTrendingTopics(),
        apiService.getLatestVaccine().catch(() => null),
      ]);
      
      // Transform feed items to alerts
      const transformedAlerts: Alert[] = feedItems.map(item => ({
        id: item.id,
        type: mapIntensityToType(item.intensity),
        title: item.topic,
        message: item.claim_summary,
        time: formatTimestamp(item.last_updated),
        read: false,
        intensity: item.intensity,
      }));
      
      setAlerts(transformedAlerts);
      setTrendingTopics(topics);
      setLatestVaccine(vaccine);
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Trigger feed refresh on the server
      await apiService.refreshFeed();
    } catch (err) {
      console.log('Feed refresh trigger failed, fetching anyway');
    }
    await fetchData();
  }, [fetchData]);

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const getIconName = (type: string) => {
    const icons = {
      threat: 'alert-circle',
      warning: 'warning',
      info: 'information-circle',
    };
    return icons[type as keyof typeof icons];
  };

  const getIconColor = (type: string) => {
    const colors_map = {
      threat: colors.error,
      warning: '#F59E0B',
      info: colors.accent,
    };
    return colors_map[type as keyof typeof colors_map];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
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
          <Text style={styles.title}>Alerts</Text>
        </View>

        {/* Settings */}
        <View style={styles.setting}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            <Text style={styles.settingText}>Push Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.gray300, true: colors.black }}
            thumbColor={colors.white}
          />
        </View>

        {/* Trending Topics */}
        {trendingTopics.length > 0 && (
          <View style={styles.trendingSection}>
            <Text style={styles.sectionTitle}>Trending Topics</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
              {trendingTopics.map((topic, index) => (
                <View key={index} style={styles.topicChip}>
                  <Text style={styles.topicText}>{topic.topic}</Text>
                  <Text style={styles.topicCount}>{topic.count}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Vaccine Digest */}
        {latestVaccine && latestVaccine.claims && latestVaccine.claims.length > 0 && (
          <TouchableOpacity style={styles.vaccineCard} activeOpacity={0.7}>
            <View style={styles.vaccineHeader}>
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text style={styles.vaccineTitle}>Info Vaccine</Text>
            </View>
            <Text style={styles.vaccineText} numberOfLines={2}>{latestVaccine.claims[0]?.truth || 'Weekly fact-check digest available'}</Text>
          </TouchableOpacity>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchData}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Alerts List */}
        <View style={styles.list}>
          {alerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={[styles.alert, !alert.read && styles.alertUnread]}
              onPress={() => markAsRead(alert.id)}
              activeOpacity={0.7}
            >
              <View style={styles.alertIcon}>
                <Ionicons 
                  name={getIconName(alert.type) as any} 
                  size={20} 
                  color={getIconColor(alert.type)} 
                />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  {!alert.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {alerts.length === 0 && !error && (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>No alerts</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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

  // Setting
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },

  // Trending Section
  trendingSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trendingScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  topicText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  topicCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },

  // Vaccine Card
  vaccineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  vaccineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  vaccineTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  vaccineText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
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
    gap: spacing.sm,
  },

  // Alert
  alert: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    gap: spacing.sm,
  },
  alertUnread: {
    borderColor: colors.borderDark,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  alertMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
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
  },
});
