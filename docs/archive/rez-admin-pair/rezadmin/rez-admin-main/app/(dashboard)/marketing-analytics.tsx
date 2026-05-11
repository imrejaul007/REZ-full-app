/**
 * app/(dashboard)/marketing-analytics.tsx
 * Platform-wide marketing analytics across all merchants
 *
 * Displays:
 * - 4 KPI cards: Campaigns Sent, Messages Delivered, Avg Open Rate, Keyword Bids Active
 * - Top Channels breakdown with percentage bars
 * - Campaign Volume by Merchant — recent campaigns list
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import { apiClient } from '../../services/api/apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CampaignStatus = 'active' | 'completed' | 'draft';

interface ChannelBreakdown {
  name: string;
  percentage: number;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface CampaignRow {
  id: string;
  merchantName: string;
  channel: string;
  status: CampaignStatus;
  sentCount: number;
  campaignName: string;
  createdAt: string;
}

interface MarketingAnalyticsData {
  totalCampaignsSent: number;
  totalMessagesDelivered: number;
  averageOpenRate: number;
  totalKeywordBidsActive: number;
  channels: ChannelBreakdown[];
  recentCampaigns: CampaignRow[];
}

// Channel display config — maps backend channel key to icon + color
const CHANNEL_DISPLAY: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  push: { icon: 'notifications-outline', color: '#3B82F6' },
  sms: { icon: 'chatbubble-outline', color: '#10B981' },
  email: { icon: 'mail-outline', color: '#F59E0B' },
  whatsapp: { icon: 'logo-whatsapp', color: '#25D366' },
  'in-app': { icon: 'phone-portrait-outline', color: '#8B5CF6' },
};
const CHANNEL_DEFAULT = {
  icon: 'megaphone-outline' as keyof typeof Ionicons.glyphMap,
  color: '#6B7280',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  accentColor: string;
}

function KPICard({ label, value, subtext, icon, iconColor, accentColor }: KPICardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.kpiCard, { backgroundColor: colors.card, borderLeftColor: accentColor }]}>
      <View style={[styles.kpiIconWrap, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.kpiContent}>
        <Text style={[styles.kpiLabel, { color: colors.icon }]}>{label}</Text>
        <Text style={[styles.kpiValue, { color: colors.text }]}>{value}</Text>
        {subtext ? (
          <Text style={[styles.kpiSubtext, { color: colors.muted }]}>{subtext}</Text>
        ) : null}
      </View>
    </View>
  );
}

interface ChannelRowProps {
  channel: ChannelBreakdown;
}

function ChannelRow({ channel }: ChannelRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.channelRow}>
      <View style={styles.channelLeft}>
        <View style={[styles.channelIconWrap, { backgroundColor: `${channel.color}18` }]}>
          <Ionicons name={channel.icon} size={18} color={channel.color} />
        </View>
        <Text style={[styles.channelName, { color: colors.text }]}>{channel.name}</Text>
      </View>
      <View style={styles.channelBarArea}>
        <View style={[styles.channelBarTrack, { backgroundColor: colors.gray200 }]}>
          <View
            style={[
              styles.channelBarFill,
              { width: `${channel.percentage}%`, backgroundColor: channel.color },
            ]}
          />
        </View>
        <Text style={[styles.channelPct, { color: colors.icon }]}>{channel.percentage}%</Text>
      </View>
      <Text style={[styles.channelCount, { color: colors.muted }]}>
        {channel.count >= 1_000_000
          ? `${(channel.count / 1_000_000).toFixed(1)}M`
          : channel.count >= 1_000
            ? `${(channel.count / 1_000).toFixed(0)}K`
            : channel.count}
      </Text>
    </View>
  );
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: 'Active', bg: '#D1FAE5', text: '#065F46' },
  completed: { label: 'Completed', bg: '#DBEAFE', text: '#1E40AF' },
  draft: { label: 'Draft', bg: '#F3F4F6', text: '#374151' },
  sent: { label: 'Sent', bg: '#E0E7FF', text: '#3730A3' },
  scheduled: { label: 'Scheduled', bg: '#FEF3C7', text: '#92400E' },
  failed: { label: 'Failed', bg: '#FEE2E2', text: '#991B1B' },
};
const STATUS_DEFAULT = { label: 'Unknown', bg: '#F3F4F6', text: '#374151' };

interface CampaignCardProps {
  campaign: CampaignRow;
}

function CampaignCard({ campaign }: CampaignCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_DEFAULT;

  const CHANNEL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    WhatsApp: 'logo-whatsapp',
    Push: 'notifications-outline',
    SMS: 'chatbubble-outline',
    Email: 'mail-outline',
    'In-App': 'phone-portrait-outline',
  };
  const channelIcon: keyof typeof Ionicons.glyphMap =
    CHANNEL_ICONS[campaign.channel] ?? 'megaphone-outline';

  return (
    <View
      style={[styles.campaignCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.campaignTop}>
        <View style={styles.campaignMerchantRow}>
          <Ionicons name="storefront-outline" size={14} color={colors.muted} />
          <Text style={[styles.campaignMerchant, { color: colors.icon }]} numberOfLines={1}>
            {campaign.merchantName}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <Text style={[styles.campaignName, { color: colors.text }]} numberOfLines={1}>
        {campaign.campaignName}
      </Text>

      <View style={styles.campaignMeta}>
        <View style={styles.metaItem}>
          <Ionicons name={channelIcon} size={13} color={colors.muted} />
          <Text style={[styles.metaText, { color: colors.icon }]}>{campaign.channel}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="send-outline" size={13} color={colors.muted} />
          <Text style={[styles.metaText, { color: colors.icon }]}>
            {campaign.sentCount > 0 ? campaign.sentCount.toLocaleString() : '—'} sent
          </Text>
        </View>
        <Text style={[styles.metaDate, { color: colors.muted }]}>{campaign.createdAt}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MarketingAnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [data, setData] = useState<MarketingAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/admin/marketing/analytics');
      if (!mountedRef.current) return;
      if (res.success && res.data) {
        const raw = res.data;

        // Transform channels: backend { channel, sent, delivered, campaigns }
        //                   → frontend { name, percentage, count, icon, color }
        const rawChannels: any[] = Array.isArray(raw.channels) ? raw.channels : [];
        const totalSent = rawChannels.reduce((s: number, c: any) => s + (c.sent || 0), 0) || 1;
        const channels: ChannelBreakdown[] = rawChannels.map((c: any) => {
          const key = (c.channel || 'unknown').toLowerCase();
          const display = CHANNEL_DISPLAY[key] || CHANNEL_DEFAULT;
          return {
            name:
              (c.channel || 'Unknown').charAt(0).toUpperCase() + (c.channel || 'unknown').slice(1),
            percentage: Math.round(((c.sent || 0) / totalSent) * 100),
            count: c.delivered || c.sent || 0,
            icon: display.icon,
            color: display.color,
          };
        });

        // Transform campaigns: backend { _id, name, channel, status, stats, createdAt }
        //                    → frontend { id, merchantName, channel, status, sentCount, campaignName, createdAt }
        const rawCampaigns: any[] = Array.isArray(raw.recentCampaigns) ? raw.recentCampaigns : [];
        const recentCampaigns: CampaignRow[] = rawCampaigns.map((c: any, index: number) => ({
          id: c._id || c.id || String(index),
          merchantName: c.merchantName || c.merchant?.name || '—',
          channel:
            (c.channel || 'Unknown').charAt(0).toUpperCase() + (c.channel || 'unknown').slice(1),
          status: (c.status || 'draft') as CampaignStatus,
          sentCount: c.stats?.sent ?? c.sentCount ?? 0,
          campaignName: c.name || c.campaignName || 'Untitled Campaign',
          createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—',
        }));

        setData({
          totalCampaignsSent: raw.totalCampaignsSent ?? 0,
          totalMessagesDelivered: raw.totalMessagesDelivered ?? 0,
          averageOpenRate: raw.averageOpenRate ?? 0,
          totalKeywordBidsActive: raw.totalKeywordBidsActive ?? 0,
          channels,
          recentCampaigns,
        });
        setError(null);
      } else {
        setData(null);
        setError(res.message || 'Failed to load marketing analytics');
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      logger.warn('[MarketingAnalytics] API error:', err?.message);
      setData(null);
      setError(err?.message || 'Failed to load marketing analytics');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Loading state
  if (loading && !data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading analytics...</Text>
      </View>
    );
  }

  // Error state (should not normally be reached since we fall back to mock data)
  if (error && !data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Could not load data</Text>
        <Text style={[styles.errorSubtext, { color: colors.icon }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.tint }]}
          onPress={() => {
            setLoading(true);
            fetchData();
          }}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const analytics = data!;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Marketing Analytics</Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
            Platform-wide campaign intelligence
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* KPI Cards                                                           */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.icon }]}>OVERVIEW</Text>

        <View style={styles.kpiGrid}>
          <KPICard
            label="Campaigns Sent"
            value={(analytics.totalCampaignsSent ?? 0).toLocaleString()}
            subtext="All time"
            icon="megaphone-outline"
            iconColor="#3B82F6"
            accentColor="#3B82F6"
          />
          <KPICard
            label="Messages Delivered"
            value={
              (analytics.totalMessagesDelivered ?? 0) >= 1_000_000
                ? `${((analytics.totalMessagesDelivered ?? 0) / 1_000_000).toFixed(2)}M`
                : `${((analytics.totalMessagesDelivered ?? 0) / 1_000).toFixed(0)}K`
            }
            subtext="Across all channels"
            icon="paper-plane-outline"
            iconColor="#10B981"
            accentColor="#10B981"
          />
        </View>

        <View style={[styles.kpiGrid, { marginTop: 10 }]}>
          <KPICard
            label="Avg Open Rate"
            value={`${(analytics.averageOpenRate ?? 0).toFixed(1)}%`}
            subtext="Platform average"
            icon="eye-outline"
            iconColor="#F59E0B"
            accentColor="#F59E0B"
          />
          <KPICard
            label="Keyword Bids Active"
            value={(analytics.totalKeywordBidsActive ?? 0).toLocaleString()}
            subtext="Live right now"
            icon="pricetag-outline"
            iconColor="#8B5CF6"
            accentColor="#8B5CF6"
          />
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Top Channels                                                        */}
      {/* ------------------------------------------------------------------ */}
      <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.icon }]}>TOP CHANNELS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {analytics.channels.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Ionicons name="analytics-outline" size={28} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>
                No channel data yet
              </Text>
            </View>
          ) : (
            analytics.channels.map((ch, idx) => (
              <View key={ch.name}>
                <ChannelRow channel={ch} />
                {idx < analytics.channels.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))
          )}
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Campaign Volume by Merchant                                         */}
      {/* ------------------------------------------------------------------ */}
      <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionLabel, { color: colors.icon }]}>
            CAMPAIGN VOLUME BY MERCHANT
          </Text>
          <Text style={[styles.sectionCount, { color: colors.muted }]}>
            {analytics.recentCampaigns.length} campaigns
          </Text>
        </View>

        {analytics.recentCampaigns.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Ionicons name="megaphone-outline" size={28} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>
              No campaigns yet
            </Text>
          </View>
        ) : (
          analytics.recentCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.muted }]}>
          Pull to refresh · Data from /admin/marketing/analytics
        </Text>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  errorSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerRight: {
    width: 36,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // Section
  section: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 12,
  },

  // KPI Cards
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  kpiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  kpiSubtext: {
    fontSize: 11,
    marginTop: 2,
  },

  // Channel breakdown
  card: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 96,
  },
  channelIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelName: {
    fontSize: 13,
    fontWeight: '500',
  },
  channelBarArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  channelBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  channelPct: {
    fontSize: 12,
    fontWeight: '600',
    width: 34,
    textAlign: 'right',
  },
  channelCount: {
    fontSize: 12,
    width: 42,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },

  // Campaign cards
  campaignCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  campaignTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  campaignMerchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  campaignMerchant: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  campaignName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  campaignMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  metaDate: {
    fontSize: 12,
    marginLeft: 'auto',
  },

  // Footer
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});
