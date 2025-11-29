import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows, radius } from '@/theme';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  location: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  verificationScore: number;
  tags: string[];
  userVote?: 'up' | 'down' | null;
}

const MOCK_POSTS: CommunityPost[] = [
  {
    id: '1',
    title: 'Fake Prize Scam in Local Area',
    content: 'Multiple residents received SMS claiming they won ₹50,000 prize from a lottery they never entered. The link asks for bank details. Stay alert!',
    author: 'SafetyFirst',
    location: 'Bangalore, Karnataka',
    timestamp: '2h ago',
    upvotes: 245,
    downvotes: 3,
    commentsCount: 18,
    verificationScore: 95,
    tags: ['Scam Alert', 'SMS', 'Banking'],
  },
  {
    id: '2',
    title: 'WhatsApp Forward About COVID Cure - FALSE',
    content: 'A message claiming garlic water cures COVID-19 is circulating. WHO has confirmed NO home remedy cures COVID. Only vaccines help.',
    author: 'FactChecker',
    location: 'Mumbai, Maharashtra',
    timestamp: '4h ago',
    upvotes: 189,
    downvotes: 12,
    commentsCount: 31,
    verificationScore: 92,
    tags: ['Health', 'Misinformation', 'COVID-19'],
  },
  {
    id: '3',
    title: 'Fake Government Job Posting',
    content: 'Beware of fake government job postings asking for registration fees. All government jobs are free to apply. Report such frauds immediately.',
    author: 'CommunityWatch',
    location: 'Delhi NCR',
    timestamp: '6h ago',
    upvotes: 156,
    downvotes: 2,
    commentsCount: 9,
    verificationScore: 98,
    tags: ['Job Scam', 'Fraud', 'Government'],
  },
];

export default function CommunityScreen() {
  const [posts, setPosts] = useState<CommunityPost[]>(MOCK_POSTS);
  const [filter, setFilter] = useState<'hot' | 'new' | 'verified'>('hot');

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const currentVote = post.userVote;
          let newUpvotes = post.upvotes;
          let newDownvotes = post.downvotes;
          let newUserVote: 'up' | 'down' | null = voteType;

          // Remove previous vote
          if (currentVote === 'up') newUpvotes--;
          if (currentVote === 'down') newDownvotes--;

          // Add new vote or toggle off
          if (currentVote === voteType) {
            newUserVote = null;
          } else {
            if (voteType === 'up') newUpvotes++;
            if (voteType === 'down') newDownvotes++;
          }

          return {
            ...post,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            userVote: newUserVote,
          };
        }
        return post;
      })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Local Fact-Checks & Alerts</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'hot' && styles.filterTabActive]}
          onPress={() => setFilter('hot')}
        >
          <Ionicons
            name="flame"
            size={16}
            color={filter === 'hot' ? colors.black : colors.gray400}
          />
          <Text style={[styles.filterText, filter === 'hot' && styles.filterTextActive]}>
            Hot
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'new' && styles.filterTabActive]}
          onPress={() => setFilter('new')}
        >
          <Ionicons
            name="time"
            size={16}
            color={filter === 'new' ? colors.black : colors.gray400}
          />
          <Text style={[styles.filterText, filter === 'new' && styles.filterTextActive]}>
            New
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'verified' && styles.filterTabActive]}
          onPress={() => setFilter('verified')}
        >
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={filter === 'verified' ? colors.black : colors.gray400}
          />
          <Text style={[styles.filterText, filter === 'verified' && styles.filterTextActive]}>
            Verified
          </Text>
        </TouchableOpacity>
      </View>

      {/* Community Feed */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {posts.map(post => (
          <CommunityPostCard key={post.id} post={post} onVote={handleVote} />
        ))}
      </ScrollView>

      {/* Create Post FAB */}
      <TouchableOpacity style={styles.fab} accessibilityLabel="Create new post">
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

interface CommunityPostCardProps {
  post: CommunityPost;
  onVote: (postId: string, voteType: 'up' | 'down') => void;
}

const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ post, onVote }) => {
  const verificationColor =
    post.verificationScore >= 90
      ? colors.green
      : post.verificationScore >= 70
      ? colors.amber
      : colors.red;

  return (
    <View style={styles.postCard}>
      {/* Vote Section */}
      <View style={styles.voteSection}>
        <TouchableOpacity
          style={styles.voteButton}
          onPress={() => onVote(post.id, 'up')}
          accessibilityLabel="Upvote"
        >
          <Ionicons
            name={post.userVote === 'up' ? 'arrow-up' : 'arrow-up-outline'}
            size={20}
            color={post.userVote === 'up' ? colors.green : colors.gray400}
          />
        </TouchableOpacity>
        <Text style={[styles.voteCount, post.userVote === 'up' && styles.voteCountUp]}>
          {post.upvotes - post.downvotes}
        </Text>
        <TouchableOpacity
          style={styles.voteButton}
          onPress={() => onVote(post.id, 'down')}
          accessibilityLabel="Downvote"
        >
          <Ionicons
            name={post.userVote === 'down' ? 'arrow-down' : 'arrow-down-outline'}
            size={20}
            color={post.userVote === 'down' ? colors.red : colors.gray400}
          />
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Header */}
        <View style={styles.postHeader}>
          <View style={styles.postMeta}>
            <Ionicons name="person-circle" size={16} color={colors.gray400} />
            <Text style={styles.authorText}>{post.author}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.timestampText}>{post.timestamp}</Text>
          </View>
          <View style={[styles.verificationBadge, { backgroundColor: verificationColor + '20' }]}>
            <Ionicons name="shield-checkmark" size={12} color={verificationColor} />
            <Text style={[styles.verificationText, { color: verificationColor }]}>
              {post.verificationScore}%
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.postTitle}>{post.title}</Text>

        {/* Content */}
        <Text style={styles.postContent} numberOfLines={3}>
          {post.content}
        </Text>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.postFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={12} color={colors.gray400} />
            <Text style={styles.locationText}>{post.location}</Text>
          </View>
          <TouchableOpacity style={styles.commentsButton}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.gray400} />
            <Text style={styles.commentsText}>{post.commentsCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={14} color={colors.gray400} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
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
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xs,
    backgroundColor: colors.gray100,
  },
  filterTabActive: {
    backgroundColor: colors.black,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray400,
  },
  filterTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'] + 80, // Space for FAB
  },
  postCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  voteSection: {
    alignItems: 'center',
    paddingRight: spacing.md,
    paddingTop: spacing.xs,
  },
  voteButton: {
    padding: spacing.xs,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginVertical: spacing.xs,
  },
  voteCountUp: {
    color: colors.green,
  },
  contentSection: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  authorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dotSeparator: {
    fontSize: 12,
    color: colors.gray400,
  },
  timestampText: {
    fontSize: 12,
    color: colors.gray400,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    gap: 4,
  },
  verificationText: {
    fontSize: 11,
    fontWeight: '700',
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  postContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.blueLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.blue,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: colors.gray400,
  },
  commentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  commentsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray400,
  },
  shareButton: {
    padding: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing['3xl'],
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xl,
  },
});
