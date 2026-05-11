import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { showAlert, showConfirm } from '../../utils/alert';
import { bbpsService } from '../../services/api/bbps';

interface Transaction {
  _id: string;
  userId: string;
  provider: string;
  billType: string;
  amount: number;
  status: 'completed' | 'failed' | 'processing' | 'refunded';
  aggregatorRef: string;
  promoCoinsIssued: number;
  createdAt: string;
}

// DUMMY_TRANSACTIONS intentionally removed — do not use dummy data in production

const STATUS_COLORS: Record<string, { color: string; bgColor: string }> = {
  completed: { color: '#10B981', bgColor: '#D1FAE5' },
  failed: { color: '#EF4444', bgColor: '#FEE2E2' },
  processing: { color: '#F59E0B', bgColor: '#FEF3C7' },
  refunded: { color: '#8B5CF6', bgColor: '#EDE9FE' },
};

export default function BBPSTransactionsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [statusFilter, transactions]);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const result = await bbpsService.getTransactions(1, 20);
      setTransactions(result.transactions);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterTransactions = () => {
    if (statusFilter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter((t) => t.status === statusFilter));
    }
  };

  const handleRefund = async () => {
    if (!selectedTransaction) return;
    try {
      setLoading(true);
      await bbpsService.refundTransaction(selectedTransaction._id);
      setTransactions((prev) =>
        prev.map((t) => (t._id === selectedTransaction._id ? { ...t, status: 'refunded' } : t))
      );
      showAlert('Success', 'Refund processed successfully');
      setShowRefundModal(false);
      setSelectedTransaction(null);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const headers = ['User ID', 'Provider', 'Amount', 'Status', 'Coins Issued', 'Date'];
      const rows = filteredTransactions.map((t) => [
        t.userId,
        t.provider,
        `₹${t.amount}`,
        t.status,
        t.promoCoinsIssued,
        new Date(t.createdAt).toLocaleDateString(),
      ]);

      const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

      await Share.share({
        message: csvContent,
        title: 'BBPS Transactions Export',
      });
    } catch (err: any) {
      showAlert('Error', 'Failed to export CSV');
    }
  };

  const renderStatusBadge = (status: Transaction['status']) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.processing;
    return (
      <View style={[styles.statusBadge, { backgroundColor: colors.bgColor }]}>
        <Text style={[styles.statusBadgeText, { color: colors.color }]}>
          {status.toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isExpanded = expandedId === item._id;
    const canRefund = item.status === 'failed' || item.status === 'processing';

    return (
      <View
        style={[
          styles.transactionCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => setExpandedId(isExpanded ? null : item._id)}
          style={styles.transactionMain}
        >
          <View style={styles.transactionContent}>
            <Text style={[styles.userIdText, { color: colors.icon }]}>
              {item.userId.substring(0, 12)}...
            </Text>
            <Text style={[styles.providerText, { color: colors.text }]}>{item.provider}</Text>
            <Text style={[styles.amountText, { color: colors.tint }]}>
              ₹{(item.amount ?? 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.transactionRight}>
            {renderStatusBadge(item.status)}
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.icon}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>Ref:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{item.aggregatorRef}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>Coins:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {item.promoCoinsIssued}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>Type:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{item.billType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>Date:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {canRefund && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedTransaction(item);
                  setShowRefundModal(true);
                }}
                style={[styles.refundButton, { backgroundColor: colors.error + '20' }]}
              >
                <Ionicons name="cash-outline" size={16} color={colors.error} />
                <Text style={[styles.refundButtonText, { color: colors.error }]}>
                  Refund Transaction
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Transactions</Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
            Total: {filteredTransactions.length}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleExportCSV}
          style={[styles.exportButton, { backgroundColor: colors.success + '20' }]}
        >
          <Ionicons name="download" size={20} color={colors.success} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {['all', 'completed', 'failed', 'processing', 'refunded'].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setStatusFilter(status)}
            style={[
              styles.filterChip,
              {
                backgroundColor: statusFilter === status ? colors.tint : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: statusFilter === status ? '#fff' : colors.text,
                  fontWeight: statusFilter === status ? '600' : '500',
                },
              ]}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction List */}
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
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          scrollEnabled
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No transactions found</Text>
            </View>
          }
        />
      )}

      {/* Refund Confirmation Modal */}
      <Modal visible={showRefundModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.confirmIcon}>
              <Ionicons name="help-circle-outline" size={48} color={colors.warning} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Refund</Text>
            <Text style={[styles.modalMessage, { color: colors.icon }]}>
              Are you sure you want to refund ₹{selectedTransaction?.amount} to{' '}
              {selectedTransaction?.userId}?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowRefundModal(false);
                  setSelectedTransaction(null);
                }}
                style={[styles.modalButton, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRefund}
                disabled={loading}
                style={[styles.modalButton, { backgroundColor: colors.error }]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Refund</Text>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 13,
  },
  listContent: {
    padding: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  transactionMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  transactionContent: {
    flex: 1,
  },
  userIdText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  providerText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  refundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  refundButtonText: {
    fontSize: 12,
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
    alignItems: 'center',
  },
  confirmIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    width: '100%',
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
