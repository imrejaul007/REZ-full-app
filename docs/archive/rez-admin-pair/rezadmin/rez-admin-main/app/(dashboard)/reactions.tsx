import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import {
  reactionsAdminService,
  AdminReaction,
  ReactionStats,
  ReactionTargetType,
} from '../../services/api/reactions';
import { showAlert, showConfirm } from '../../utils/alert';

// ─── Types ───────────────────────────────────────────────────────────────────

type TargetFilter = ReactionTargetType | 'all';

// ─── Constants ───────────────────────────────────────────────────────────────

const TARGET_FILTERS: { key: TargetFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'store', label: 'Store' },
  { key: 'order', label: 'Order' },
  { key: 'campaign', label: 'Campaign' },
  { key: 'product', label: 'Product' },
];

const TARGET_COLORS: Record<string, string> = {
  store: '#3B82F6',
  order: '#8B5CF6',
  campaign: '#F59E0B',
  product: '#10B981',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getUserLabel(user?: AdminReaction['user']): string {
  if (!user) return 'Unknown user';
  const name = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ');
  return name || user.email || user.phoneNumber || user._id.slice(-6);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  bgColor,
}: {
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: bgColor }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});

function EmojiBar({ byEmoji }: { byEmoji: Array<{ emoji: string; count: number }> }) {
  if (!byEmoji.length) return null;
  const max = byEmoji[0].count;
  return (
    <View style={{ marginBottom: 8 }}>
      {byEmoji.slice(0, 6).map(({ emoji, count }) => (
        <View key={emoji} style={emojiStyles.row}>
          <Text style={emojiStyles.emoji}>{emoji}</Text>
          <View style={emojiStyles.barTrack}>
            <View style={[emojiStyles.bar, { width: `${Math.round((count / max) * 100)}%` }]} />
          </View>
          <Text style={emojiStyles.count}>{count}</Text>
        </View>
      ))}
    </View>
  );
}

const emojiStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  emoji: {
    fontSize: 18,
    width: 28,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: 8,
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  count: {
    fontSize: 12,
    color: '#6B7280',
    width: 36,
    textAlign: 'right',
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReactionsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [reactions, setReactions] = useState<AdminReaction[]>([]);
  const [stats, setStats] = useState<ReactionStats | null>(null);
  const [activeFilter, setActiveFilter] = useState<TargetFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);

  // ── Data Fetching ───────────────────────────────────────────────────────────

  const loadReactions = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (!append) setLoading(true);

        const targetType = activeFilter === 'all' ? undefined : activeFilter;
        const { reactions: items, pagination } = await reactionsAdminService.getReactions({
          page: pageNum,
          limit: 20,
          targetType,
        });

        if (!append) {
          setReactions(items);
        } else {
          setReactions((prev) => [...prev, ...items]);
        }

        setHasMore(pageNum < pagination.totalPages);
        setPage(pageNum);
      } catch {
        showAlert('Error', 'Failed to load reactions');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter]
  );

  const loadStats = useCallback(async () => {
    try {
      const data = await reactionsAdminService.getStats();
      setStats(data);
    } catch {
      // stats are non-blocking
    }
  }, []);

  useEffect(() => {
    loadReactions(1);
  }, [loadReactions]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
    loadReactions(1);
  }, [loadStats, loadReactions]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    (item: AdminReaction) => {
      showConfirm(
        'Remove Reaction?',
        `Remove this ${item.emoji} reaction by ${getUserLabel(item.user)}?`,
        async () => {
          setDeletingId(item._id);
          try {
            await reactionsAdminService.deleteReaction(item._id);
            setReactions((prev) => prev.filter((r) => r._id !== item._id));
            if (stats) {
              setStats((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev));
            }
          } catch {
            showAlert('Error', 'Failed to remove reaction');
          } finally {
            setDeletingId(null);
          }
        },
        'Remove'
      );
    },
    [stats]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: AdminReaction }) => {
      const isDeleting = deletingId === item._id;
      const targetColor = TARGET_COLORS[item.targetType] ?? '#6B7280';

      return (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Row 1: emoji + target badge + date */}
          <View style={styles.rowBetween}>
            <View style={styles.emojiRow}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={[styles.targetBadge, { backgroundColor: targetColor + '22' }]}>
                <Text style={[styles.targetBadgeText, { color: targetColor }]}>
                  {item.targetType.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 11, color: colors.tabIconDefault }}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

          {/* Row 2: user info */}
          <Text style={[styles.userText, { color: colors.text }]}>
            <Ionicons name="person-outline" size={12} color={colors.tabIconDefault} />{' '}
            {getUserLabel(item.user)}
          </Text>

          {/* Row 3: target ID (truncated) */}
          <Text style={{ fontSize: 11, color: colors.tabIconDefault, marginTop: 2 }}>
            Target: {item.targetId?.toString().slice(-8) ?? '—'}
          </Text>

          {/* Delete button */}
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            disabled={isDeleting}
            style={styles.deleteBtn}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [colors, deletingId, handleDelete]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Reactions</Text>
            <Text style={{ fontSize: 13, color: colors.tabIconDefault, marginTop: 2 }}>
              {stats ? `${stats.total.toLocaleString()} total reactions` : 'Loading stats...'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowStats((v) => !v)} style={styles.toggleBtn}>
            <Ionicons
              name={showStats ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.tint}
            />
          </TouchableOpacity>
        </View>

        {/* Stats panel */}
        {showStats && stats && (
          <View style={{ marginTop: 12 }}>
            {/* Summary row */}
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <StatCard
                label="Total"
                value={stats.total.toLocaleString()}
                color="#6366F1"
                bgColor="#EEF2FF"
              />
              <StatCard
                label="Types"
                value={stats.byTargetType.length}
                color="#10B981"
                bgColor="#ECFDF5"
              />
              <StatCard
                label="Emojis"
                value={stats.byEmoji.length}
                color="#F59E0B"
                bgColor="#FFFBEB"
              />
            </View>

            {/* Emoji breakdown */}
            {stats.byEmoji.length > 0 && (
              <View style={[styles.statsBox, { backgroundColor: colors.card }]}>
                <Text style={[styles.statsBoxTitle, { color: colors.text }]}>Emoji Breakdown</Text>
                <EmojiBar byEmoji={stats.byEmoji} />
              </View>
            )}
          </View>
        )}

        {/* Type filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12, marginBottom: 4 }}
        >
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {TARGET_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={[
                  styles.pill,
                  { backgroundColor: activeFilter === f.key ? colors.tint : colors.card },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: activeFilter === f.key ? '#fff' : colors.text,
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* List */}
      {loading && reactions.length === 0 ? (
        <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reactions}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }
          onEndReached={() => hasMore && !loading && loadReactions(page + 1, true)}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loading && reactions.length > 0 ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={colors.tint} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color={colors.tabIconDefault} />
              <Text style={{ color: colors.tabIconDefault, marginTop: 12, textAlign: 'center' }}>
                No {activeFilter === 'all' ? '' : activeFilter + ' '}reactions found
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleBtn: {
    padding: 6,
  },
  statsBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  statsBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 22,
  },
  targetBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  userText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  deleteBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
});
