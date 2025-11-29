import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows, radius } from '@/theme';
import ttsService from '@/services/tts.service';

export default function AlertsScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [newAlertsCount, setNewAlertsCount] = useState(3);

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

    // Announce screen with alerts count
    ttsService.announceScreenChange('Alerts');
    if (newAlertsCount > 0) {
      ttsService.speak(`You have ${newAlertsCount} new threat alerts`);
    }

    return () => {
      subscription.remove();
    };
  }, [newAlertsCount]);

  const handleFilterChange = async (filter: string) => {
    setActiveFilter(filter.toLowerCase());
    await ttsService.speak(`Showing ${filter} alerts`);
  };

  const filters = ['All', 'Critical', 'Scams', 'Phishing'];

  return (
    <SafeAreaView 
      style={styles.container}
      accessible={true}
      accessibilityLabel="Alerts Screen"
    >
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        accessible={false}
      >
        {/* Header */}
        <View 
          style={styles.header}
          accessible={false}
        >
          <View>
            <Text 
              style={styles.title}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel="Alerts"
            >
              Alerts
            </Text>
            <Text 
              style={styles.subtitle}
              accessible={true}
              accessibilityLabel={`${newAlertsCount} new threats detected`}
              accessibilityLiveRegion="polite"
            >
              {newAlertsCount} new threats detected
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Alert settings"
            accessibilityHint="Opens alert preferences and notification settings"
          >
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={colors.text}
              importantForAccessibility="no"
            />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          accessible={false}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter.toLowerCase() && styles.filterChipActive,
              ]}
              onPress={() => handleFilterChange(filter)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${filter}`}
              accessibilityHint={`Shows ${filter.toLowerCase()} alerts only`}
              accessibilityState={{ selected: activeFilter === filter.toLowerCase() }}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.toLowerCase() && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Alert Cards */}
        <View 
          style={styles.alertsList}
          accessible={false}
        >
          <AlertCard
            severity="critical"
            icon="warning"
            title="WhatsApp Scam Alert"
            description="Free gift card links spreading via messages. Do not click."
            location="Mumbai"
            time="2h ago"
            isNew
          />
          <AlertCard
            severity="high"
            icon="videocam"
            title="Deepfake Video Circulating"
            description="Manipulated video of politician spreading false claims about recent policy."
            location="National"
            time="5h ago"
            isNew
          />
          <AlertCard
            severity="medium"
            icon="mail"
            title="Phishing Email Campaign"
            description="Fake banking emails asking for credentials. Verify sender before clicking links."
            location="Your region"
            time="8h ago"
            isNew
          />
          <AlertCard
            severity="low"
            icon="call"
            title="Suspicious Call Reports"
            description="Multiple users reported spam calls from unknown numbers claiming to be from telecom companies."
            location="Delhi NCR"
            time="1d ago"
            isNew={false}
          />
        </View>

        <TouchableOpacity 
          style={styles.loadMore}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Load more alerts"
          accessibilityHint="Loads older alert notifications"
        >
          <Text style={styles.loadMoreText}>Load more alerts</Text>
          <Ionicons 
            name="chevron-down" 
            size={16} 
            color={colors.gray400}
            importantForAccessibility="no"
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

interface AlertCardProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
  icon: string;
  title: string;
  description: string;
  location: string;
  time: string;
  isNew: boolean;
}

const AlertCard: React.FC<AlertCardProps> = ({ 
  severity, 
  icon, 
  title, 
  description, 
  location, 
  time, 
  isNew 
}) => {
  const severityColors = {
    critical: { bg: colors.redLight, text: colors.red, icon: colors.red },
    high: { bg: colors.amberLight, text: colors.amber, icon: colors.amber },
    medium: { bg: colors.blueLight, text: colors.blue, icon: colors.blue },
    low: { bg: colors.greenLight, text: colors.green, icon: colors.green },
  };

  const colorScheme = severityColors[severity];

  const handlePress = async () => {
    await ttsService.readAlert(severity, title, description);
  };

  // Construct accessibility label
  const accessibilityLabel = [
    isNew ? 'New alert' : 'Alert',
    `${severity} severity`,
    title,
    description,
    `Location: ${location}`,
    `Posted ${time}`,
  ].join('. ');

  return (
    <TouchableOpacity 
      style={styles.alertCard} 
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to hear full details and take action"
    >
      {/* Icon Section */}
      <View 
        style={[styles.iconContainer, { backgroundColor: colorScheme.bg }]}
        accessible={false}
      >
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={colorScheme.icon}
          importantForAccessibility="no"
        />
      </View>

      {/* Content */}
      <View 
        style={styles.alertContent}
        accessible={false}
      >
        <View style={styles.alertHeader}>
          <Text 
            style={styles.alertTitle}
            accessible={false}
          >
            {title}
          </Text>
          {isNew && (
            <View 
              style={styles.newBadge}
              accessible={false}
            >
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <Text 
          style={styles.alertDescription} 
          numberOfLines={2}
          accessible={false}
        >
          {description}
        </Text>
        <View 
          style={styles.alertFooter}
          accessible={false}
        >
          <Ionicons 
            name="location" 
            size={12} 
            color={colors.gray400}
            importantForAccessibility="no"
          />
          <Text style={styles.alertLocation}>{location}</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.alertTime}>{time}</Text>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={styles.actionButton}
        accessible={false}
        importantForAccessibility="no"
      >
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={colors.gray400}
          importantForAccessibility="no"
        />
      </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.base,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  settingsButton: {
    padding: spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.base,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: radius.lg,
  },
  filterChipActive: {
    backgroundColor: colors.black,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterTextActive: {
    color: colors.white,
  },
  alertsList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  alertCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    ...shadows.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  alertTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  newBadge: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  alertDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertLocation: {
    fontSize: 12,
    color: colors.gray400,
  },
  dotSeparator: {
    fontSize: 12,
    color: colors.gray400,
  },
  alertTime: {
    fontSize: 12,
    color: colors.gray400,
  },
  actionButton: {
    padding: spacing.sm,
  },
  loadMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray400,
  },
});
