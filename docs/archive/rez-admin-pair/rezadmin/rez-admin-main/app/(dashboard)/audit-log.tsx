/**
 * app/(dashboard)/audit-log.tsx
 *
 * Admin Audit Log Screen
 * - Timeline of admin actions with icons by type
 * - Filter by action type
 * - Search by admin name or target
 * - Infinite scroll (load more)
 * - Export to CSV
 */

import React, { useState, useCallback, useRef } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import { apiClient } from '../../services/api/apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditEntry {
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  createdAt: string;
}

type ActionFilter =
  | 'all'
  | 'suspend'
  | 'approve'
  | 'reject'
  | 'broadcast'
  | 'clear'
  | 'coin_sync'
  | 'pms_sync'
  | 'ota_sync';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  suspend: 'ban',
  approve: 'checkmark-circle',
  reject: 'close-circle',
  broadcast: 'megaphone',
  clear: 'lock-open',
  coin_sync: 'wallet',
  pms_sync: 'sync',
  ota_sync: 'bed',
};

const ACTION_COLORS: Record<string, string> = {
  suspend: '#EF4444',
  approve: '#10B981',
  reject: '#F59E0B',
  broadcast: '#6366F1',
  clear: '#06B6D4',
  coin_sync: '#7C3AED',
  pms_sync: '#0891B2',
  ota_sync: '#0891B2',
};

const ACTION_EMOJI: Record<string, string> = {
  suspend: 'suspend',
  approve: 'approve',
  reject: 'reject',
  broadcast: 'broadcast',
  clear: 'clear',
};

function getActionKey(action: string): string {
  const lower = action.toLowerCase();
  for (const key of Object.keys(ACTION_ICONS)) {
    if (lower.includes(key)) return key;
  }
  return 'approve';
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffH = Math.floor(diffMins / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const FILTER_OPTIONS: { key: ActionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'suspend', label: 'Suspend' },
  { key: 'approve', label: 'Approve' },
  { key: 'reject', label: 'Reject' },
  { key: 'broadcast', label: 'Broadcast' },
  { key: 'clear', label: 'Clear' },
  { key: 'coin_sync', label: 'Coin Sync' },
  { key: 'pms_sync', label: 'PMS Sync' },
  { key: 'ota_sync', label: 'OTA Sync' },
];

const PAGE_SIZE = 30;

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AuditLogScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ActionFilter>('all');
  const [exporting, setExporting] = useState(false);

  const fetchPage = useCallback(async (pageNum: number, reset = false) => {
    try {
      const res = await apiClient.get<AuditEntry[]>(
        `admin/audit-log?page=${pageNum}&limit=${PAGE_SIZE}`
      );
      if (res.success && res.data) {
        const incoming = res.data;
        setEntries((prev) => (reset ? incoming : [...prev, ...incoming]));
        setHasMore(incoming.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      logger.error('Audit log fetch error:', err.message);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      fetchPage(1, true);
    }, [fetchPage])
  );

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    fetchPage(next, false);
  }, [loadingMore, hasMore, page, fetchPage]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      // Use apiClient to ensure auth token is sent with the export request
      const res = await apiClient.get<any>('admin/export/audit-log');
      if (res.success && res.data?.downloadUrl) {
        await Linking.openURL(res.data.downloadUrl);
      } else {
        Alert.alert(
          'Export',
          res.message || 'Export request sent. Check your email for the download link.'
        );
      }
    } catch {
      Alert.alert('Export Failed', 'Unable to export audit log.');
    } finally {
      setExporting(false);
    }
  }, []);

  // Client-side filter + search
  const filteredEntries = entries.filter((e) => {
    const matchesFilter = filter === 'all' || e.action.toLowerCase().includes(filter);
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      e.adminName.toLowerCase().includes(q) ||
      e.targetId.toLowerCase().includes(q) ||
      e.detail.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const renderEntry = ({ item, index }: { item: AuditEntry; index: number }) => {
    const actionKey = getActionKey(item.action);
    const icon = ACTION_ICONS[actionKey] ?? 'ellipse';
    const iconColor = ACTION_COLORS[actionKey] ?? colors.icon;

    return (
      <View style={[styles.entryRow, { borderLeftColor: iconColor }]}>
        {/* Timeline dot */}
        <View
          style={[
            styles.timelineDot,
            { backgroundColor: `${iconColor}20`, borderColor: iconColor },
          ]}
        >
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <Text style={[styles.entryAdmin, { color: colors.text }]}>{item.adminName}</Text>
            <Text style={[styles.entryTime, { color: colors.icon }]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
          <View style={styles.entryActionRow}>
            <View style={[styles.actionBadge, { backgroundColor: `${iconColor}15` }]}>
              <Text style={[styles.actionBadgeText, { color: iconColor }]}>
                {item.action.replace(/_/g, ' ')}
              </Text>
            </View>
            <Text style={[styles.entryTarget, { color: colors.icon }]}>
              {item.targetType}: {item.targetId}
            </Text>
          </View>
          {item.detail ? (
            <Text style={[styles.entryDetail, { color: colors.secondaryText }]} numberOfLines={2}>
              {item.detail}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  const ListHeader = (
    <>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Audit Log</Text>
          <Text style={styles.headerSub}>Admin action history</Text>
        </View>
        <TouchableOpacity
          style={[styles.exportBtn, exporting && { opacity: 0.6 }]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={14} color="#fff" />
              <Text style={styles.exportBtnText}>Export</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={16} color={colors.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search admin name or target..."
          placeholderTextColor={colors.icon}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === opt.key ? colors.tint : colors.card,
                borderColor: filter === opt.key ? colors.tint : colors.border,
              },
            ]}
            onPress={() => setFilter(opt.key)}
          >
            <Text
              style={[styles.filterChipText, { color: filter === opt.key ? '#fff' : colors.text }]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count */}
      <Text style={[styles.countText, { color: colors.icon }]}>
        {filteredEntries.length} entries
        {filter !== 'all' || search ? ' (filtered)' : ''}
      </Text>
    </>
  );

  const ListFooter = loadingMore ? (
    <View style={styles.loadMoreIndicator}>
      <ActivityIndicator size="small" color={colors.tint} />
    </View>
  ) : !hasMore && entries.length > 0 ? (
    <Text style={[styles.endText, { color: colors.icon }]}>End of audit log</Text>
  ) : null;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading audit log...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredEntries}
        keyExtractor={(item, index) => `${item.adminId}-${item.createdAt}-${index}`}
        renderItem={renderEntry}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>No audit entries found</Text>
          </View>
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  exportBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 14,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14 },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },

  countText: { fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },

  entryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 3,
    marginLeft: 16,
    gap: 12,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  entryContent: { flex: 1 },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryAdmin: { fontSize: 14, fontWeight: '600' },
  entryTime: { fontSize: 11 },
  entryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  entryTarget: { fontSize: 12 },
  entryDetail: { fontSize: 12, lineHeight: 17 },

  separator: { height: StyleSheet.hairlineWidth, marginLeft: 72 },

  loadMoreIndicator: { padding: 16, alignItems: 'center' },
  endText: { fontSize: 12, textAlign: 'center', padding: 16 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 14 },
});
