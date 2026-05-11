import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameConfigItem } from '../../services/api/gameConfig';
import { Colors } from '../../constants/Colors';

type GameType = 'spin_wheel' | 'memory_match' | 'coin_hunt' | 'guess_price' | 'quiz' | 'scratch_card';

const GAME_TYPE_DISPLAY: Record<string, { label: string; emoji: string; color: string }> = {
  spin_wheel: { label: 'Spin Wheel', emoji: '\uD83C\uDFB0', color: Colors.light.error },
  memory_match: { label: 'Memory Match', emoji: '\uD83E\uDDE0', color: Colors.light.purple },
  coin_hunt: { label: 'Coin Hunt', emoji: '\uD83E\uDE99', color: Colors.light.warning },
  guess_price: { label: 'Guess the Price', emoji: '\uD83D\uDCB0', color: Colors.light.success },
  quiz: { label: 'Quiz', emoji: '\uD83D\uDCDD', color: Colors.light.info },
  scratch_card: { label: 'Scratch Card', emoji: '\uD83C\uDFAB', color: Colors.light.pink },
};

interface AnalyticsTabProps {
  analyticsData: any;
  analyticsLoading: boolean;
  analyticsDays: number;
  colors: Record<string, string>;
  onRefresh: () => void;
  onChangeDays: (days: number) => void;
}

export default function AnalyticsTab({
  analyticsData,
  analyticsLoading,
  analyticsDays,
  colors,
  onRefresh,
  onChangeDays,
}: AnalyticsTabProps) {
  if (analyticsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={{ color: colors.icon, marginTop: 12 }}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View style={styles.emptyContainer}>
        <TouchableOpacity
          style={[styles.seedBtn, { backgroundColor: colors.tint }]}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={16} color={colors.card} />
          <Text style={styles.seedBtnText}>Load Analytics</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { stats, topPlayers } = analyticsData;

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      {/* Period selector */}
      <View style={[styles.statsRow, { marginBottom: 8 }]}>
        {[7, 30, 90].map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.statItem,
              { backgroundColor: analyticsDays === d ? colors.tint : colors.card },
            ]}
            onPress={() => onChangeDays(d)}
          >
            <Text
              style={[
                styles.statValue,
                { color: analyticsDays === d ? colors.card : colors.text, fontSize: 16 },
              ]}
            >
              {d}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Per-game stats */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Game Performance</Text>
      {(stats || []).map((stat: any) => {
        const info = GAME_TYPE_DISPLAY[stat._id as string] || {
          label: stat._id,
          emoji: '🎮',
          color: colors.mutedDark,
        };
        return (
          <View
            key={stat._id}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: info.color },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{info.emoji}</Text>
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                {info.label}
              </Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 8 }]}>
              <View style={[styles.infoChip, { backgroundColor: colors.background }]}>
                <Text style={[styles.infoChipText, { color: colors.text }]}>
                  {stat.totalPlayed} played
                </Text>
              </View>
              <View style={[styles.infoChip, { backgroundColor: `${colors.success}15` }]}>
                <Text style={[styles.infoChipText, { color: colors.success }]}>
                  {stat.totalCoins} coins
                </Text>
              </View>
              <View style={[styles.infoChip, { backgroundColor: colors.background }]}>
                <Text style={[styles.infoChipText, { color: colors.text }]}>
                  {stat.uniquePlayers} players
                </Text>
              </View>
              <View style={[styles.infoChip, { backgroundColor: colors.background }]}>
                <Text style={[styles.infoChipText, { color: colors.text }]}>
                  {Math.round(stat.winRate)}% win
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Top players */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
        Top Players (by coins)
      </Text>
      {(topPlayers || []).slice(0, 10).map((p: any, i: number) => (
        <View
          key={i}
          style={[styles.card, { backgroundColor: colors.card, paddingVertical: 10, paddingHorizontal: 14 }]}
        >
          <View style={styles.topPlayerRow}>
            <View style={styles.topPlayerLeft}>
              <Text
                style={[
                  styles.topPlayerRank,
                  { color: i < 3 ? colors.warning : colors.icon },
                ]}
              >
                #{i + 1}
              </Text>
              <View>
                <Text style={styles.topPlayerName}>
                  {p.user?.fullName || p.user?.username || 'Unknown'}
                </Text>
                <Text style={styles.topPlayerGames}>{p.gamesPlayed} games</Text>
              </View>
            </View>
            <Text style={styles.topPlayerCoins}>
              {p.totalCoins} coins
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  seedBtnText: {
    color: Colors.light.card,
    fontWeight: '600',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardEmoji: { fontSize: 28 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  infoChipText: { fontSize: 11, fontWeight: '500' },
  topPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topPlayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topPlayerRank: {
    fontSize: 16,
    fontWeight: '700',
    width: 24,
  },
  topPlayerName: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  topPlayerGames: { fontSize: 11, color: Colors.light.icon },
  topPlayerCoins: { fontSize: 16, fontWeight: '700', color: Colors.light.success },
});
