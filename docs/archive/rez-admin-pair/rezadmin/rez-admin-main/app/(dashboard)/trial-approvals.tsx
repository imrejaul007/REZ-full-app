import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Platform,
  ScrollView,
  StatusBar as RNStatusBar,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  adminTrialsService,
  PendingTrial,
  FraudAlert,
  BreakageStats,
  DiscoveryCampaign,
  TrialBundle,
} from '@/services/api/trials';
import { Colors } from '@/constants/Colors';
import { showAlert, showConfirm } from '@/utils/alert';

type TabKey = 'approvals' | 'fraud' | 'breakage' | 'governor' | 'campaigns' | 'bundles';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'approvals', label: 'Approvals', icon: 'checkmark-circle' },
  { key: 'fraud', label: 'Fraud', icon: 'warning' },
  { key: 'breakage', label: 'Breakage', icon: 'trending-down' },
  { key: 'governor', label: 'Governor', icon: 'shield' },
  { key: 'campaigns', label: 'Campaigns', icon: 'megaphone' },
  { key: 'bundles', label: 'Bundles', icon: 'cube' },
];

export default function TrialApprovalsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('approvals');

  // ── Approvals state ──
  const [trials, setTrials] = useState<PendingTrial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<PendingTrial | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fraud state ──
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [fraudLoading, setFraudLoading] = useState(false);

  // ── Breakage state ──
  const [breakageStats, setBreakageStats] = useState<BreakageStats | null>(null);
  const [breakageLoading, setBreakageLoading] = useState(false);

  // ── Governor state ──
  const [governorLoading, setGovernorLoading] = useState(false);

  // ── Campaigns state ──
  const [campaigns, setCampaigns] = useState<DiscoveryCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // ── Bundles state ──
  const [bundles, setBundles] = useState<TrialBundle[]>([]);
  const [bundlesLoading, setBundlesLoading] = useState(false);

  // ═══════════ DATA LOADERS ═══════════

  const loadTrials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminTrialsService.getPendingTrials({ page: 1, limit: 50 });
      if (response.success && response.data) {
        setTrials(response.data.trials || []);
      }
    } catch (err) {
      logger.error('Failed to load trials:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFraudAlerts = useCallback(async () => {
    try {
      setFraudLoading(true);
      const response = await adminTrialsService.getFraudAlerts({ page: 1, limit: 50 });
      if (response.success && response.data) {
        setFraudAlerts(response.data.alerts || []);
      }
    } catch (err) {
      logger.error('Failed to load fraud alerts:', err);
    } finally {
      setFraudLoading(false);
    }
  }, []);

  const loadBreakage = useCallback(async () => {
    try {
      setBreakageLoading(true);
      const response = await adminTrialsService.getBreakageStats();
      if (response.success && response.data) {
        setBreakageStats(response.data.stats || null);
      }
    } catch (err) {
      logger.error('Failed to load breakage stats:', err);
    } finally {
      setBreakageLoading(false);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      setCampaignsLoading(true);
      const response = await adminTrialsService.listDiscoveryCampaigns();
      if (response.success && response.data) {
        setCampaigns(response.data.campaigns || []);
      }
    } catch (err) {
      logger.error('Failed to load campaigns:', err);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  const loadBundles = useCallback(async () => {
    try {
      setBundlesLoading(true);
      const response = await adminTrialsService.listBundles();
      if (response.success && response.data) {
        setBundles(response.data.bundles || []);
      }
    } catch (err) {
      logger.error('Failed to load bundles:', err);
    } finally {
      setBundlesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrials();
  }, [loadTrials]);

  useEffect(() => {
    if (activeTab === 'fraud' && fraudAlerts.length === 0 && !fraudLoading) loadFraudAlerts();
    if (activeTab === 'breakage' && !breakageStats && !breakageLoading) loadBreakage();
    if (activeTab === 'campaigns' && campaigns.length === 0 && !campaignsLoading) loadCampaigns();
    if (activeTab === 'bundles' && bundles.length === 0 && !bundlesLoading) loadBundles();
  }, [activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'approvals') await loadTrials();
      else if (activeTab === 'fraud') await loadFraudAlerts();
      else if (activeTab === 'breakage') await loadBreakage();
      else if (activeTab === 'campaigns') await loadCampaigns();
      else if (activeTab === 'bundles') await loadBundles();
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

  // ═══════════ APPROVAL ACTIONS ═══════════

  const handleApprove = async (trial: PendingTrial) => {
    const confirmed = await showConfirm(
      'Approve Trial?',
      `Are you sure you want to approve "${trial.title}" from ${trial.merchantName}?`
    );
    if (confirmed) await doApprove(trial);
  };

  const doApprove = async (trial: PendingTrial) => {
    setActionLoading(true);
    try {
      const response = await adminTrialsService.approveTrial(trial._id, { approved: true });
      if (response.success) {
        setTrials((prev) => prev.filter((t) => t._id !== trial._id));
        setShowDetail(false);
        showAlert('Success', 'Trial approved!');
      }
    } catch (err) {
      showAlert('Error', 'Failed to approve trial');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      showAlert('Required', 'Please provide a rejection reason');
      return;
    }
    doReject();
  };

  const doReject = async () => {
    if (!selectedTrial) return;
    setActionLoading(true);
    try {
      const response = await adminTrialsService.approveTrial(selectedTrial._id, {
        approved: false,
        reason: rejectReason,
      });
      if (response.success) {
        setTrials((prev) => prev.filter((t) => t._id !== selectedTrial._id));
        setShowRejectModal(false);
        setRejectReason('');
        setShowDetail(false);
        showAlert('Success', 'Trial rejected');
      }
    } catch (err) {
      showAlert('Error', 'Failed to reject trial');
    } finally {
      setActionLoading(false);
    }
  };

  // ═══════════ GOVERNOR ACTIONS ═══════════

  const executeGovernorAction = async (action: string, label: string, params?: any) => {
    const confirmed = await showConfirm(
      'Confirm Action',
      `Execute "${label}"? This will take effect immediately.`
    );
    if (!confirmed) return;

    setGovernorLoading(true);
    try {
      const response = await adminTrialsService.executeGovernorAction({ action, ...params });
      if (response.success) {
        showAlert('Success', (response.data as any)?.message || `${label} executed`);
      }
    } catch (err) {
      showAlert('Error', `Failed to execute ${label}`);
    } finally {
      setGovernorLoading(false);
    }
  };

  // ═══════════ BUNDLE ACTIONS ═══════════

  const toggleBundleActive = async (bundle: TrialBundle) => {
    try {
      const response = await adminTrialsService.updateBundle(bundle._id, {
        isActive: !bundle.isActive,
      });
      if (response.success) {
        setBundles((prev) =>
          prev.map((b) => (b._id === bundle._id ? { ...b, isActive: !b.isActive } : b))
        );
      }
    } catch (err) {
      showAlert('Error', 'Failed to update bundle');
    }
  };

  const toggleBundleFeatured = async (bundle: TrialBundle) => {
    try {
      const response = await adminTrialsService.updateBundle(bundle._id, {
        featured: !bundle.featured,
      });
      if (response.success) {
        setBundles((prev) =>
          prev.map((b) => (b._id === bundle._id ? { ...b, featured: !b.featured } : b))
        );
      }
    } catch (err) {
      showAlert('Error', 'Failed to update bundle');
    }
  };

  // ═══════════ RENDERERS ═══════════

  const renderEmptyState = (message: string) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle-outline" size={64} color={Colors.light.success} />
      <Text style={styles.emptyTitle}>{message}</Text>
    </View>
  );

  const renderTrial = ({ item }: { item: PendingTrial }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedTrial(item);
        setShowDetail(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0].url }}
            style={styles.trialImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.trialImage, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color={Colors.light.secondaryText} />
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.merchantName}>{item.merchantName}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.detailsRow}>
          <View style={styles.detailChip}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{item.category}</Text>
          </View>
          <View style={styles.detailChip}>
            <Text style={styles.detailLabel}>Coins</Text>
            <Text style={styles.detailValue}>{item.trialCoinPrice}</Text>
          </View>
          <View style={styles.detailChip}>
            <Text style={styles.detailLabel}>Fee</Text>
            <Text style={styles.detailValue}>₹{item.commitmentFee}</Text>
          </View>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtnStyle]}
            onPress={() => {
              setSelectedTrial(item);
              setShowRejectModal(true);
            }}
          >
            <Ionicons name="close-circle" size={16} color="#EF4444" />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtnStyle]}
            onPress={() => handleApprove(item)}
          >
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFraudAlert = ({ item }: { item: FraudAlert }) => {
    const userName = item.userId?.name || item.userId?.email || 'Unknown User';
    const trialName = item.trialId?.name || item.trialId?.category || 'Unknown Trial';
    const merchantName = item.merchantId?.name || 'Unknown Merchant';
    const signals = item.fraudSignals || [];

    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.fraudHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{userName}</Text>
              <Text style={styles.merchantName}>
                {trialName} - {merchantName}
              </Text>
            </View>
            <Ionicons name="alert-circle" size={24} color={Colors.light.error} />
          </View>
          <View style={styles.signalsRow}>
            {signals.map((signal, i) => (
              <View key={i} style={styles.signalBadge}>
                <Text style={styles.signalText}>
                  {signal === 'geo_mismatch'
                    ? 'Geo Mismatch'
                    : signal === 'instant_completion'
                      ? 'Instant Complete'
                      : signal === 'velocity_abuse'
                        ? 'Velocity Abuse'
                        : signal}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
          {item.userId?._id && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtnStyle, { marginTop: 8 }]}
              onPress={async () => {
                const confirmed = await showConfirm(
                  'Suspend User?',
                  `Suspend ${userName} for fraud?`
                );
                if (!confirmed) return;
                try {
                  await adminTrialsService.suspendUser(item.userId._id, 'Fraud detected');
                  showAlert('Success', 'User suspended');
                } catch {
                  showAlert('Error', 'Failed to suspend user');
                }
              }}
            >
              <Ionicons name="ban" size={14} color="#EF4444" />
              <Text style={styles.rejectBtnText}>Suspend User</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ═══════════ TAB CONTENT ═══════════

  const renderApprovalsTab = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      );
    }
    return (
      <FlatList
        data={trials}
        renderItem={renderTrial}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState('No Pending Trials')}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderFraudTab = () => {
    if (fraudLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      );
    }
    return (
      <FlatList
        data={fraudAlerts}
        renderItem={renderFraudAlert}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState('No Fraud Alerts')}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderBreakageTab = () => {
    if (breakageLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      );
    }
    if (!breakageStats) {
      return renderEmptyState('No Breakage Data');
    }
    return (
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Total */}
        <View style={styles.statCard}>
          <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.statGradient}>
            <Ionicons name="trending-down" size={28} color="#FFF" />
            <Text style={styles.statValue}>
              {breakageStats.totalBreakage?.toLocaleString() ?? 0}
            </Text>
            <Text style={styles.statLabel}>Total Expired Coins (30d)</Text>
          </LinearGradient>
        </View>

        {/* Monthly */}
        {breakageStats.monthly && breakageStats.monthly.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.sectionTitle}>Monthly Breakage</Text>
              {breakageStats.monthly.map((m) => (
                <View key={m.month} style={styles.statRow}>
                  <Text style={styles.statRowLabel}>{m.month}</Text>
                  <Text style={styles.statRowValue}>{m.amount?.toLocaleString() ?? 0} coins</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Daily */}
        {breakageStats.daily && breakageStats.daily.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.sectionTitle}>Daily Breakage (Last 30 Days)</Text>
              {breakageStats.daily.slice(-10).map((d) => (
                <View key={d.date} style={styles.statRow}>
                  <Text style={styles.statRowLabel}>{d.date}</Text>
                  <Text style={styles.statRowValue}>{d.amount?.toLocaleString() ?? 0} coins</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderGovernorTab = () => {
    const actions = [
      {
        action: 'pause_bookings',
        label: 'Pause Bookings',
        desc: 'Stop new trial bookings globally',
        icon: 'pause-circle' as const,
        color: '#F59E0B',
      },
      {
        action: 'pause_purchases',
        label: 'Pause Coin Purchases',
        desc: 'Stop trial coin purchases globally',
        icon: 'card' as const,
        color: '#F97316',
      },
      {
        action: 'reduce_exposure',
        label: 'Reduce Exposure',
        desc: 'Lower trial offer visibility',
        icon: 'eye-off' as const,
        color: '#8B5CF6',
      },
      {
        action: 'freeze_merchant',
        label: 'Freeze Merchant',
        desc: 'Freeze a specific merchant',
        icon: 'snow' as const,
        color: '#3B82F6',
      },
      {
        action: 'unfreeze_merchant',
        label: 'Unfreeze Merchant',
        desc: 'Restore a frozen merchant',
        icon: 'sunny' as const,
        color: '#10B981',
      },
      {
        action: 'clawback',
        label: 'Clawback Coins',
        desc: 'Reclaim coins from fraudulent users',
        icon: 'arrow-undo-circle' as const,
        color: '#EF4444',
      },
    ];

    return (
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionSubtitle}>Emergency controls for the trial coin economy</Text>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.action}
            style={styles.card}
            onPress={() => executeGovernorAction(a.action, a.label)}
            disabled={governorLoading}
            activeOpacity={0.7}
          >
            <View style={styles.cardBody}>
              <View style={styles.governorRow}>
                <View style={[styles.governorIcon, { backgroundColor: a.color + '20' }]}>
                  <Ionicons name={a.icon} size={22} color={a.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{a.label}</Text>
                  <Text style={styles.merchantName}>{a.desc}</Text>
                </View>
                {governorLoading ? (
                  <ActivityIndicator size="small" color={a.color} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.secondaryText} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderCampaignsTab = () => {
    if (campaignsLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      );
    }
    return (
      <FlatList
        data={campaigns}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState('No Discovery Campaigns')}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
          />
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <View style={styles.fraudHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.subtitle ? <Text style={styles.merchantName}>{item.subtitle}</Text> : null}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.isActive ? styles.activeBadge : styles.inactiveBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.isActive ? styles.activeText : styles.inactiveText,
                    ]}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.detailsRow}>
                <View style={styles.detailChip}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{item.type?.replace(/_/g, ' ')}</Text>
                </View>
                <View style={styles.detailChip}>
                  <Text style={styles.detailLabel}>Target</Text>
                  <Text style={styles.detailValue}>{item.targetTrialCount} trials</Text>
                </View>
                <View style={styles.detailChip}>
                  <Text style={styles.detailLabel}>Reward</Text>
                  <Text style={styles.detailValue}>{item.rewardCoins} coins</Text>
                </View>
              </View>
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>
                  {new Date(item.startsAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                  {' → '}
                  {new Date(item.endsAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    );
  };

  const renderBundlesTab = () => {
    if (bundlesLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      );
    }
    return (
      <FlatList
        data={bundles}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState('No Trial Bundles')}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
          />
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <View style={styles.fraudHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.merchantName} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.typeBadge,
                    item.bundleType === 'pass' ? styles.passBadge : styles.packBadge,
                  ]}
                >
                  <Text style={styles.typeText}>{item.bundleType?.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailChip}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailValue}>₹{item.price}</Text>
                </View>
                <View style={styles.detailChip}>
                  <Text style={styles.detailLabel}>Slots</Text>
                  <Text style={styles.detailValue}>{item.trialSlots}</Text>
                </View>
                <View style={styles.detailChip}>
                  <Text style={styles.detailLabel}>Validity</Text>
                  <Text style={styles.detailValue}>{item.validityDays}d</Text>
                </View>
              </View>

              {item.originalPrice > item.price && (
                <Text style={styles.strikePrice}>
                  MRP ₹{item.originalPrice} (
                  {Math.round((1 - item.price / item.originalPrice) * 100)}% off)
                </Text>
              )}

              <View style={styles.togglesRow}>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleLabel}>Active</Text>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => toggleBundleActive(item)}
                    trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                    thumbColor={item.isActive ? '#10B981' : '#94A3B8'}
                  />
                </View>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleLabel}>Featured</Text>
                  <Switch
                    value={item.featured}
                    onValueChange={() => toggleBundleFeatured(item)}
                    trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                    thumbColor={item.featured ? '#3B82F6' : '#94A3B8'}
                  />
                </View>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleLabel}>Purchases</Text>
                  <Text style={styles.purchaseCount}>{item.totalPurchases ?? 0}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'approvals':
        return renderApprovalsTab();
      case 'fraud':
        return renderFraudTab();
      case 'breakage':
        return renderBreakageTab();
      case 'governor':
        return renderGovernorTab();
      case 'campaigns':
        return renderCampaignsTab();
      case 'bundles':
        return renderBundlesTab();
    }
  };

  // ═══════════ MAIN RENDER ═══════════

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trial Management</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{trials.length}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={active ? '#FFFFFF' : Colors.light.secondaryText}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Detail Modal */}
      <Modal visible={showDetail} animationType="slide" transparent>
        {selectedTrial && (
          <View style={styles.modalContainer}>
            <StatusBar style="light" />
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Trial Details</Text>
              <View style={{ width: 24 }} />
            </LinearGradient>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedTrial.images && selectedTrial.images.length > 0 && (
                <Image
                  source={{ uri: selectedTrial.images[0].url }}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Title</Text>
                  <Text style={styles.infoValue}>{selectedTrial.title}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Merchant</Text>
                  <Text style={styles.infoValue}>{selectedTrial.merchantName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Category</Text>
                  <Text style={styles.infoValue}>{selectedTrial.category}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Original Price</Text>
                  <Text style={styles.infoValue}>₹{selectedTrial.originalPrice}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pricing & Slots</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Trial Coin Price</Text>
                  <Text style={styles.infoValue}>{selectedTrial.trialCoinPrice}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Commitment Fee</Text>
                  <Text style={styles.infoValue}>₹{selectedTrial.commitmentFee}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Daily Slots</Text>
                  <Text style={styles.infoValue}>{selectedTrial.dailySlots}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>QR Window</Text>
                  <Text style={styles.infoValue}>
                    {selectedTrial.qrWindowType} ({selectedTrial.qrWindowMinutes} min)
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rewards</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ReZ Coins</Text>
                  <Text style={styles.infoValue}>{selectedTrial.rewardCoins}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Branded Coins</Text>
                  <Text style={styles.infoValue}>{selectedTrial.brandedCoins}</Text>
                </View>
              </View>

              {selectedTrial.terms && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                  <Text style={styles.termsText}>{selectedTrial.terms}</Text>
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.actionBtnLg, styles.rejectBtnStyle]}
                onPress={() => setShowRejectModal(true)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtnLg, styles.approveBtnStyle]}
                onPress={() => handleApprove(selectedTrial)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.rejectOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>Rejection Reason</Text>
            <TextInput
              style={styles.rejectInput}
              placeholder="Explain why this trial is being rejected..."
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholderTextColor={Colors.light.secondaryText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.rejectFooter}>
              <TouchableOpacity
                style={styles.rejectCancel}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                <Text style={styles.rejectCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectConfirm, actionLoading && { opacity: 0.6 }]}
                onPress={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.rejectConfirmText}>Reject Trial</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (RNStatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Tab Bar
  tabBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tabActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Lists & Cards
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginTop: 16,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontWeight: '500',
    marginBottom: 6,
  },
  imageContainer: {
    height: 140,
  },
  trialImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: Colors.light.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  detailChip: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  detailLabel: {
    fontSize: 10,
    color: Colors.light.secondaryText,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionBtnLg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectBtnStyle: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 12,
  },
  approveBtnStyle: {
    borderColor: '#DCFCE7',
    backgroundColor: '#F0FDF4',
  },
  approveBtnText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 12,
  },

  // Fraud
  fraudHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  signalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  signalBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  signalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  dateText: {
    fontSize: 11,
    color: Colors.light.secondaryText,
  },
  dateRow: {
    marginTop: 4,
  },

  // Breakage
  statCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statRowLabel: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  statRowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },

  // Governor
  governorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  governorIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Campaigns
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#F0FDF4',
  },
  inactiveBadge: {
    backgroundColor: '#F9FAFB',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeText: {
    color: '#10B981',
  },
  inactiveText: {
    color: '#94A3B8',
  },

  // Bundles
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  passBadge: {
    backgroundColor: '#EFF6FF',
  },
  packBadge: {
    backgroundColor: '#FDF4FF',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  strikePrice: {
    fontSize: 12,
    color: Colors.light.success,
    fontWeight: '600',
    marginBottom: 8,
  },
  togglesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  purchaseCount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  modalHeader: {
    paddingTop: Platform.OS === 'ios' ? 54 : (RNStatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
  },
  detailImage: {
    width: '100%',
    height: 200,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  termsText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },

  // Reject Modal
  rejectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  rejectModalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  rejectModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  rejectInput: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    color: Colors.light.text,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  rejectFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  rejectCancelText: {
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: 14,
  },
  rejectConfirm: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
