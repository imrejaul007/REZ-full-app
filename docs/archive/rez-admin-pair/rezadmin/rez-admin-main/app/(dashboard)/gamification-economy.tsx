import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  gamificationStatsService,
  EconomyStats,
  EngagementStats,
  FraudAlert,
  FraudAlertResponse,
} from '../../services/api/gamificationStats';
import { Colors } from '../../constants/Colors';
import { apiClient } from '../../services/api/apiClient';
import { router } from 'expo-router';

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string | number;
  bgColor: string;
  textColor?: string;
}

function StatCard({ icon, iconColor, label, value, bgColor, textColor }: StatCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        statCardStyles.card,
        { backgroundColor: Colors.light.card, borderColor: Colors.light.border },
      ]}
    >
      <View style={[statCardStyles.iconWrap, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[statCardStyles.value, { color: textColor || Colors.light.text }]}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </Text>
      <Text style={[statCardStyles.label, { color: Colors.light.icon }]}>{label}</Text>
    </View>
  );
}

const statCardStyles = StyleSheet.create({
  card: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});

// SECURITY: OTA coin liability data must be fetched through the backend proxy
// (admin/ota/overview) rather than calling the OTA API directly from the client,
// because the OTA admin secret must not be bundled into client code.

function CoinLiabilitySection() {
  const [data, setData] = useState<{
    ota_coin: number;
    rez_coin: number;
    hotel_brand_coin: number;
    total: number;
  } | null>(null);
  const [notAvailable, setNotAvailable] = useState(false);

  useEffect(() => {
    apiClient
      .get<{
        coin_liability_paise: {
          ota_coin: number;
          rez_coin: number;
          hotel_brand_coin: number;
          total: number;
        };
      }>('admin/ota/overview')
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data as any;
          setData((d.coin_liability_paise ?? d) as any);
        } else {
          setNotAvailable(true);
        }
      })
      .catch(() => {
        setNotAvailable(true);
      });
  }, []);

  if (notAvailable) {
    return (
      <View
        style={{
          backgroundColor: Colors.light.card,
          borderRadius: 14,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: Colors.light.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Ionicons name="information-circle" size={20} color={Colors.light.icon} />
        <Text style={{ color: Colors.light.icon, fontSize: 13, flex: 1 }}>
          OTA coin liability stats available via backend API (admin/ota/overview)
        </Text>
      </View>
    );
  }

  if (!data) return null;

  const items = [
    { label: 'OTA Coins', value: data.ota_coin, color: '#0891B2', icon: 'logo-bitcoin' as const },
    { label: 'REZ Coins', value: data.rez_coin, color: '#7C3AED', icon: 'wallet' as const },
    {
      label: 'Hotel Brand Coins',
      value: data.hotel_brand_coin,
      color: '#F59E0B',
      icon: 'bed' as const,
    },
  ];
  const total = data.total || 1;

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Total liability hero */}
      <View
        style={{
          backgroundColor: '#0F172A',
          borderRadius: 14,
          padding: 16,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Total Coin Liability</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>
            ₹{Math.round(total / 100).toLocaleString()}
          </Text>
        </View>
        <Ionicons name="shield-checkmark" size={28} color="#F59E0B" />
      </View>

      {/* Per-type bars */}
      {items.map((item) => {
        const pct = Math.round((item.value / total) * 100);
        return (
          <View
            key={item.label}
            style={{
              backgroundColor: Colors.light.card,
              borderRadius: 12,
              padding: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: Colors.light.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: `${item.color}20`,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name={item.icon} size={14} color={item.color} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.light.text }}>
                  {item.label}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.light.text }}>
                  ₹{Math.round(item.value / 100).toLocaleString()}
                </Text>
                <Text style={{ fontSize: 11, color: Colors.light.icon }}>{pct}% of total</Text>
              </View>
            </View>
            <View style={{ height: 6, backgroundColor: Colors.light.border, borderRadius: 3 }}>
              <View
                style={{
                  height: 6,
                  width: `${pct}%` as any,
                  backgroundColor: item.color,
                  borderRadius: 3,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function GamificationEconomyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [economy, setEconomy] = useState<EconomyStats | null>(null);
  const [engagement, setEngagement] = useState<EngagementStats | null>(null);
  const [fraudData, setFraudData] = useState<FraudAlertResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [economyRes, engagementRes, fraudRes] = await Promise.all([
        gamificationStatsService.getEconomy(),
        gamificationStatsService.getEngagement(),
        gamificationStatsService.getFraudAlerts(),
      ]);

      if (economyRes.success && economyRes.data) setEconomy(economyRes.data as EconomyStats);
      if (engagementRes.success && engagementRes.data)
        setEngagement(engagementRes.data as EngagementStats);
      if (fraudRes.success && fraudRes.data) setFraudData(fraudRes.data as FraudAlertResponse);
    } catch (error) {
      logger.error('Failed to load gamification stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors.light.background }]}>
        <ActivityIndicator size="large" color={Colors.light.success} />
        <Text style={[styles.loadingText, { color: Colors.light.icon }]}>
          Loading economy data...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors.light.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: Colors.light.text }]}>
            Gamification Economy
          </Text>
          <Text style={[styles.headerSubtitle, { color: Colors.light.icon }]}>
            Monitor coins, engagement & fraud
          </Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={Colors.light.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.success}
          />
        }
      >
        {/* Coin Type Liability Breakdown */}
        <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>
          Coin Liability by Type
        </Text>
        <CoinLiabilitySection />

        {/* Economy Overview */}
        <Text style={[styles.sectionTitle, { color: Colors.light.text, marginTop: 8 }]}>
          Economy Overview
        </Text>

        {economy && (
          <>
            {/* Hero Card - Total in Circulation */}
            <View
              style={[
                styles.heroCard,
                { backgroundColor: Colors.light.success, borderColor: Colors.light.successDark },
              ]}
            >
              <View style={styles.heroRow}>
                <View>
                  <Text style={styles.heroLabel}>Total Coins in Circulation</Text>
                  <Text style={styles.heroValue}>{formatNumber(economy.totalInCirculation)}</Text>
                </View>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="logo-bitcoin" size={32} color={Colors.light.card} />
                </View>
              </View>
              <View style={styles.heroSubRow}>
                <View style={styles.heroSubItem}>
                  <Text style={styles.heroSubLabel}>All-Time Earned</Text>
                  <Text style={styles.heroSubValue}>
                    {formatNumber(economy.totalEarnedAllTime)}
                  </Text>
                </View>
                <View style={styles.heroSubItem}>
                  <Text style={styles.heroSubLabel}>All-Time Spent</Text>
                  <Text style={styles.heroSubValue}>{formatNumber(economy.totalSpentAllTime)}</Text>
                </View>
              </View>
            </View>

            {/* Earned/Spent Grid */}
            <View style={styles.cardGrid}>
              <StatCard
                icon="trending-up"
                iconColor={Colors.light.success}
                label="Earned Today"
                value={economy.coinsEarnedToday}
                bgColor={`${Colors.light.success}20`}
                textColor={Colors.light.success}
              />
              <StatCard
                icon="trending-down"
                iconColor={Colors.light.error}
                label="Spent Today"
                value={economy.coinsSpentToday}
                bgColor={`${Colors.light.error}20`}
                textColor={Colors.light.error}
              />
              <StatCard
                icon="calendar"
                iconColor={Colors.light.info}
                label="Earned This Week"
                value={economy.coinsEarnedThisWeek}
                bgColor={`${Colors.light.info}20`}
              />
              <StatCard
                icon="calendar"
                iconColor={Colors.light.warning}
                label="Spent This Week"
                value={economy.coinsSpentThisWeek}
                bgColor={`${Colors.light.warning}20`}
              />
              <StatCard
                icon="stats-chart"
                iconColor={Colors.light.purple}
                label="Earned This Month"
                value={economy.coinsEarnedThisMonth}
                bgColor={`${Colors.light.purple}20`}
              />
              <StatCard
                icon="stats-chart"
                iconColor="#EC4899"
                label="Spent This Month"
                value={economy.coinsSpentThisMonth}
                bgColor="#EC489920"
              />
            </View>

            {/* Net Flow Card */}
            <View
              style={[
                styles.netFlowCard,
                {
                  backgroundColor:
                    economy.netFlowToday >= 0
                      ? `${Colors.light.success}15`
                      : `${Colors.light.error}15`,
                  borderColor:
                    economy.netFlowToday >= 0 ? Colors.light.success : Colors.light.error,
                },
              ]}
            >
              <Ionicons
                name={economy.netFlowToday >= 0 ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={24}
                color={economy.netFlowToday >= 0 ? Colors.light.success : Colors.light.error}
              />
              <View style={styles.netFlowText}>
                <Text style={[styles.netFlowLabel, { color: Colors.light.icon }]}>
                  Net Flow Today
                </Text>
                <Text
                  style={[
                    styles.netFlowValue,
                    {
                      color: economy.netFlowToday >= 0 ? Colors.light.success : Colors.light.error,
                    },
                  ]}
                >
                  {economy.netFlowToday >= 0 ? '+' : ''}
                  {formatNumber(economy.netFlowToday)} coins
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Engagement Metrics */}
        <Text style={[styles.sectionTitle, { color: Colors.light.text, marginTop: 24 }]}>
          Engagement Metrics
        </Text>

        {engagement && (
          <View style={styles.cardGrid}>
            <StatCard
              icon="medal"
              iconColor={Colors.light.warning}
              label="Achievements Unlocked"
              value={engagement.totalAchievementsUnlocked}
              bgColor={`${Colors.light.warning}20`}
            />
            <StatCard
              icon="flag"
              iconColor={Colors.light.success}
              label="Challenges Completed"
              value={engagement.totalChallengesCompleted}
              bgColor={`${Colors.light.success}20`}
            />
            <StatCard
              icon="hourglass"
              iconColor={Colors.light.info}
              label="Active Challenges"
              value={engagement.activeChallenges}
              bgColor={`${Colors.light.info}20`}
            />
            <StatCard
              icon="game-controller"
              iconColor={Colors.light.purple}
              label="Game Sessions Today"
              value={engagement.gameSessionsToday}
              bgColor={`${Colors.light.purple}20`}
            />
          </View>
        )}

        {engagement && (
          <View
            style={[
              styles.totalSessionsCard,
              { backgroundColor: Colors.light.card, borderColor: Colors.light.border },
            ]}
          >
            <Ionicons name="game-controller" size={20} color={Colors.light.purple} />
            <Text style={[styles.totalSessionsText, { color: Colors.light.text }]}>
              Total Game Sessions: {formatNumber(engagement.totalGameSessions)}
            </Text>
          </View>
        )}

        {/* Fraud Alerts */}
        <Text style={[styles.sectionTitle, { color: Colors.light.text, marginTop: 24 }]}>
          Fraud Alerts
        </Text>

        {fraudData && fraudData.alertCount > 0 ? (
          <View>
            <View
              style={[
                styles.alertBanner,
                { backgroundColor: Colors.light.warningLight, borderColor: Colors.light.warning },
              ]}
            >
              <Ionicons name="warning" size={20} color={Colors.light.warningDark} />
              <Text style={[styles.alertBannerText, { color: Colors.light.warningDeep }]}>
                {fraudData.alertCount} user(s) earned &gt; {formatNumber(fraudData.threshold)} coins
                in the last {fraudData.window}
              </Text>
            </View>

            {fraudData.alerts.map((alert, index) => (
              <View
                key={alert.userId || index}
                style={[
                  styles.fraudCard,
                  { backgroundColor: Colors.light.errorLight, borderColor: '#FECACA' },
                ]}
              >
                <View style={styles.fraudHeader}>
                  <View
                    style={[styles.fraudIconWrap, { backgroundColor: Colors.light.errorLight }]}
                  >
                    <Ionicons name="alert-circle" size={20} color={Colors.light.error} />
                  </View>
                  <View style={styles.fraudInfo}>
                    <Text style={[styles.fraudName, { color: Colors.light.errorDeep }]}>
                      {alert.userName || 'Unknown User'}
                    </Text>
                    <Text style={[styles.fraudId, { color: colors.errorDarker }]}>
                      ID:{' '}
                      {typeof alert.userId === 'object'
                        ? JSON.stringify(alert.userId)
                        : String(alert.userId).substring(0, 12)}
                      ...
                    </Text>
                  </View>
                </View>
                <View style={styles.fraudMetrics}>
                  <View style={styles.fraudMetricItem}>
                    <Text style={[styles.fraudMetricLabel, { color: colors.errorDarker }]}>
                      Coins Earned
                    </Text>
                    <Text style={[styles.fraudMetricValue, { color: Colors.light.errorDeep }]}>
                      {formatNumber(alert.totalEarned)}
                    </Text>
                  </View>
                  <View style={styles.fraudMetricItem}>
                    <Text style={[styles.fraudMetricLabel, { color: colors.errorDarker }]}>
                      Transactions
                    </Text>
                    <Text style={[styles.fraudMetricValue, { color: Colors.light.errorDeep }]}>
                      {alert.transactionCount}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.noAlertsCard,
              { backgroundColor: colors.successLighter, borderColor: '#BBF7D0' },
            ]}
          >
            <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
            <Text style={[styles.noAlertsText, { color: '#166534' }]}>
              No fraud alerts detected in the last 24 hours
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 13,
    color: Colors.light.successLight,
    fontWeight: '500',
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.card,
    marginTop: 4,
  },
  heroIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSubRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  heroSubItem: {
    flex: 1,
  },
  heroSubLabel: {
    fontSize: 11,
    color: Colors.light.successLight,
  },
  heroSubValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.card,
    marginTop: 2,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  netFlowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    gap: 12,
  },
  netFlowText: {
    flex: 1,
  },
  netFlowLabel: {
    fontSize: 12,
  },
  netFlowValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  totalSessionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  totalSessionsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  alertBannerText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  fraudCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  fraudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fraudIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fraudInfo: {
    flex: 1,
  },
  fraudName: {
    fontSize: 14,
    fontWeight: '700',
  },
  fraudId: {
    fontSize: 11,
    marginTop: 2,
  },
  fraudMetrics: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 20,
  },
  fraudMetricItem: {
    flex: 1,
  },
  fraudMetricLabel: {
    fontSize: 11,
  },
  fraudMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  noAlertsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  noAlertsText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
