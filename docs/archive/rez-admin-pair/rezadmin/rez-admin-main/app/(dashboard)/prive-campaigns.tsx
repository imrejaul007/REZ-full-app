import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { showAlert } from '../../utils/alert';
import { priveService } from '../../services/api/prive';

interface PriveSubmission {
  _id: string;
  username: string;
  platform: 'instagram' | 'twitter' | 'youtube';
  campaignName: string;
  postUrl: string;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
}

// DUMMY_SUBMISSIONS removed — do not use dummy data in production

const PLATFORM_COLORS: Record<string, { label: string; color: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C' },
  twitter: { label: 'Twitter/X', color: '#000000' },
  youtube: { label: 'YouTube', color: '#FF0000' },
};

export default function PriveCampaignsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [submissions, setSubmissions] = useState<PriveSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<PriveSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tabFilter, setTabFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'pending'
  );
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<PriveSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [tabFilter, platformFilter, submissions]);

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await priveService.getSubmissions();
      setSubmissions(data);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterSubmissions = () => {
    let filtered = submissions;

    if (tabFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === tabFilter);
    }

    if (platformFilter !== 'all') {
      filtered = filtered.filter((s) => s.platform === platformFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const handleApprove = async (submission: PriveSubmission) => {
    try {
      setLoading(true);
      await priveService.reviewSubmission(submission._id, 'approve');
      setSubmissions((prev) =>
        prev.map((s) => (s._id === submission._id ? { ...s, status: 'approved' as const } : s))
      );
      showAlert('Success', 'Submission approved');
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to approve submission');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    if (!rejectionReason.trim()) {
      showAlert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      setLoading(true);
      await priveService.reviewSubmission(selectedSubmission._id, 'reject', rejectionReason);
      setSubmissions((prev) =>
        prev.map((s) =>
          s._id === selectedSubmission._id
            ? { ...s, status: 'rejected' as const, rejectionReason }
            : s
        )
      );
      showAlert('Success', 'Submission rejected');
      setShowRejectModal(false);
      setSelectedSubmission(null);
      setRejectionReason('');
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to reject submission');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedItems);
    if (ids.length === 0) return;

    try {
      setLoading(true);
      const result = await priveService.bulkReviewSubmissions(ids, 'approve');
      setSubmissions((prev) =>
        prev.map((s) => (ids.includes(s._id) ? { ...s, status: 'approved' as const } : s))
      );
      setSelectedItems(new Set());
      showAlert('Success', result.message);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to approve selected submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedItems);
    if (ids.length === 0) return;

    try {
      setLoading(true);
      const result = await priveService.bulkReviewSubmissions(
        ids,
        'reject',
        'Bulk rejected by admin'
      );
      setSubmissions((prev) =>
        prev.map((s) =>
          ids.includes(s._id)
            ? { ...s, status: 'rejected' as const, rejectionReason: 'Bulk rejected by admin' }
            : s
        )
      );
      setSelectedItems(new Set());
      showAlert('Success', result.message);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to reject selected submissions');
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  const renderSubmissionCard = ({ item }: { item: PriveSubmission }) => {
    const isSelected = selectedItems.has(item._id);
    const platformInfo = PLATFORM_COLORS[item.platform];

    return (
      <View
        style={[
          styles.submissionCard,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.tint : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        <TouchableOpacity style={styles.selectButton} onPress={() => toggleItemSelection(item._id)}>
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: isSelected ? colors.tint : colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </TouchableOpacity>

        <View style={styles.submissionContent}>
          <View style={styles.headerRow}>
            <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
            <View style={[styles.platformBadge, { backgroundColor: platformInfo.color + '20' }]}>
              <Text style={[styles.platformBadgeText, { color: platformInfo.color }]}>
                {platformInfo.label}
              </Text>
            </View>
          </View>

          <Text style={[styles.campaignName, { color: colors.text }]}>{item.campaignName}</Text>

          <TouchableOpacity
            onPress={() => {
              Linking.openURL(item.postUrl).catch(() => {
                showAlert('Error', 'Could not open URL');
              });
            }}
          >
            <Text style={[styles.postUrl, { color: colors.info }]}>View Post ↗</Text>
          </TouchableOpacity>

          {item.screenshotUrl && (
            <View style={[styles.screenshotPlaceholder, { backgroundColor: colors.background }]}>
              <Ionicons name="image" size={32} color={colors.icon} />
              <Text style={[styles.screenshotText, { color: colors.icon }]}>Screenshot</Text>
            </View>
          )}

          {item.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => handleApprove(item)}
                disabled={loading}
                style={[styles.approveButton, { backgroundColor: colors.success }]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSelectedSubmission(item);
                  setShowRejectModal(true);
                }}
                style={[styles.rejectButton, { backgroundColor: colors.error }]}
              >
                <Ionicons name="close-circle" size={16} color="#fff" />
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.status === 'rejected' && item.rejectionReason && (
            <View
              style={[
                styles.rejectionBox,
                { backgroundColor: colors.error + '20', borderColor: colors.error },
              ]}
            >
              <Ionicons name="close-circle" size={14} color={colors.error} />
              <Text style={[styles.rejectionText, { color: colors.error }]}>
                {item.rejectionReason}
              </Text>
            </View>
          )}

          {item.status === 'approved' && (
            <View
              style={[
                styles.approvedBox,
                { backgroundColor: colors.success + '20', borderColor: colors.success },
              ]}
            >
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.approvedText, { color: colors.success }]}>Approved</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const getAnalytics = () => {
    const total = submissions.length;
    const approved = submissions.filter((s) => s.status === 'approved').length;
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(0) : '0';

    return { total, approvalRate };
  };

  const analytics = getAnalytics();

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Privé Campaigns</Text>
          {pendingCount > 0 && (
            <View style={[styles.pendingBadge, { backgroundColor: colors.warning }]}>
              <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {[
            { label: 'All', value: 'all', count: submissions.length },
            {
              label: 'Pending',
              value: 'pending',
              count: submissions.filter((s) => s.status === 'pending').length,
            },
            {
              label: 'Approved',
              value: 'approved',
              count: submissions.filter((s) => s.status === 'approved').length,
            },
            {
              label: 'Rejected',
              value: 'rejected',
              count: submissions.filter((s) => s.status === 'rejected').length,
            },
          ].map((tab) => {
            const isActive = tabFilter === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                onPress={() => setTabFilter(tab.value as any)}
                style={[
                  styles.tab,
                  {
                    borderBottomColor: isActive ? colors.tint : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? colors.tint : colors.secondaryText,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      { backgroundColor: isActive ? colors.tint : colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        { color: isActive ? '#fff' : colors.secondaryText },
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.platformFilters}
        >
          {[
            { label: 'All', value: 'all' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'YouTube', value: 'youtube' },
          ].map((platform) => (
            <TouchableOpacity
              key={platform.value}
              onPress={() => setPlatformFilter(platform.value)}
              style={[
                styles.platformChip,
                {
                  backgroundColor:
                    platformFilter === platform.value ? colors.info : colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.platformChipText,
                  {
                    color: platformFilter === platform.value ? '#fff' : colors.text,
                    fontWeight: platformFilter === platform.value ? '600' : '500',
                  },
                ]}
              >
                {platform.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Submissions List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : fetchError ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.emptyText, { color: colors.text }]}>{fetchError}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSubmissions}
          renderItem={renderSubmissionCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          scrollEnabled
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No submissions found</Text>
            </View>
          }
        />
      )}

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <View
          style={[
            styles.bulkActionBar,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <Text style={[styles.bulkActionText, { color: colors.text }]}>
            {selectedItems.size} selected
          </Text>
          <View style={styles.bulkActionButtons}>
            <TouchableOpacity
              style={[
                styles.bulkApproveButton,
                {
                  backgroundColor: colors.success + '20',
                  opacity: selectedItems.size === 0 || loading ? 0.5 : 1,
                },
              ]}
              disabled={selectedItems.size === 0 || loading}
              onPress={handleBulkApprove}
            >
              <Text style={[styles.bulkActionButtonText, { color: colors.success }]}>
                Approve Selected
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.bulkRejectButton,
                {
                  backgroundColor: colors.error + '20',
                  opacity: selectedItems.size === 0 || loading ? 0.5 : 1,
                },
              ]}
              disabled={selectedItems.size === 0 || loading}
              onPress={handleBulkReject}
            >
              <Text style={[styles.bulkActionButtonText, { color: colors.error }]}>
                Reject Selected
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Analytics Section */}
      <View
        style={[
          styles.analyticsContainer,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <Text style={[styles.analyticsLabel, { color: colors.icon }]}>Total Campaigns</Text>
            <Text style={[styles.analyticsValue, { color: colors.tint }]}>{analytics.total}</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={[styles.analyticsLabel, { color: colors.icon }]}>Approval Rate</Text>
            <Text style={[styles.analyticsValue, { color: colors.success }]}>
              {analytics.approvalRate}%
            </Text>
          </View>
        </View>
      </View>

      {/* Rejection Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reject Submission</Text>
            <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
              {selectedSubmission?.username} - {selectedSubmission?.campaignName}
            </Text>

            <TextInput
              style={[
                styles.rejectionInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Enter rejection reason..."
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={4}
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowRejectModal(false);
                  setSelectedSubmission(null);
                  setRejectionReason('');
                }}
                style={[styles.modalButton, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReject}
                disabled={loading}
                style={[styles.modalButton, { backgroundColor: colors.error }]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  pendingBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    borderBottomWidth: 1,
    flexGrow: 0,
    flexShrink: 0,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 13,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  platformFilters: {
    gap: 8,
  },
  platformChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  platformChipText: {
    fontSize: 12,
  },
  listContent: {
    padding: 12,
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submissionCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  selectButton: {
    marginRight: 10,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submissionContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
  },
  platformBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  campaignName: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  postUrl: {
    fontSize: 12,
    marginBottom: 8,
  },
  screenshotPlaceholder: {
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  screenshotText: {
    fontSize: 11,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
  },
  rejectionText: {
    fontSize: 11,
    flex: 1,
  },
  approvedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
  },
  approvedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  bulkActionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bulkActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bulkActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkApproveButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bulkRejectButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bulkActionButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  analyticsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  analyticsCard: {
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  analyticsLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: '700',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  rejectionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
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
