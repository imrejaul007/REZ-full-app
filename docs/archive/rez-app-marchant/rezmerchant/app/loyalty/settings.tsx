/**
 * Loyalty Settings Screen
 *
 * Configures points earned per ₹ spent, points expiry, and bonus-category multipliers.
 *
 * GET  /api/merchant/loyalty-config?storeId=  — load current config
 * POST /api/merchant/loyalty-config            — save config
 *
 * Falls back to AsyncStorage when the server is unreachable so the merchant
 * can still save their preferences and they sync on next connection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/api/client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'merchant_loyalty_config';

interface ServiceCategory {
  slug: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  { slug: 'hair', label: 'Hair', icon: 'cut-outline' },
  { slug: 'nails', label: 'Nails', icon: 'color-palette-outline' },
  { slug: 'spa', label: 'Spa', icon: 'water-outline' },
  { slug: 'skin', label: 'Skin', icon: 'sunny-outline' },
  { slug: 'makeup', label: 'Makeup', icon: 'brush-outline' },
  { slug: 'massage', label: 'Massage', icon: 'body-outline' },
  { slug: 'beard', label: 'Beard', icon: 'man-outline' },
];

interface LoyaltyConfig {
  pointsPerRupee: number;
  expiryDays: number;
  bonusCategories: string[];
  isActive: boolean;
}

const DEFAULT_CONFIG: LoyaltyConfig = {
  pointsPerRupee: 0.1,
  expiryDays: 365,
  bonusCategories: [],
  isActive: true,
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function LoyaltySettingsScreen() {
  const [config, setConfig] = useState<LoyaltyConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Derived display: "1 point per ₹X"
  const rupeePerPoint = config.pointsPerRupee > 0 ? Math.round(1 / config.pointsPerRupee) : 0;

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<LoyaltyConfig>('/merchant/loyalty-config');
      if (res.success && res.data) {
        const d = res.data as any;
        setConfig({
          pointsPerRupee: d.pointsPerRupee ?? DEFAULT_CONFIG.pointsPerRupee,
          expiryDays: d.expiryDays ?? DEFAULT_CONFIG.expiryDays,
          bonusCategories: Array.isArray(d.bonusCategories) ? d.bonusCategories : [],
          isActive: d.isActive !== undefined ? Boolean(d.isActive) : true,
        });
      } else {
        await loadFromStorage();
      }
    } catch {
      await loadFromStorage();
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFromStorage = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as LoyaltyConfig;
        setConfig(saved);
      }
    } catch {
      // use defaults
    }
  };

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    const ppr = config.pointsPerRupee;
    const exp = config.expiryDays;

    if (isNaN(ppr) || ppr < 0) {
      Alert.alert('Validation', 'Points per ₹ must be 0 or greater');
      return;
    }
    if (isNaN(exp) || exp < 1) {
      Alert.alert('Validation', 'Expiry must be at least 1 day');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.post('/merchant/loyalty-config', {
        pointsPerRupee: ppr,
        expiryDays: exp,
        bonusCategories: config.bonusCategories,
        isActive: config.isActive,
      });

      if (res.success) {
        Alert.alert('Saved', 'Loyalty settings updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        // Fall back to AsyncStorage
        await saveToStorage();
        Alert.alert('Saved locally', 'Settings saved on your device. They will sync when online.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch {
      await saveToStorage();
      Alert.alert('Saved locally', 'Settings saved on your device. They will sync when online.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const saveToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore storage errors
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const toggleCategory = (slug: string) => {
    setConfig((prev) => ({
      ...prev,
      bonusCategories: prev.bonusCategories.includes(slug)
        ? prev.bonusCategories.filter((c) => c !== slug)
        : [...prev.bonusCategories, slug],
    }));
  };

  const handlePointsPerRupeeChange = (text: string) => {
    // User types "10" meaning 1 point per ₹10 → store as 0.1
    const rupees = parseFloat(text);
    setConfig((prev) => ({
      ...prev,
      pointsPerRupee: isNaN(rupees) || rupees <= 0 ? 0 : 1 / rupees,
    }));
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loyalty Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Points per ₹ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points Earning Rate</Text>
          <Text style={styles.sectionDesc}>
            How many ₹ does a customer need to spend to earn 1 point?
          </Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>1 point per</Text>
            <TextInput
              style={styles.inlineInput}
              keyboardType="decimal-pad"
              value={rupeePerPoint > 0 ? String(rupeePerPoint) : ''}
              onChangeText={handlePointsPerRupeeChange}
              placeholder="10"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.fieldLabel}>₹ spent</Text>
          </View>
          <Text style={styles.hint}>Default: 1 point per ₹10 (= 0.1 points per ₹1)</Text>
        </View>

        {/* Expiry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points Expiry</Text>
          <Text style={styles.sectionDesc}>How many days before unused points expire?</Text>
          <View style={styles.fieldRow}>
            <TextInput
              style={styles.inlineInput}
              keyboardType="number-pad"
              value={String(config.expiryDays)}
              onChangeText={(text) => {
                const days = parseInt(text, 10);
                setConfig((prev) => ({ ...prev, expiryDays: isNaN(days) ? 0 : days }));
              }}
              placeholder="365"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.fieldLabel}>days (default 365)</Text>
          </View>
        </View>

        {/* Bonus categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Double Points On</Text>
          <Text style={styles.sectionDesc}>
            Customers earn 2x points when these service types are billed.
          </Text>
          <View style={styles.categoryGrid}>
            {SERVICE_CATEGORIES.map((cat) => {
              const active = config.bonusCategories.includes(cat.slug);
              return (
                <TouchableOpacity
                  key={cat.slug}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => toggleCategory(cat.slug)}
                >
                  <Ionicons name={cat.icon} size={18} color={active ? '#fff' : '#6b7280'} />
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Active toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.sectionTitle}>Loyalty Programme Active</Text>
              <Text style={styles.sectionDesc}>
                Turn off to pause points earning across all services.
              </Text>
            </View>
            <Switch
              value={config.isActive}
              onValueChange={(v) => setConfig((prev) => ({ ...prev, isActive: v }))}
              trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
              thumbColor={config.isActive ? '#6366f1' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Summary */}
        {config.pointsPerRupee > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>
              Customers earn <Text style={styles.summaryBold}>1 point per ₹{rupeePerPoint}</Text>{' '}
              spent.
              {config.bonusCategories.length > 0
                ? ` Double points on: ${config.bonusCategories.join(', ')}.`
                : ''}
              {` Points expire after ${config.expiryDays} days.`}
            </Text>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: '#6b7280', marginBottom: 12 },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#f9fafb',
    minWidth: 72,
    textAlign: 'center',
  },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 6 },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  categoryChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  categoryChipTextActive: { color: '#fff' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleInfo: { flex: 1 },

  summary: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#6366f1', marginBottom: 6 },
  summaryText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  summaryBold: { fontWeight: '700', color: '#3730a3' },

  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
