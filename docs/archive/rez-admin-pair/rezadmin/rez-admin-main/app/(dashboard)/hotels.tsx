/**
 * REZ Admin — Hotels Screen
 * Route: /(dashboard)/hotels
 * Shows Hotel OTA overview: property list, OTA stats, brand coin liability.
 * Data is fetched via the backend proxy (admin/ota/*) — never directly from OTA service.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { apiClient } from '../../services/api/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OtaHotelAdmin {
  id: string;
  _id?: string;
  name: string;
  city: string;
  country: string;
  starRating: number;
  isActive: boolean;
  onboardingStatus: string;
  brandCoinEnabled: boolean;
  brandCoinName?: string;
  brandCoinOutstandingPaise: number;
  totalBrandCoinLiabilityPaise?: number;
  totalBookings: number;
  totalRevenuePaise: number;
  createdAt: string;
}

// Backend proxy returns: { activeHotels, activeBookings, gmvTodayPaise, brandCoinTotalLiabilityPaise }
interface OtaAdminStats {
  totalHotels: number;
  activeHotels: number;
  activeBookings: number;
  gmvTodayPaise: number;
  brandCoinTotalLiabilityPaise: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
      </View>
    </View>
  );
}

function HotelRow({ hotel }: { hotel: OtaHotelAdmin }) {
  const statusColor = hotel.isActive ? '#16A34A' : '#94A3B8';
  return (
    <View style={styles.hotelRow}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Text style={styles.hotelName} numberOfLines={1}>
            {hotel.name}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>
        <Text style={styles.hotelCity}>
          {hotel.city}, {hotel.country} · {'★'.repeat(hotel.starRating)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          <Text style={styles.hotelStat}>{hotel.totalBookings} bookings</Text>
          <Text style={styles.hotelStat}>
            ₹{Math.round(hotel.totalRevenuePaise / 100).toLocaleString()}
          </Text>
          {hotel.brandCoinEnabled && (
            <Text style={[styles.hotelStat, { color: '#7C3AED' }]}>
              Brand: ₹{Math.round(hotel.brandCoinOutstandingPaise / 100).toLocaleString()}
            </Text>
          )}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View
          style={[
            styles.onboardBadge,
            {
              backgroundColor: hotel.onboardingStatus === 'active' ? '#DCFCE7' : '#FEF9C3',
            },
          ]}
        >
          <Text
            style={[
              styles.onboardText,
              {
                color: hotel.onboardingStatus === 'active' ? '#16A34A' : '#92400E',
              },
            ]}
          >
            {hotel.onboardingStatus}
          </Text>
        </View>
        {hotel.brandCoinEnabled && (
          <View style={styles.coinBadge}>
            <Ionicons name="wallet" size={10} color="#7C3AED" />
            <Text style={styles.coinBadgeText}>{hotel.brandCoinName ?? 'Brand Coin'}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HotelsAdminScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [stats, setStats] = useState<OtaAdminStats | null>(null);
  const [hotels, setHotels] = useState<OtaHotelAdmin[]>([]);
  const [filtered, setFiltered] = useState<OtaHotelAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'hotels' | 'liability'>('overview');

  const load = useCallback(async () => {
    try {
      const [overviewRes, hotelsRes] = await Promise.allSettled([
        apiClient.get<OtaAdminStats>('admin/ota/overview'),
        apiClient.get<{ hotels: OtaHotelAdmin[]; total: number }>('admin/ota/hotels'),
      ]);
      if (
        overviewRes.status === 'fulfilled' &&
        overviewRes.value.success &&
        overviewRes.value.data
      ) {
        const d = overviewRes.value.data;
        setStats({
          totalHotels: d.activeHotels ?? 0,
          activeHotels: d.activeHotels ?? 0,
          activeBookings: d.activeBookings ?? 0,
          gmvTodayPaise: d.gmvTodayPaise ?? 0,
          brandCoinTotalLiabilityPaise: d.brandCoinTotalLiabilityPaise ?? 0,
        });
      }
      if (hotelsRes.status === 'fulfilled' && hotelsRes.value.success && hotelsRes.value.data) {
        const raw = hotelsRes.value.data;
        const list: OtaHotelAdmin[] = (raw.hotels ?? []).map((h: any) => ({
          id: h._id ?? h.id ?? '',
          _id: h._id ?? h.id,
          name: h.name ?? '',
          city: h.city ?? '',
          country: h.country ?? '',
          starRating: h.starRating ?? h.star_rating ?? 0,
          isActive: h.isActive ?? false,
          onboardingStatus: h.onboardingStatus ?? (h.isActive ? 'active' : 'inactive'),
          brandCoinEnabled: h.brandCoinEnabled ?? false,
          brandCoinName: h.brandCoinName ?? h.brandCoinSymbol ?? undefined,
          brandCoinOutstandingPaise: h.totalBrandCoinLiabilityPaise ?? 0,
          totalBrandCoinLiabilityPaise: h.totalBrandCoinLiabilityPaise ?? 0,
          totalBookings: h.totalBookings ?? 0,
          totalRevenuePaise: h.totalRevenuePaise ?? 0,
          createdAt: h.createdAt ?? '',
        }));
        setHotels(list);
        setFiltered(list);
      }
    } catch {
      /* fallback to empty */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!query) {
      setFiltered(hotels);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      hotels.filter((h) => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q))
    );
  }, [query, hotels]);

  const totalBrandLiability = hotels.reduce((s, h) => s + h.brandCoinOutstandingPaise, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Hotel OTA</Text>
        <Pressable
          onPress={() => {
            setRefreshing(true);
            load();
          }}
        >
          <Ionicons name="refresh-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['overview', 'hotels', 'liability'] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'overview'
                ? 'Overview'
                : t === 'hotels'
                  ? `Properties (${hotels.length})`
                  : 'Liability'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#06B6D4" style={{ marginTop: 60 }} />
        ) : activeTab === 'overview' ? (
          <>
            <Text style={styles.sectionTitle}>Platform Stats</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="business-outline"
                label="Total Hotels"
                value={String(stats?.totalHotels ?? hotels.length)}
                color="#06B6D4"
              />
              <StatCard
                icon="checkmark-circle-outline"
                label="Active"
                value={String(stats?.activeHotels ?? hotels.filter((h) => h.isActive).length)}
                color="#16A34A"
              />
              <StatCard
                icon="calendar-outline"
                label="Active Bookings"
                value={String(stats?.activeBookings ?? 0)}
                color="#F59E0B"
              />
              <StatCard
                icon="cash-outline"
                label="GMV Today"
                value={`₹${Math.round((stats?.gmvTodayPaise ?? 0) / 100).toLocaleString()}`}
                color="#8B5CF6"
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Coin Liability</Text>
            <View style={styles.liabilityCard}>
              <View style={styles.liabilityRow}>
                <Text style={styles.liabilityLabel}>Brand Coin Liability</Text>
                <Text style={[styles.liabilityValue, { color: '#06B6D4' }]}>
                  ₹
                  {Math.round(
                    (stats?.brandCoinTotalLiabilityPaise ?? totalBrandLiability) / 100
                  ).toLocaleString()}
                </Text>
              </View>
              <View style={styles.liabilityRow}>
                <Text style={styles.liabilityLabel}>Active Bookings</Text>
                <Text style={[styles.liabilityValue, { color: '#8B5CF6' }]}>
                  {stats?.activeBookings ?? 0}
                </Text>
              </View>
              <View style={[styles.liabilityRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.liabilityLabel}>Today GMV</Text>
                <Text style={[styles.liabilityValue, { color: '#7C3AED' }]}>
                  ₹{Math.round((stats?.gmvTodayPaise ?? 0) / 100).toLocaleString()}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Brand Coin Properties</Text>
            {hotels.filter((h) => h.brandCoinEnabled).length === 0 ? (
              <Text style={styles.emptyText}>No hotels have brand coins enabled yet.</Text>
            ) : (
              hotels
                .filter((h) => h.brandCoinEnabled)
                .map((h) => (
                  <View key={h.id} style={styles.brandCoinRow}>
                    <Text style={styles.brandCoinHotel} numberOfLines={1}>
                      {h.name}
                    </Text>
                    <Text style={styles.brandCoinName}>{h.brandCoinName}</Text>
                    <Text style={[styles.brandCoinAmount, { color: '#7C3AED' }]}>
                      ₹{Math.round(h.brandCoinOutstandingPaise / 100).toLocaleString()}
                    </Text>
                  </View>
                ))
            )}
          </>
        ) : activeTab === 'hotels' ? (
          <>
            <TextInput
              style={styles.searchBox}
              placeholder="Search hotels..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
            />
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>No hotels found.</Text>
            ) : (
              filtered.map((h) => <HotelRow key={h.id} hotel={h} />)
            )}
          </>
        ) : (
          /* Liability detail */
          <>
            <View style={styles.liabilityCard}>
              <Text style={styles.liabilityHeading}>Total Coin Liability</Text>
              <View style={styles.liabilityRow}>
                <Text style={styles.liabilityLabel}>Brand Coin Liability</Text>
                <Text style={[styles.liabilityValue, { color: '#06B6D4' }]}>
                  ₹
                  {Math.round(
                    (stats?.brandCoinTotalLiabilityPaise ?? totalBrandLiability) / 100
                  ).toLocaleString()}
                </Text>
              </View>
              <View style={styles.liabilityRow}>
                <Text style={styles.liabilityLabel}>Active Bookings</Text>
                <Text style={[styles.liabilityValue, { color: '#8B5CF6' }]}>
                  {stats?.activeBookings ?? 0}
                </Text>
              </View>
              <View style={[styles.liabilityRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.liabilityLabel}>Today GMV</Text>
                <Text style={[styles.liabilityValue, { color: '#7C3AED' }]}>
                  ₹{Math.round((stats?.gmvTodayPaise ?? 0) / 100).toLocaleString()}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Per-Hotel Brand Coin Liability
            </Text>
            {hotels
              .filter((h) => h.brandCoinEnabled && h.brandCoinOutstandingPaise > 0)
              .map((h) => (
                <View key={h.id} style={styles.perHotelRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.perHotelName} numberOfLines={1}>
                      {h.name}
                    </Text>
                    <Text style={styles.perHotelCity}>
                      {h.city} · {h.brandCoinName}
                    </Text>
                  </View>
                  <Text style={styles.perHotelAmount}>
                    ₹{Math.round(h.brandCoinOutstandingPaise / 100).toLocaleString()}
                  </Text>
                </View>
              ))}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#06B6D4' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#06B6D4' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 1 },
    }),
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: '800' },
  statSub: { fontSize: 10, color: '#94A3B8' },
  liabilityCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  liabilityHeading: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  liabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  liabilityLabel: { fontSize: 14, color: '#64748B' },
  liabilityValue: { fontSize: 15, fontWeight: '800' },
  brandCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  brandCoinHotel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A' },
  brandCoinName: { fontSize: 11, color: '#94A3B8', marginRight: 12 },
  brandCoinAmount: { fontSize: 13, fontWeight: '800' },
  hotelRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 1 },
    }),
  },
  hotelName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  hotelCity: { fontSize: 12, color: '#64748B', marginTop: 1 },
  hotelStat: { fontSize: 11, color: '#64748B' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  onboardBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  onboardText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coinBadgeText: { fontSize: 10, color: '#7C3AED', fontWeight: '600' },
  searchBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 20 },
  perHotelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  perHotelName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  perHotelCity: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  perHotelAmount: { fontSize: 15, fontWeight: '800', color: '#7C3AED' },
});
