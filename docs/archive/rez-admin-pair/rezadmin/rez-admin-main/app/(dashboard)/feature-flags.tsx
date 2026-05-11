import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Switch,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { apiClient } from '../../services/api/apiClient';
import { showAlert, showConfirm } from '../../utils/alert';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_ROLES } from '../../constants/roles';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FeatureFlag {
  _id: string;
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
  environments: string[];
  updatedAt: string;
  updatedBy?: string;
}

interface MerchantOverride {
  _id: string;
  merchantId: string;
  flagKey: string;
  value: boolean;
  expiresAt?: string;
  updatedAt: string;
  createdAt: string;
}

interface OverridePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

type Tab = 'global' | 'merchant';

// ─── Global Flags Tab ──────────────────────────────────────────────────────────

function GlobalFlagsTab() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterEnv, setFilterEnv] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // M17 FIX: removed hardcoded X-App-Version; apiClient already sends it from expo-constants
      const response = await apiClient.get('admin/feature-flags');
      if (response?.success && (response?.data as any)?.flags) {
        setFlags((response.data as any)?.flags ?? []);
      } else {
        setError(response?.message || 'Failed to load feature flags');
        showAlert('Error', response?.message || 'Failed to load feature flags');
      }
    } catch (err: any) {
      const msg = 'Failed to load feature flags: ' + (err?.message || '');
      setError(msg);
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const performToggleFlag = async (flag: FeatureFlag) => {
    setUpdating(flag._id);
    const prev = flags;
    // BUG-023: Use functional setState form to avoid stale closure — `flags` captured
    // in performToggleFlag's scope may be stale if state has changed since the last render.
    setFlags((prev) => prev.map((f) => (f._id === flag._id ? { ...f, enabled: !f.enabled } : f)));
    try {
      const response = await apiClient.patch(`admin/feature-flags/${flag.key}`, {
        enabled: !flag.enabled,
      });
      if (response?.success) {
        setFlags((current) =>
          current.map((f) =>
            f._id === flag._id ? { ...f, ...((response.data as any)?.flag ?? {}) } : f
          )
        );
        showAlert('Success', `${flag.key} ${!flag.enabled ? 'enabled' : 'disabled'}`);
      } else {
        setFlags(prev);
        showAlert('Error', response?.message || 'Failed to update flag');
      }
    } catch (err: any) {
      setFlags(prev);
      showAlert('Error', 'Failed to update flag: ' + (err?.message || ''));
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag) => {
    if (flag.enabled) {
      const confirmed = await showConfirm(
        `Disable ${flag.key}?`,
        'This will affect all users. Confirm to disable.'
      );
      if (!confirmed) return;
    } else {
      const confirmed = await showConfirm(
        `Enable ${flag.key}?`,
        'This will roll out the feature to users. Confirm to enable.'
      );
      if (!confirmed) return;
    }
    performToggleFlag(flag);
  };

  const handleRolloutChange = async (flag: FeatureFlag, pct: number) => {
    const confirmed = await showConfirm(
      'Confirm Rollout Change',
      `Change "${flag.key}" rollout to ${pct}%?`
    );
    if (!confirmed) return;

    setUpdating(flag._id);
    const prev = flags;
    setFlags((current) =>
      current.map((f) => (f._id === flag._id ? { ...f, rolloutPercentage: pct } : f))
    );
    try {
      const response = await apiClient.patch(`admin/feature-flags/${flag.key}`, {
        rolloutPercentage: pct,
      });
      if (response?.success) {
        setFlags((current) =>
          current.map((f) =>
            f._id === flag._id ? { ...f, ...((response.data as any)?.flag ?? {}) } : f
          )
        );
      } else {
        setFlags(prev);
        showAlert('Error', response?.message || 'Failed to update rollout');
      }
    } catch {
      setFlags(prev);
    } finally {
      setUpdating(null);
    }
  };

  const filteredFlags =
    filterEnv === 'all' ? flags : flags.filter((f) => f.environments.includes(filterEnv));

  const renderFlag = ({ item: flag }: { item: FeatureFlag }) => {
    const isLoading = updating === flag._id;
    return (
      <View style={[styles.flagCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.flagHeader}>
          <View style={styles.flagInfo}>
            <Text style={[styles.flagKey, { color: colors.text }]}>{flag.key}</Text>
            <Text style={[styles.flagDesc, { color: colors.secondaryText }]}>
              {flag.description}
            </Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.tint} />
          ) : (
            <Switch
              value={flag.enabled}
              onValueChange={() => handleToggleFlag(flag)}
              trackColor={{ false: '#767577', true: '#81C784' }}
              thumbColor={flag.enabled ? '#4CAF50' : '#f4f3f4'}
            />
          )}
        </View>

        {flag.enabled && (
          <View style={[styles.rolloutContainer, { backgroundColor: colors.tint + '10' }]}>
            <Text style={[styles.rolloutText, { color: colors.text }]}>
              Rollout: {flag.rolloutPercentage}%
            </Text>
            <View style={[styles.rolloutBar, { backgroundColor: colors.tint + '30' }]}>
              <View
                style={[
                  styles.rolloutFill,
                  { width: `${flag.rolloutPercentage}%`, backgroundColor: colors.tint },
                ]}
              />
            </View>
            <View style={styles.rolloutControls}>
              {[0, 25, 50, 75, 100].map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[
                    styles.rolloutButton,
                    flag.rolloutPercentage === pct && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => handleRolloutChange(flag, pct)}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.rolloutButtonText,
                      flag.rolloutPercentage === pct && { color: 'white' },
                    ]}
                  >
                    {pct}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.flagMeta, { borderTopColor: colors.border }]}>
          <View style={styles.envBadges}>
            {flag.environments.map((env) => (
              <View
                key={env}
                style={[
                  styles.envBadge,
                  {
                    backgroundColor:
                      env === 'production'
                        ? '#FF6B6B20'
                        : env === 'staging'
                          ? '#FFC93C20'
                          : '#4ECDC420',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.envBadgeText,
                    {
                      color:
                        env === 'production'
                          ? '#FF6B6B'
                          : env === 'staging'
                            ? '#FFC93C'
                            : '#4ECDC4',
                    },
                  ]}
                >
                  {env}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.updated, { color: colors.secondaryText }]}>
            {new Date(flag.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.error }]}>Unable to Load Flags</Text>
        <Text style={[styles.errorMsg, { color: colors.secondaryText }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.tint }]}
          onPress={loadFlags}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {/* Env filter */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'development', 'staging', 'production'].map((env) => (
            <TouchableOpacity
              key={env}
              style={[styles.filterChip, filterEnv === env && { backgroundColor: colors.tint }]}
              onPress={() => setFilterEnv(env)}
            >
              <Text style={[styles.filterChipText, filterEnv === env && { color: 'white' }]}>
                {env.charAt(0).toUpperCase() + env.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredFlags}
        renderItem={renderFlag}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="flag-outline" size={40} color={colors.secondaryText} />
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No flags found</Text>
          </View>
        }
      />
    </>
  );
}

// ─── Merchant Overrides Tab ────────────────────────────────────────────────────

function MerchantOverridesTab() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [overrides, setOverrides] = useState<MerchantOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<OverridePagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadOverrides = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`admin/system/merchant-flag-overrides?page=${p}&limit=20`);
      if (res?.success && res?.data) {
        setOverrides((res.data as any).overrides || []);
        setPagination((res.data as any).pagination || { page: p, limit: 20, total: 0, pages: 0 });
        setPage(p);
      }
    } catch (err: any) {
      showAlert('Error', 'Failed to load merchant overrides: ' + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverrides(1);
  }, [loadOverrides]);

  // Group overrides by merchantId
  const grouped = React.useMemo(() => {
    const map: Record<string, MerchantOverride[]> = {};
    for (const o of overrides) {
      if (!map[o.merchantId]) map[o.merchantId] = [];
      map[o.merchantId].push(o);
    }
    const entries = Object.entries(map);
    if (!search.trim()) return entries;
    return entries.filter(([mid]) => mid.toLowerCase().includes(search.toLowerCase()));
  }, [overrides, search]);

  const renderMerchantGroup = ({ item }: { item: [string, MerchantOverride[]] }) => {
    const [merchantId, flags] = item;
    const hasExpired = flags.some((f) => f.expiresAt && new Date(f.expiresAt) < new Date());
    return (
      <TouchableOpacity
        style={[styles.flagCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/(dashboard)/merchant-flags/${merchantId}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.merchantRow}>
          <View style={[styles.merchantIcon, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="storefront" size={18} color={colors.tint} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.merchantId, { color: colors.text }]} numberOfLines={1}>
              {merchantId}
            </Text>
            <Text style={[styles.merchantSub, { color: colors.secondaryText }]}>
              {flags.length} flag{flags.length !== 1 ? 's' : ''} overridden
              {hasExpired ? '  ·  ⚠ has expired' : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.secondaryText} />
        </View>

        {/* Flag pills */}
        <View style={styles.flagPills}>
          {flags.slice(0, 5).map((f) => (
            <View
              key={f._id}
              style={[styles.flagPill, { backgroundColor: f.value ? '#D1FAE5' : '#FEE2E2' }]}
            >
              <View
                style={[styles.pillDot, { backgroundColor: f.value ? '#059669' : '#DC2626' }]}
              />
              <Text
                style={[styles.pillText, { color: f.value ? '#065F46' : '#991B1B' }]}
                numberOfLines={1}
              >
                {f.flagKey}
              </Text>
            </View>
          ))}
          {flags.length > 5 && (
            <View style={[styles.flagPill, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.pillText, { color: colors.secondaryText }]}>
                +{flags.length - 5} more
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.updated, { color: colors.secondaryText, marginTop: 4 }]}>
          Last updated {new Date(flags[0].updatedAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <>
      {/* Search */}
      <View
        style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Ionicons name="search" size={16} color={colors.secondaryText} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by merchant ID…"
          placeholderTextColor={colors.secondaryText}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats row */}
      <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.statsText, { color: colors.secondaryText }]}>
          {pagination.total} merchant{pagination.total !== 1 ? 's' : ''} with overrides
          {search ? `  ·  ${grouped.length} matching` : ''}
        </Text>
        <TouchableOpacity onPress={() => loadOverrides(1)}>
          <Ionicons name="refresh" size={16} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={grouped}
        renderItem={renderMerchantGroup}
        keyExtractor={([mid]) => mid}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="shield-checkmark-outline" size={44} color={colors.secondaryText} />
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              {search ? 'No merchants match your search' : 'No merchant overrides set'}
            </Text>
            <Text style={[styles.emptySubText, { color: colors.secondaryText }]}>
              All merchants are using global flag defaults
            </Text>
          </View>
        }
      />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, { opacity: page <= 1 ? 0.4 : 1 }]}
            onPress={() => loadOverrides(page - 1)}
            disabled={page <= 1}
          >
            <Ionicons name="chevron-back" size={16} color={colors.tint} />
          </TouchableOpacity>
          <Text style={[styles.pageLabel, { color: colors.secondaryText }]}>
            Page {page} of {pagination.pages}
          </Text>
          <TouchableOpacity
            style={[styles.pageBtn, { opacity: page >= pagination.pages ? 0.4 : 1 }]}
            onPress={() => loadOverrides(page + 1)}
            disabled={page >= pagination.pages}
          >
            <Ionicons name="chevron-forward" size={16} color={colors.tint} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function FeatureFlagsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<Tab>('global');
  const { hasRole } = useAuth();

  // Require admin or super_admin role
  if (!hasRole(ADMIN_ROLES.ADMIN)) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Ionicons name="lock-closed-outline" size={48} color={colors.secondaryText} />
        <Text style={[styles.title, { color: colors.text, marginTop: 16, textAlign: 'center' }]}>
          Access Denied
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.secondaryText, textAlign: 'center', paddingHorizontal: 32 },
          ]}
        >
          You need Admin or Super Admin privileges to access Feature Flags.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Feature Flags</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Global rollout controls + per-merchant overrides
          </Text>
        </View>
      </View>

      {/* Tab bar */}
      <View
        style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        {(['global', 'merchant'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'global' ? 'globe-outline' : 'storefront-outline'}
              size={15}
              color={activeTab === tab ? colors.tint : colors.secondaryText}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.tint : colors.secondaryText },
              ]}
            >
              {tab === 'global' ? 'Global Flags' : 'Merchant Overrides'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'global' ? <GlobalFlagsTab /> : <MerchantOverridesTab />}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 13, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },

  errorTitle: { fontSize: 17, fontWeight: '700', marginTop: 10 },
  errorMsg: { fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

  filterRow: { paddingVertical: 10, paddingHorizontal: 14 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#333' },

  listContent: { padding: 14 },

  flagCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  flagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  flagInfo: { flex: 1, marginRight: 12 },
  flagKey: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace', marginBottom: 3 },
  flagDesc: { fontSize: 12 },

  rolloutContainer: { padding: 10, borderRadius: 8, marginBottom: 10 },
  rolloutText: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  rolloutBar: { height: 6, borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  rolloutFill: { height: '100%' },
  rolloutControls: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  rolloutButton: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  rolloutButtonText: { fontSize: 10, fontWeight: '600', color: '#666' },

  flagMeta: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  envBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  envBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  envBadgeText: { fontSize: 10, fontWeight: '600' },
  updated: { fontSize: 11 },

  emptyText: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptySubText: { fontSize: 12, marginTop: 4, textAlign: 'center' },

  // Merchant overrides tab
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statsText: { fontSize: 12 },

  merchantRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  merchantIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantId: { fontSize: 13, fontWeight: '700' },
  merchantSub: { fontSize: 12, marginTop: 2 },

  flagPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 4 },
  flagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
    maxWidth: 160,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '600' },

  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  pageBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },
  pageLabel: { fontSize: 13 },
});
