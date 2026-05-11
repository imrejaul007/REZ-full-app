import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { showAlert } from '../../utils/alert';
import { apiClient } from '../../services/api/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlaggedUser {
  userId: string;
  name: string;
  email: string | null;
  totalCoinsToday: number;
  checkInCount: number;
  flaggedAt: string;
}

interface QueueResponse {
  items: FlaggedUser[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ModerationQueueScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [users, setUsers] = useState<FlaggedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 20;

  // Reject modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FlaggedUser | null>(null);
  const [coinsToDeduct, setCoinsToDeduct] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchQueue = useCallback(async (targetPage: number, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (targetPage === 1) {
      setIsLoading(true);
    }

    try {
      const response = await apiClient.get<QueueResponse>(
        `admin/moderation/queue?page=${targetPage}&limit=${LIMIT}`
      );

      if (response.success && response.data) {
        const { items, total, totalPages: pages } = response.data;
        if (targetPage === 1) {
          setUsers(items);
        } else {
          setUsers((prev) => [...prev, ...items]);
        }
        setTotalCount(total);
        setTotalPages(pages);
        setPage(targetPage);
      } else {
        showAlert('Error', response.message || 'Failed to load moderation queue');
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Network error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue(1);
  }, [fetchQueue]);

  const handleRefresh = useCallback(() => {
    fetchQueue(1, true);
  }, [fetchQueue]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && !refreshing && page < totalPages) {
      fetchQueue(page + 1);
    }
  }, [isLoading, refreshing, page, totalPages, fetchQueue]);

  // ── Approve ─────────────────────────────────────────────────────────────────

  const handleApprove = useCallback(async (user: FlaggedUser) => {
    try {
      const response = await apiClient.post(`admin/moderation/${user.userId}/approve`);
      if (response.success) {
        setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
        setTotalCount((prev) => Math.max(0, prev - 1));
        showAlert('Approved', `${user.name} has been cleared.`);
      } else {
        showAlert('Error', response.message || 'Failed to approve user');
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Network error');
    }
  }, []);

  // ── Reject ──────────────────────────────────────────────────────────────────

  const openRejectModal = useCallback((user: FlaggedUser) => {
    setSelectedUser(user);
    setCoinsToDeduct('');
    setRejectReason('');
    setRejectModalVisible(true);
  }, []);

  const closeRejectModal = useCallback(() => {
    setRejectModalVisible(false);
    setSelectedUser(null);
  }, []);

  const handleRejectSubmit = useCallback(async () => {
    if (!selectedUser) return;

    const coins = parseInt(coinsToDeduct, 10);
    if (isNaN(coins) || coins <= 0) {
      showAlert('Validation', 'Enter a valid positive coin amount to deduct.');
      return;
    }
    if (coins > 100000) {
      showAlert('Validation', 'Coin deduction cannot exceed 100,000.');
      return;
    }
    if (!rejectReason.trim()) {
      showAlert('Validation', 'Please provide a reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post(`admin/moderation/${selectedUser.userId}/reject`, {
        coinsToDeduct: coins,
        reason: rejectReason.trim(),
      });

      if (response.success) {
        setUsers((prev) => prev.filter((u) => u.userId !== selectedUser.userId));
        setTotalCount((prev) => Math.max(0, prev - 1));
        closeRejectModal();
        showAlert('Rejected', `${coins} coins deducted from ${selectedUser.name}.`);
      } else {
        showAlert('Error', response.message || 'Failed to reject user');
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedUser, coinsToDeduct, rejectReason, closeRejectModal]);

  // ── Row Renderer ─────────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: FlaggedUser }) => (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="person" size={18} color={colors.error} />
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.email ? (
                <Text style={[styles.userEmail, { color: colors.muted }]} numberOfLines={1}>
                  {item.email}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.errorLight }]}>
            <Ionicons name="warning-outline" size={12} color={colors.error} />
            <Text style={[styles.badgeText, { color: colors.error }]}>Flagged</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {item.totalCoinsToday.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Coins Today</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.checkInCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Check-Ins</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton, { borderColor: colors.success }]}
            onPress={() => handleApprove(item)}
            activeOpacity={0.75}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text style={[styles.actionButtonText, { color: colors.success }]}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton, { backgroundColor: colors.error }]}
            onPress={() => openRejectModal(item)}
            activeOpacity={0.75}
          >
            <Ionicons name="close-circle-outline" size={16} color="#fff" />
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [colors, handleApprove, openRejectModal]
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header summary */}
      <View
        style={[styles.summaryBar, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Ionicons name="shield-outline" size={16} color={colors.warning} />
        <Text style={[styles.summaryText, { color: colors.text }]}>
          {totalCount} flagged {totalCount === 1 ? 'user' : 'users'} today
        </Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          !isLoading && page < totalPages ? (
            <ActivityIndicator style={styles.footerLoader} color={colors.tint} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={56} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No flagged activity</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              All users are within normal coin earning limits today.
            </Text>
          </View>
        }
      />

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeRejectModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Reject {'&'} Deduct Coins
              </Text>
              <TouchableOpacity
                onPress={closeRejectModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                User: {selectedUser.name}
              </Text>
            )}

            <Text style={[styles.fieldLabel, { color: colors.text }]}>Coins to Deduct</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="e.g. 200"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={coinsToDeduct}
              onChangeText={setCoinsToDeduct}
            />

            <Text style={[styles.fieldLabel, { color: colors.text }]}>Reason</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Describe the reason for rejection..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={closeRejectModal}
                disabled={isSubmitting}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  { backgroundColor: isSubmitting ? colors.muted : colors.error },
                ]}
                onPress={handleRejectSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Confirm Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
  },
  // Card
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 8,
  },
  approveButton: {
    borderWidth: 1.5,
  },
  rejectButton: {},
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: -8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalConfirmButton: {},
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
