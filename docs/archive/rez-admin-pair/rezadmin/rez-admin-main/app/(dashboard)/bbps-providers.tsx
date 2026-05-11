import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { showAlert } from '../../utils/alert';
import { bbpsService } from '../../services/api/bbps';

interface Provider {
  _id: string;
  name: string;
  type: string;
  aggregatorCode: string;
  promoCoinsFixed: number;
  promoExpiryDays: number;
  maxRedemptionPercent: number;
  isActive: boolean;
}

// DUMMY_PROVIDERS removed — initial state is empty, real data loaded from API

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  electricity: { label: '⚡ ELECTRICITY', color: '#FCD34D' },
  mobile_prepaid: { label: '📱 MOBILE PREPAID', color: '#A78BFA' },
  mobile_postpaid: { label: '📱 MOBILE POSTPAID', color: '#A78BFA' },
  dth: { label: '📺 DTH', color: '#93C5FD' },
  gas: { label: '🔥 GAS', color: '#FB7185' },
  broadband: { label: '🌐 BROADBAND', color: '#34D399' },
  fastag: { label: '🚗 FASTAG', color: '#F87171' },
};

export default function BBPSProvidersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [editData, setEditData] = useState<Partial<Provider>>({});

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      const providers = await bbpsService.getProviders();
      setProviders(providers);
    } catch (err: any) {
      showAlert('Error', 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddProvider = async () => {
    if (!editData.name || !editData.type || !editData.aggregatorCode) {
      showAlert('Error', 'Please fill all required fields');
      return;
    }
    const pct = editData.maxRedemptionPercent ?? 15;
    if (pct < 1 || pct > 100) {
      showAlert('Error', 'Max Redemption % must be between 1 and 100');
      return;
    }
    try {
      setActionLoading(true);
      const newProvider = await bbpsService.createProvider({
        name: editData.name,
        type: editData.type,
        aggregatorCode: editData.aggregatorCode,
        promoCoinsFixed: editData.promoCoinsFixed || 15,
        promoExpiryDays: editData.promoExpiryDays || 7,
        maxRedemptionPercent: pct,
        isActive: true,
      });
      setProviders((prev) => [newProvider, ...prev]);
      showAlert('Success', 'Provider added successfully');
      setShowAddModal(false);
      setEditData({});
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to add provider');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProvider = async () => {
    if (!selectedProvider) return;
    const pct = editData.maxRedemptionPercent;
    if (pct != null && (pct < 1 || pct > 100)) {
      showAlert('Error', 'Max Redemption % must be between 1 and 100');
      return;
    }
    try {
      setActionLoading(true);
      const updatedProvider = await bbpsService.updateProvider(selectedProvider._id, editData);
      setProviders((prev) =>
        prev.map((p) => (p._id === selectedProvider._id ? updatedProvider : p))
      );
      showAlert('Success', 'Provider updated successfully');
      setShowEditModal(false);
      setSelectedProvider(null);
      setEditData({});
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to update provider');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (provider: Provider) => {
    // Optimistic update — toggle immediately, revert on failure
    setProviders((prev) =>
      prev.map((p) => (p._id === provider._id ? { ...p, isActive: !p.isActive } : p))
    );
    try {
      const result = await bbpsService.toggleProviderStatus(provider._id);
      if (!result.success) {
        // Revert
        setProviders((prev) =>
          prev.map((p) => (p._id === provider._id ? { ...p, isActive: provider.isActive } : p))
        );
        showAlert('Error', result.message || 'Failed to toggle provider');
      }
    } catch (err: any) {
      // Revert
      setProviders((prev) =>
        prev.map((p) => (p._id === provider._id ? { ...p, isActive: provider.isActive } : p))
      );
      showAlert('Error', err.message || 'Failed to toggle provider');
    }
  };

  const openEditModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setEditData({ ...provider });
    setShowEditModal(true);
  };

  const renderProvider = ({ item }: { item: Provider }) => {
    const badge = TYPE_BADGES[item.type] || { label: item.type.toUpperCase(), color: '#9CA3AF' };

    return (
      <View
        style={[styles.providerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.providerContent}>
          <View style={[styles.logoPlaceholder, { backgroundColor: badge.color + '30' }]}>
            <Text style={[styles.logoText, { color: badge.color }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.providerInfo}>
            <Text style={[styles.providerName, { color: colors.text }]}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, { backgroundColor: badge.color + '20' }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <Text style={[styles.statLabel, { color: colors.icon }]}>
                Code: {item.aggregatorCode}
              </Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>
                Coins: ₹{item.promoCoinsFixed}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.providerActions}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={[styles.actionButton, { backgroundColor: colors.info + '20' }]}
          >
            <Ionicons name="pencil" size={18} color={colors.info} />
          </TouchableOpacity>

          <Switch
            value={item.isActive}
            onValueChange={() => handleToggleActive(item)}
            trackColor={{ false: colors.border, true: colors.success }}
            thumbColor={item.isActive ? colors.success : colors.icon}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>BBPS Providers</Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
            Total: {providers.length}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setEditData({});
            setShowAddModal(true);
          }}
          style={[styles.addButton, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Provider List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <FlatList
          data={providers}
          renderItem={renderProvider}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.listContent, providers.length === 0 && { flex: 1 }]}
          scrollEnabled
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="server-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No providers yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
                Tap + to add your first BBPS provider
              </Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <ScrollView
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            bounces={false}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Provider</Text>

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Provider Name"
              placeholderTextColor={colors.icon}
              value={editData.name || ''}
              onChangeText={(v) => setEditData({ ...editData, name: v })}
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Type (e.g., electricity, mobile_prepaid)"
              placeholderTextColor={colors.icon}
              value={editData.type || ''}
              onChangeText={(v) => setEditData({ ...editData, type: v })}
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Aggregator Code"
              placeholderTextColor={colors.icon}
              value={editData.aggregatorCode || ''}
              onChangeText={(v) => setEditData({ ...editData, aggregatorCode: v })}
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Promo Coins Fixed"
              placeholderTextColor={colors.icon}
              keyboardType="number-pad"
              value={editData.promoCoinsFixed?.toString() || ''}
              onChangeText={(v) => setEditData({ ...editData, promoCoinsFixed: parseInt(v) || 0 })}
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Promo Expiry Days"
              placeholderTextColor={colors.icon}
              keyboardType="number-pad"
              value={editData.promoExpiryDays?.toString() || ''}
              onChangeText={(v) => setEditData({ ...editData, promoExpiryDays: parseInt(v) || 0 })}
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Max Redemption % (1-100)"
              placeholderTextColor={colors.icon}
              keyboardType="number-pad"
              value={editData.maxRedemptionPercent?.toString() || ''}
              onChangeText={(v) =>
                setEditData({ ...editData, maxRedemptionPercent: parseInt(v) || 0 })
              }
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setEditData({});
                }}
                style={[styles.modalButton, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddProvider}
                disabled={actionLoading}
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Add Provider</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <ScrollView
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            bounces={false}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Provider</Text>

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Promo Coins Fixed"
              placeholderTextColor={colors.icon}
              keyboardType="number-pad"
              value={editData.promoCoinsFixed?.toString() || ''}
              onChangeText={(v) => setEditData({ ...editData, promoCoinsFixed: parseInt(v) || 0 })}
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Promo Expiry Days"
              placeholderTextColor={colors.icon}
              keyboardType="number-pad"
              value={editData.promoExpiryDays?.toString() || ''}
              onChangeText={(v) => setEditData({ ...editData, promoExpiryDays: parseInt(v) || 0 })}
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Max Redemption % (1-100)"
              placeholderTextColor={colors.icon}
              keyboardType="number-pad"
              value={editData.maxRedemptionPercent?.toString() || ''}
              onChangeText={(v) =>
                setEditData({ ...editData, maxRedemptionPercent: parseInt(v) || 0 })
              }
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedProvider(null);
                  setEditData({});
                }}
                style={[styles.modalButton, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateProvider}
                disabled={actionLoading}
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  providerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  statLabel: {
    fontSize: 11,
  },
  providerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
