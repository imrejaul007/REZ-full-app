/**
 * components/mall-admin/tabs/ListingRequestsTab.tsx
 * ADM-005: Mall listing requests tab.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MallListingRequest } from '../../../services/api/mall';
import { Colors } from '../../../constants/Colors';

type ColorsType = typeof Colors.light;

interface Props {
  colors: ColorsType;
  requests: MallListingRequest[];
  filter: 'all' | 'pending' | 'approved' | 'rejected';
  loading: boolean;
  processingId: string | null;
  onFilterChange: (v: 'all' | 'pending' | 'approved' | 'rejected') => void;
  onRefresh: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ListingRequestsTab({ colors, requests, filter, loading, processingId, onFilterChange, onRefresh, onApprove, onReject }: Props) {
  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const renderItem = ({ item }: { item: MallListingRequest }) => {
    const isProcessing = processingId === item._id;
    const statusColor = item.status === 'approved' ? '#22c55e' : item.status === 'rejected' ? '#ef4444' : '#f59e0b';
    return (
      <View style={[card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={cardHeader}>
          <View style={cardLeft}>
            <Text style={[storeName, { color: colors.text }]}>{item.storeId?.name ?? 'Unknown Store'}</Text>
            {item.merchantId?.name && <Text style={[merchantName, { color: colors.icon }]}>by {item.merchantId.name}</Text>}
          </View>
          <View style={[statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        {item.reason && <Text style={[reasonText, { color: colors.icon }]}>"{item.reason}"</Text>}
        {item.status === 'pending' && (
          <View style={actionRow}>
            <TouchableOpacity style={[actionApprove, { backgroundColor: '#22c55e20' }]} onPress={() => onApprove(item._id)} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator size="small" color="#22c55e" /> : <><Ionicons name="checkmark" size={16} color="#22c55e" /><Text style={[actionText, { color: '#22c55e' }]}>Approve</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={[actionReject, { backgroundColor: '#ef444420' }]} onPress={() => onReject(item._id)} disabled={isProcessing}>
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={[actionText, { color: '#ef4444' }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[container, { backgroundColor: colors.background }]}>
      <View style={filterRow}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <TouchableOpacity key={f} style={[filterBtn, filter === f && { backgroundColor: colors.tint }]} onPress={() => onFilterChange(f)}>
            <Text style={[filterText, { color: filter === f ? colors.card : colors.icon }]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : (
        <FlatList data={filtered} renderItem={renderItem} keyExtractor={(item) => item._id} contentContainerStyle={{ padding: 12, gap: 10 }} refreshing={loading} onRefresh={onRefresh}
          ListEmptyComponent={<Text style={[emptyText, { color: colors.icon }]}>No requests found</Text>} />
      )}
    </View>
  );
}

const container = StyleSheet.create({ flex: 1 } as any);
const filterRow = StyleSheet.create({ flexDirection: 'row', padding: 12, gap: 8 } as any);
const filterBtn = StyleSheet.create({ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 } as any);
const filterText = StyleSheet.create({ fontSize: 13, fontWeight: '600' } as any);
const card = StyleSheet.create({ padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 } as any);
const cardHeader = StyleSheet.create({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 } as any);
const cardLeft = StyleSheet.create({ flex: 1 } as any);
const storeName = StyleSheet.create({ fontSize: 15, fontWeight: '600' } as any);
const merchantName = StyleSheet.create({ fontSize: 12, marginTop: 2 } as any);
const statusBadge = StyleSheet.create({ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 } as any);
const statusText = StyleSheet.create({ fontSize: 12, fontWeight: '600', textTransform: 'capitalize' } as any);
const reasonText = StyleSheet.create({ fontSize: 13, fontStyle: 'italic', marginBottom: 10 } as any);
const actionRow = StyleSheet.create({ flexDirection: 'row', gap: 10, marginTop: 8 } as any);
const actionApprove = StyleSheet.create({ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 } as any);
const actionReject = StyleSheet.create({ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 } as any);
const actionText = StyleSheet.create({ fontSize: 13, fontWeight: '600' } as any);
const emptyText = StyleSheet.create({ textAlign: 'center', marginTop: 40, fontSize: 14 } as any);
