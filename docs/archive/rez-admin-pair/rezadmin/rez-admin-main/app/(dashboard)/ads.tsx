import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adCampaignsService, AdCampaign, AdNetworkStats } from '../../services/api/adCampaigns';
import { Colors } from '../../constants/Colors';
import { showAlert, showConfirm } from '../../utils/alert';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#7c3aed';
const SUCCESS = '#10b981';
const WARNING = '#f59e0b';
const DANGER = '#ef4444';
const INFO = '#3b82f6';

type TabFilter = 'all' | 'pending_review' | 'active' | 'rejected';

const TABS: { key: TabFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'pending_review', label: 'Pending Review', icon: 'time' },
  { key: 'active', label: 'Active', icon: 'checkmark-circle' },
  { key: 'rejected', label: 'Rejected', icon: 'close-circle' },
];

const PLACEMENT_LABELS: Record<AdCampaign['placement'], string> = {
  home_banner: 'Home Banner',
  explore_feed: 'Explore Feed',
  store_listing: 'Store Listing',
  search_result: 'Search Result',
};

const STATUS_CONFIG: Record<AdCampaign['status'], { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6' },
  pending_review: { label: 'Pending', color: WARNING, bg: '#fef3c7' },
  active: { label: 'Active', color: SUCCESS, bg: '#d1fae5' },
  paused: { label: 'Paused', color: INFO, bg: '#dbeafe' },
  rejected: { label: 'Rejected', color: DANGER, bg: '#fee2e2' },
  completed: { label: 'Completed', color: '#6b7280', bg: '#f3f4f6' },
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [stats, setStats] = useState<AdNetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingAd, setRejectingAd] = useState<AdCampaign | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAd, setDetailAd] = useState<AdCampaign | null>(null);

  // ─── Data Loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!append) setIsLoading(true);
      try {
        const query: any = { page: pageNum, limit: 20 };
        if (activeTab !== 'all') query.status = activeTab;

        const data = await adCampaignsService.fetchAds(query);

        if (append) {
          setAds((prev) => [...prev, ...data.ads]);
        } else {
          setAds(data.ads);
        }

        setHasMore(data.pagination.hasNext);
        setPage(pageNum);
      } catch (error) {
        logger.error('[AdsScreen] loadData error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab]
  );

  const loadStats = useCallback(async () => {
    try {
      const data = await adCampaignsService.fetchAdStats();
      setStats(data);
    } catch (error) {
      logger.error('[AdsScreen] loadStats error:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadStats();
  }, [loadData, loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(1), loadStats()]);
    setRefreshing(false);
  }, [loadData, loadStats]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadData(page + 1, true);
    }
  }, [isLoading, hasMore, page, loadData]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleApprove = async (ad: AdCampaign) => {
    showConfirm(
      'Approve Ad',
      `Approve "${ad.title}" from ${ad.merchantId?.businessName ?? ad.merchantId?.name ?? 'merchant'}?`,
      async () => {
        try {
          await adCampaignsService.approveAd(ad._id);
          showAlert('Success', 'Ad approved and set to active.');
          await Promise.all([loadData(1), loadStats()]);
        } catch (error: any) {
          showAlert('Error', error.message);
        }
      },
      'Approve'
    );
  };

  const handleRejectOpen = (ad: AdCampaign) => {
    setRejectingAd(ad);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingAd) return;
    if (!rejectionReason.trim()) {
      showAlert('Required', 'Please enter a rejection reason.');
      return;
    }
    setIsSubmitting(true);
    try {
      await adCampaignsService.rejectAd(rejectingAd._id, rejectionReason.trim());
      showAlert('Done', 'Ad has been rejected.');
      setShowRejectModal(false);
      setRejectingAd(null);
      setRejectionReason('');
      await Promise.all([loadData(1), loadStats()]);
    } catch (error: any) {
      showAlert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForcePause = (ad: AdCampaign) => {
    showConfirm(
      'Force Pause',
      `Pause "${ad.title}"? The merchant will be notified.`,
      async () => {
        try {
          await adCampaignsService.pauseAd(ad._id);
          showAlert('Success', 'Ad has been paused.');
          await Promise.all([loadData(1), loadStats()]);
        } catch (error: any) {
          showAlert('Error', error.message);
        }
      },
      'Pause'
    );
  };

  const handleViewDetail = (ad: AdCampaign) => {
    setDetailAd(ad);
    setShowDetailModal(true);
  };

  // ─── Render Helpers ────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ad Network</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          Review and manage merchant ads
        </Text>
      </View>
    </View>
  );

  const renderStats = () => {
    const statItems = [
      {
        label: 'Total Ads',
        value: stats?.total ?? 0,
        color: PRIMARY,
        icon: 'megaphone' as const,
      },
      {
        label: 'Pending Review',
        value: stats?.byStatus?.['pending_review'] ?? 0,
        color: WARNING,
        icon: 'time' as const,
      },
      {
        label: 'Active',
        value: stats?.byStatus?.['active'] ?? 0,
        color: SUCCESS,
        icon: 'checkmark-circle' as const,
      },
      {
        label: 'Impressions',
        value: formatNumber(stats?.totalImpressions ?? 0),
        color: INFO,
        icon: 'eye' as const,
      },
    ];

    return (
      <View style={styles.statsBar}>
        {statItems.map((item, idx) => (
          <View key={idx} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name={item.icon} size={18} color={item.color} />
            <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, { backgroundColor: isActive ? PRIMARY : colors.card }]}
              onPress={() => {
                setActiveTab(tab.key);
                setIsLoading(true);
              }}
            >
              <Ionicons name={tab.icon as any} size={15} color={isActive ? '#fff' : colors.icon} />
              <Text style={[styles.tabLabel, { color: isActive ? '#fff' : colors.icon }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderAdCard = useCallback(
    ({ item }: { item: AdCampaign }) => {
      const statusCfg = STATUS_CONFIG[item.status];
      const merchantName =
        item.merchantId?.businessName ?? item.merchantId?.name ?? 'Unknown Merchant';

      return (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Card Top */}
          <View style={styles.cardTop}>
            <View style={styles.cardMeta}>
              <Text style={[styles.cardMerchant, { color: colors.icon }]} numberOfLines={1}>
                {merchantName}
              </Text>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <View style={styles.cardBadges}>
              {/* Placement badge */}
              <View style={[styles.badge, { backgroundColor: '#ede9fe' }]}>
                <Text style={[styles.badgeText, { color: PRIMARY }]}>
                  {PLACEMENT_LABELS[item.placement] ?? item.placement}
                </Text>
              </View>
              {/* Status badge */}
              <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
                <Text style={[styles.badgeText, { color: statusCfg.color }]}>
                  {statusCfg.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Metrics Row */}
          <View style={[styles.metricsRow, { borderTopColor: colors.border }]}>
            <View style={styles.metricItem}>
              <Ionicons name="pricetag" size={13} color={colors.icon} />
              <Text style={[styles.metricText, { color: colors.text }]}>
                {item.bidType} · ₹{item.bidAmount}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="wallet" size={13} color={colors.icon} />
              <Text style={[styles.metricText, { color: colors.text }]}>
                ₹{item.totalSpent.toFixed(0)} / ₹{item.totalBudget}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="eye" size={13} color={colors.icon} />
              <Text style={[styles.metricText, { color: colors.text }]}>
                {formatNumber(item.impressions)} impr.
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="hand-left" size={13} color={colors.icon} />
              <Text style={[styles.metricText, { color: colors.text }]}>
                {formatNumber(item.clicks)} ({(item.ctr ?? 0).toFixed(2)}%)
              </Text>
            </View>
          </View>

          {/* Created date */}
          <Text style={[styles.cardDate, { color: colors.icon }]}>
            Created {formatDate(item.createdAt)}
          </Text>

          {/* Rejection reason if present */}
          {item.status === 'rejected' && item.rejectionReason ? (
            <View style={[styles.rejectionBanner, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="alert-circle" size={13} color={DANGER} />
              <Text style={[styles.rejectionText, { color: DANGER }]} numberOfLines={2}>
                {item.rejectionReason}
              </Text>
            </View>
          ) : null}

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            {item.status === 'pending_review' && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: SUCCESS }]}
                  onPress={() => handleApprove(item)}
                >
                  <Ionicons name="checkmark" size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: DANGER }]}
                  onPress={() => handleRejectOpen(item)}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              </>
            )}
            {item.status === 'active' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: WARNING }]}
                onPress={() => handleForcePause(item)}
              >
                <Ionicons name="pause" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Force Pause</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
              ]}
              onPress={() => handleViewDetail(item)}
            >
              <Ionicons name="eye-outline" size={14} color={colors.text} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [colors, activeTab]
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="megaphone-outline" size={52} color={colors.icon} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Ads Found</Text>
        <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
          {activeTab === 'all'
            ? 'No ad campaigns have been submitted yet.'
            : `No ads with status "${TABS.find((t) => t.key === activeTab)?.label}" at the moment.`}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={PRIMARY} />
      </View>
    );
  };

  // ─── Rejection Modal ───────────────────────────────────────────────────────

  const renderRejectModal = () => (
    <Modal
      visible={showRejectModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRejectModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.rejectModalBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.rejectModalTitle, { color: colors.text }]}>Reject Ad</Text>
          {rejectingAd ? (
            <Text style={[styles.rejectModalSubtitle, { color: colors.icon }]}>
              Rejecting "{rejectingAd.title}"
            </Text>
          ) : null}
          <TextInput
            style={[
              styles.rejectInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter rejection reason..."
            placeholderTextColor={colors.icon}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View style={styles.rejectActions}>
            <TouchableOpacity
              style={[styles.rejectCancelBtn, { borderColor: colors.border }]}
              onPress={() => {
                setShowRejectModal(false);
                setRejectingAd(null);
                setRejectionReason('');
              }}
              disabled={isSubmitting}
            >
              <Text style={[styles.rejectCancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectConfirmBtn, { backgroundColor: DANGER }]}
              onPress={handleRejectConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.rejectConfirmText}>Confirm Reject</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ─── Detail Modal ──────────────────────────────────────────────────────────

  const renderDetailModal = () => {
    if (!detailAd) return null;
    const statusCfg = STATUS_CONFIG[detailAd.status];
    const merchantName =
      detailAd.merchantId?.businessName ?? detailAd.merchantId?.name ?? 'Unknown Merchant';

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setShowDetailModal(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.detailHeaderTitle, { color: colors.text }]}>Ad Details</Text>
            <View style={styles.modalCloseBtn} />
          </View>

          <ScrollView
            style={styles.detailScroll}
            contentContainerStyle={styles.detailContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Status + Merchant */}
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.icon }]}>Status</Text>
                <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
                  <Text style={[styles.badgeText, { color: statusCfg.color }]}>
                    {statusCfg.label}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.icon }]}>Merchant</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{merchantName}</Text>
              </View>
            </View>

            {/* Creative */}
            <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Creative</Text>
              <DetailRow label="Title" value={detailAd.title} colors={colors} />
              <DetailRow label="Headline" value={detailAd.headline} colors={colors} />
              <DetailRow label="Description" value={detailAd.description} colors={colors} />
              <DetailRow label="CTA Text" value={detailAd.ctaText} colors={colors} />
              <DetailRow label="Image URL" value={detailAd.imageUrl} colors={colors} />
            </View>

            {/* Targeting */}
            <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Targeting</Text>
              <DetailRow
                label="Placement"
                value={PLACEMENT_LABELS[detailAd.placement] ?? detailAd.placement}
                colors={colors}
              />
              <DetailRow label="Segment" value={detailAd.targetSegment || '—'} colors={colors} />
              <DetailRow
                label="Start Date"
                value={formatDate(detailAd.startDate)}
                colors={colors}
              />
              <DetailRow
                label="End Date"
                value={detailAd.endDate ? formatDate(detailAd.endDate) : 'No end date'}
                colors={colors}
              />
            </View>

            {/* Budget */}
            <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Budget</Text>
              <DetailRow label="Bid Type" value={detailAd.bidType} colors={colors} />
              <DetailRow label="Bid Amount" value={`₹${detailAd.bidAmount}`} colors={colors} />
              <DetailRow label="Daily Budget" value={`₹${detailAd.dailyBudget}`} colors={colors} />
              <DetailRow label="Total Budget" value={`₹${detailAd.totalBudget}`} colors={colors} />
              <DetailRow
                label="Total Spent"
                value={`₹${detailAd.totalSpent.toFixed(2)}`}
                colors={colors}
              />
            </View>

            {/* Performance */}
            <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Performance</Text>
              <DetailRow
                label="Impressions"
                value={formatNumber(detailAd.impressions)}
                colors={colors}
              />
              <DetailRow label="Clicks" value={formatNumber(detailAd.clicks)} colors={colors} />
              <DetailRow label="CTR" value={`${(detailAd.ctr ?? 0).toFixed(2)}%`} colors={colors} />
            </View>

            {/* Rejection reason if present */}
            {detailAd.status === 'rejected' && detailAd.rejectionReason ? (
              <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.detailSectionTitle, { color: DANGER }]}>Rejection Reason</Text>
                <Text style={[styles.detailValue, { color: DANGER }]}>
                  {detailAd.rejectionReason}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      {renderStats()}
      {renderTabs()}

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item) => item._id}
          renderItem={renderAdCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PRIMARY}
              colors={[PRIMARY]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderRejectModal()}
      {renderDetailModal()}
    </SafeAreaView>
  );
}

// ─── Sub-component ─────────────────────────────────────────────────────────────

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.icon }]}>{label}</Text>
      <Text
        style={[styles.detailValue, { color: colors.text, flex: 1, textAlign: 'right' }]}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },

  // Tabs
  tabsWrapper: {
    marginBottom: 4,
  },
  tabsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  // List
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardMeta: {
    flex: 1,
  },
  cardMerchant: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
  },
  cardDate: {
    fontSize: 11,
  },
  rejectionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    padding: 8,
    borderRadius: 6,
  },
  rejectionText: {
    fontSize: 12,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Footer loader
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },

  // Rejection Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  rejectModalBox: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  rejectModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  rejectModalSubtitle: {
    fontSize: 13,
    marginTop: -8,
  },
  rejectInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  rejectActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  rejectCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rejectConfirmBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  rejectConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Detail Modal
  modalContainer: {
    flex: 1,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    paddingBottom: 40,
  },
  detailSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    minWidth: 100,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
});
