'use client';

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Types
interface KarmaProfile {
  level: number;
  currentKarma: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  progressToNextLevel: number;
  completedMissions: number;
  redeemedPerks: number;
  earnedBadges: number;
}

interface TierInfo {
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
}

// Constants
const TIERS: TierInfo[] = [
  { name: 'Bronze', minPoints: 0, maxPoints: 999, color: '#CD7F32' },
  { name: 'Silver', minPoints: 1000, maxPoints: 2499, color: '#C0C0C0' },
  { name: 'Gold', minPoints: 2500, maxPoints: 4999, color: '#FFD700' },
  { name: 'Platinum', minPoints: 5000, maxPoints: Infinity, color: '#E5E4E2' },
];

export default function KarmaDashboard() {
  const [profile, setProfile] = useState<KarmaProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/karma/profile');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    const tierInfo = TIERS.find(t => t.name.toLowerCase() === tier.toLowerCase());
    return tierInfo?.color || '#888';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Karma Level Card */}
      <View style={[styles.karmaCard, { borderColor: getTierColor(profile?.tier || 'bronze')}]}>
        <Text style={styles.levelText}>Level {profile?.level || 1}</Text>
        <Text style={styles.karmaText}>{profile?.currentKarma || 0} Karma</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${profile?.progressToNextLevel || 0}%` }
            ]}
          />
        </View>
        <Text style={styles.tierText}>{profile?.tier?.toUpperCase() || 'BRONZE'} TIER</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.completedMissions || 0}</Text>
          <Text style={styles.statLabel}>Missions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.redeemedPerks || 0}</Text>
          <Text style={styles.statLabel}>Perks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.earnedBadges || 0}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  karmaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  levelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  karmaText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginTop: 12,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
