import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { apiClient } from '../../services/api/apiClient';
import { useAdminSocket } from '../../hooks/useAdminSocket';

/**
 * Merchant Live Status Screen
 * Real-time overview of all online merchants — active sessions, pending orders,
 * broadcast queues, and health scores.
 *
 * Data: REST poll every 30s + WebSocket events for live session changes.
 */

interface MerchantLiveEntry {
  merchantId: string;
  businessName: string;
  city: string;
  activeSessions: number;
  pendingOrders: number;
  broadcastQueueDepth: number;
  healthScore: number | null;
  lastSeenAt: string;
  status: 'online' | 'idle' | 'offline';
}

interface LiveStatusSummary {
  totalOnline: number;
  totalIdle: number;
  totalOffline: number;
  totalActiveSessions: number;
  totalPendingOrders: number;
  generatedAt: string;
}

type SortKey = 'activeSessions' | 'pendingOrders' | 'healthScore' | 'businessName';

export default function MerchantLiveStatusScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [merchants, setMerchants] = useState<MerchantLiveEntry[]>([]);
  const [summary, setSummary] = useState<LiveStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('activeSessions');
  const [filter, setFilter] = useState<'all' | 'online' | 'idle' | 'offline'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);

  // ── Socket: live events ──────────────────────────
  // NOTE: 'merchant:session:change' and 'merchant:order:change' events have no
  // backend emitter yet. The component relies on polling via fetchData instead.
  const { connected: isConnected } = useAdminSocket();

  const fetchData = useCallback(async () => {
    // Guard against concurrent requests
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const res = await apiClient.get<{
        merchants: MerchantLiveEntry[];
        summary: LiveStatusSummary;
      }>('admin/system/merchant-live-status');
      if (res.success && res.data) {
        setMerchants(res.data?.merchants ?? []);
        setSummary(res.data?.summary ?? null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      logger.warn('[MerchantLiveStatus] fetch failed', err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(() => {
      // Skip if a fetch is already in-flight
      if (!isFetchingRef.current) {
        fetchData();
      }
    }, 30_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  // ── Derived list ──────────────────────────────────────────────────────────
  const filtered = merchants.filter((m) => filter === 'all' || m.status === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'businessName') return a.businessName.localeCompare(b.businessName);
    if (sortBy === 'healthScore') return (b.healthScore ?? 0) - (a.healthScore ?? 0);
    return (b[sortBy] as number) - (a[sortBy] as number);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const statusColor = (s: MerchantLiveEntry['status']) => {
    if (s === 'online') return colors.greenDark ?? '#22c55e';
    if (s === 'idle') return '#f59e0b';
    return '#94a3b8';
  };

  const statusIcon = (s: MerchantLiveEntry['status']) => {
    if (s === 'online') return 'ellipse';
    if (s === 'idle') return 'ellipse-outline';
    return 'remove-circle-outline';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={(colors as any).primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading live status…
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Merchant Live Status</Text>
        <View style={styles.headerRight}>
          {isConnected ? (
            <View style={styles.liveBadge}>
              <View style={[styles.liveDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : (
            <Text style={[styles.pollingText, { color: colors.textSecondary }]}>Polling 30s</Text>
          )}
        </View>
      </View>

      {/* Summary Cards */}
      {summary && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.summaryRow}
          contentContainerStyle={styles.summaryContent}
        >
          {[
            { label: 'Online', value: summary.totalOnline, color: '#22c55e' },
            { label: 'Idle', value: summary.totalIdle, color: '#f59e0b' },
            { label: 'Offline', value: summary.totalOffline, color: '#94a3b8' },
            {
              label: 'Active Sessions',
              value: summary.totalActiveSessions,
              color: (colors as any).primary,
            },
            { label: 'Pending Orders', value: summary.totalPendingOrders, color: '#f97316' },
          ].map((c) => (
            <View
              key={c.label}
              style={[
                styles.summaryCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.summaryValue, { color: c.color }]}>{c.value}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{c.label}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Filter + Sort */}
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'online', 'idle', 'offline'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                filter === f && { backgroundColor: (colors as any).primary },
              ]}
            >
              <Text
                style={[styles.filterText, { color: filter === f ? '#fff' : colors.textSecondary }]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.sortDivider} />
          {(['activeSessions', 'pendingOrders', 'healthScore', 'businessName'] as SortKey[]).map(
            (s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSortBy(s)}
                style={[
                  styles.filterChip,
                  sortBy === s && { backgroundColor: (colors as any).secondary ?? '#6366f1' },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: sortBy === s ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {s === 'activeSessions'
                    ? 'Sessions'
                    : s === 'pendingOrders'
                      ? 'Orders'
                      : s === 'healthScore'
                        ? 'Health'
                        : 'Name'}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {/* Merchant List */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.merchantId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No merchants matching this filter
            </Text>
          </View>
        }
        ListFooterComponent={
          lastUpdated ? (
            <Text style={[styles.updatedAt, { color: colors.textSecondary }]}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.merchantCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.merchantHeader}>
              <Ionicons
                name={statusIcon(item.status)}
                size={14}
                color={statusColor(item.status)}
                style={styles.statusDot}
              />
              <Text style={[styles.merchantName, { color: colors.text }]} numberOfLines={1}>
                {item.businessName}
              </Text>
              <Text style={[styles.merchantCity, { color: colors.textSecondary }]}>
                {item.city}
              </Text>
            </View>
            <View style={styles.merchantStats}>
              {[
                {
                  icon: 'people-outline',
                  label: 'Sessions',
                  value: item.activeSessions,
                  warn: item.activeSessions > 10,
                },
                {
                  icon: 'receipt-outline',
                  label: 'Orders',
                  value: item.pendingOrders,
                  warn: item.pendingOrders > 5,
                },
                {
                  icon: 'megaphone-outline',
                  label: 'Queue',
                  value: item.broadcastQueueDepth,
                  warn: item.broadcastQueueDepth > 20,
                },
                {
                  icon: 'pulse-outline',
                  label: 'Health',
                  value: item.healthScore != null ? `${item.healthScore}%` : 'N/A',
                  warn: item.healthScore != null && item.healthScore < 40,
                },
              ].map((stat) => (
                <View key={stat.label} style={styles.stat}>
                  <Ionicons
                    name={stat.icon as any}
                    size={14}
                    color={stat.warn ? '#f97316' : colors.textSecondary}
                  />
                  <Text style={[styles.statValue, { color: stat.warn ? '#f97316' : colors.text }]}>
                    {stat.value}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: '700', color: '#16a34a', letterSpacing: 1 },
  pollingText: { fontSize: 12 },
  summaryRow: { maxHeight: 80 },
  summaryContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  summaryCard: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 80,
  },
  summaryValue: { fontSize: 22, fontWeight: '700' },
  summaryLabel: { fontSize: 11, marginTop: 2 },
  controls: { paddingHorizontal: 12, paddingVertical: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  filterText: { fontSize: 12, fontWeight: '500' },
  sortDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
    height: 24,
    alignSelf: 'center',
  },
  listContent: { padding: 12, gap: 8, paddingBottom: 32 },
  merchantCard: { borderRadius: 10, padding: 12, borderWidth: 1 },
  merchantHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusDot: { marginRight: 6 },
  merchantName: { flex: 1, fontSize: 14, fontWeight: '600' },
  merchantCity: { fontSize: 12, marginLeft: 6 },
  merchantStats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 15, fontWeight: '700' },
  statLabel: { fontSize: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14 },
  updatedAt: { textAlign: 'center', fontSize: 11, paddingVertical: 12 },
});
