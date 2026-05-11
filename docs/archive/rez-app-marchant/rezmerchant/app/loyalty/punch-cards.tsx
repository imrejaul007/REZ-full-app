/**
 * Loyalty Punch Card Rules Screen
 *
 * Lists active punch card programs and lets merchants create new ones.
 * POST /api/merchant/punch-cards — create rule
 * PATCH /api/merchant/punch-cards/:id — toggle isActive / update reward
 * DELETE /api/merchant/punch-cards/:id — soft delete
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiClient } from '@/services/api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PunchCardRule {
  _id: string;
  name: string;
  description?: string;
  requiredVisits: number;
  rewardDescription: string;
  storeId?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface FormState {
  name: string;
  requiredVisits: number;
  rewardDescription: string;
  storeId: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  requiredVisits: 5,
  rewardDescription: '',
  storeId: '',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface VisitsSliderProps {
  value: number;
  onChange: (v: number) => void;
}

const VISITS_MIN = 3;
const VISITS_MAX = 20;
const VISITS_STEPS = Array.from({ length: VISITS_MAX - VISITS_MIN + 1 }, (_, i) => i + VISITS_MIN);

const VisitsSlider = ({ value, onChange }: VisitsSliderProps) => (
  <View style={sliderStyles.container}>
    <View style={sliderStyles.track}>
      {VISITS_STEPS.map((step) => (
        <TouchableOpacity
          key={step}
          style={[sliderStyles.step, step === value && sliderStyles.stepActive]}
          onPress={() => onChange(step)}
        />
      ))}
    </View>
    <Text style={sliderStyles.valueLabel}>{value} visits required</Text>
  </View>
);

const sliderStyles = StyleSheet.create({
  container: { marginVertical: 4 },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 3,
  },
  step: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  stepActive: {
    backgroundColor: '#6366f1',
    height: 16,
    borderRadius: 8,
  },
  valueLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
    textAlign: 'center',
  },
});

// ---------------------------------------------------------------------------
// Card item
// ---------------------------------------------------------------------------

interface PunchCardItemProps {
  card: PunchCardRule;
  onToggle: (id: string, next: boolean) => void;
  onDelete: (id: string) => void;
}

const PunchCardItem = ({ card, onToggle, onDelete }: PunchCardItemProps) => {
  const confirmDelete = () =>
    Alert.alert('Remove Punch Card', `Remove "${card.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onDelete(card._id) },
    ]);

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <View style={cardStyles.iconWrap}>
          <Ionicons name="gift-outline" size={22} color="#6366f1" />
        </View>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name} numberOfLines={1}>
            {card.name}
          </Text>
          <Text style={cardStyles.meta}>
            {card.requiredVisits} visits → {card.rewardDescription}
          </Text>
        </View>
        <Switch
          value={card.isActive}
          onValueChange={(v) => onToggle(card._id, v)}
          trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
          thumbColor={card.isActive ? '#6366f1' : '#9ca3af'}
        />
      </View>
      <View style={cardStyles.footer}>
        <View
          style={[
            cardStyles.badge,
            card.isActive ? cardStyles.badgeActive : cardStyles.badgeInactive,
          ]}
        >
          <Text
            style={[
              cardStyles.badgeText,
              card.isActive ? cardStyles.badgeTextActive : cardStyles.badgeTextInactive,
            ]}
          >
            {card.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <TouchableOpacity style={cardStyles.deleteBtn} onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
          <Text style={cardStyles.deleteBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeActive: { backgroundColor: '#d1fae5' },
  badgeInactive: { backgroundColor: '#f3f4f6' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextActive: { color: '#059669' },
  badgeTextInactive: { color: '#6b7280' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: '#ef4444' },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function PunchCardsScreen() {
  const [cards, setCards] = useState<PunchCardRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const fetchCards = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await apiClient.get<{ items: PunchCardRule[] }>('/merchant/punch-cards');
      if (res.success && res.data) {
        setCards(Array.isArray(res.data) ? res.data : ((res.data as any).items ?? []));
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load punch cards');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Please enter a card name');
      return;
    }
    if (!form.rewardDescription.trim()) {
      Alert.alert('Validation', 'Please enter a reward description');
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        name: form.name.trim(),
        requiredVisits: form.requiredVisits,
        rewardDescription: form.rewardDescription.trim(),
      };
      if (form.storeId.trim()) payload.storeId = form.storeId.trim();
      const res = await apiClient.post('/merchant/punch-cards', payload);
      if (res.success) {
        setShowModal(false);
        setForm(DEFAULT_FORM);
        await fetchCards();
      } else {
        Alert.alert('Error', (res as any).message || 'Failed to create punch card');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create punch card');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, next: boolean) => {
    try {
      await apiClient.patch(`/merchant/punch-cards/${id}`, { isActive: next });
      setCards((prev) => prev.map((c) => (c._id === id ? { ...c, isActive: next } : c)));
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update punch card');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/merchant/punch-cards/${id}`);
      setCards((prev) => prev.filter((c) => c._id !== id));
    } catch (e: any) {
      Alert.alert('Error', 'Failed to remove punch card');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading punch cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCards(true)}
            tintColor="#6366f1"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Ionicons name="gift" size={22} color="#6366f1" />
            <Text style={styles.pageTitle}>Punch Card Programs</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/loyalty/settings')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.settingsBtn}
          >
            <Ionicons name="settings-outline" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {cards.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={56} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No punch cards yet</Text>
            <Text style={styles.emptyDesc}>
              Create your first punch card program to reward loyal customers.
            </Text>
          </View>
        ) : (
          cards.map((card) => (
            <PunchCardItem
              key={card._id}
              card={card}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create bottom sheet modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Punch Card</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Card name */}
              <View style={styles.field}>
                <Text style={styles.label}>Card Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder='e.g. "Coffee Lover Card"'
                  placeholderTextColor="#9ca3af"
                  value={form.name}
                  onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                  returnKeyType="next"
                />
              </View>

              {/* Required visits slider */}
              <View style={styles.field}>
                <Text style={styles.label}>Required Visits</Text>
                <VisitsSlider
                  value={form.requiredVisits}
                  onChange={(v) => setForm((f) => ({ ...f, requiredVisits: v }))}
                />
              </View>

              {/* Reward description */}
              <View style={styles.field}>
                <Text style={styles.label}>Reward Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder='e.g. "Free cappuccino"'
                  placeholderTextColor="#9ca3af"
                  value={form.rewardDescription}
                  onChangeText={(t) => setForm((f) => ({ ...f, rewardDescription: t }))}
                  returnKeyType="next"
                />
              </View>

              {/* Store ID (optional) */}
              <View style={styles.field}>
                <Text style={styles.label}>Store ID (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Leave blank for all stores"
                  placeholderTextColor="#9ca3af"
                  value={form.storeId}
                  onChangeText={(t) => setForm((f) => ({ ...f, storeId: t }))}
                  returnKeyType="done"
                />
              </View>

              {/* Preview */}
              {form.name || form.rewardDescription ? (
                <View style={styles.preview}>
                  <Text style={styles.previewLabel}>Preview</Text>
                  <Text style={styles.previewText}>
                    {form.name || 'Card Name'} — {form.requiredVisits} visits for{' '}
                    {form.rewardDescription || 'reward'}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleCreate}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Create Punch Card</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  scrollContent: { padding: 16, paddingBottom: 100 },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  settingsBtn: { padding: 4 },

  empty: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },

  preview: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  previewLabel: { fontSize: 11, fontWeight: '600', color: '#6366f1', marginBottom: 4 },
  previewText: { fontSize: 14, fontWeight: '600', color: '#3730a3' },

  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
