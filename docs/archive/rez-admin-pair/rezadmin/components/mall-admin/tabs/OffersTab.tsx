/**
 * components/mall-admin/tabs/OffersTab.tsx
 * ADM-005: Mall offers tab.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MallOffer } from '../../../services/api/mall';
import { Colors } from '../../../constants/Colors';

type ColorsType = typeof Colors.light;

interface Props {
  colors: ColorsType;
  offers: MallOffer[];
  loading: boolean;
  processingId: string | null;
  onRefresh: () => void;
  onEdit: (offer: MallOffer) => void;
  onDelete: (offer: MallOffer) => void;
  onToggleActive: (offer: MallOffer) => void;
}

export function OffersTab({ colors, offers, loading, processingId, onRefresh, onEdit, onDelete, onToggleActive }: Props) {
  const renderItem = ({ item }: { item: MallOffer }) => {
    const isProcessing = processingId === item._id;
    return (
      <View style={[card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={cardTop}>
          <View style={offerInfo}>
            <Text style={[offerTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[offerMeta, { color: colors.icon }]}>{item.offerType} · {item.value}{item.valueType === 'percentage' ? '%' : '₹'} · {item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
          <View style={[badge, { backgroundColor: item.isMallExclusive ? colors.tint + '20' : 'transparent', borderColor: item.isMallExclusive ? colors.tint : colors.border, borderWidth: item.isMallExclusive ? 1 : 0, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }]}>
            <Text style={[badgeText, { color: colors.tint }]}>{item.isMallExclusive ? 'Exclusive' : ''}</Text>
          </View>
        </View>
        <View style={cardActions}>
          <TouchableOpacity style={[toggleBtn, { backgroundColor: item.isActive ? colors.tint + '20' : colors.border + '80' }]} onPress={() => onToggleActive(item)} disabled={isProcessing}>
            <Ionicons name={item.isActive ? 'pause' : 'play'} size={14} color={item.isActive ? colors.tint : colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={actionBtn} onPress={() => onEdit(item)} disabled={isProcessing}>
            <Ionicons name="pencil" size={16} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity style={actionBtn} onPress={() => onDelete(item)} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator size="small" /> : <Ionicons name="trash" size={16} color="#ef4444" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[container, { backgroundColor: colors.background }]}>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : (
        <FlatList data={offers} renderItem={renderItem} keyExtractor={(item) => item._id} contentContainerStyle={{ padding: 12, gap: 8 }} refreshing={loading} onRefresh={onRefresh}
          ListEmptyComponent={<Text style={[emptyText, { color: colors.icon }]}>No offers yet</Text>} />
      )}
    </View>
  );
}

const container = StyleSheet.create({ flex: 1 } as any);
const card = StyleSheet.create({ padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 } as any);
const cardTop = StyleSheet.create({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } as any);
const offerInfo = StyleSheet.create({ flex: 1 } as any);
const offerTitle = StyleSheet.create({ fontSize: 15, fontWeight: '600' } as any);
const offerMeta = StyleSheet.create({ fontSize: 12, marginTop: 2 } as any);
const badge = StyleSheet.create({} as any);
const badgeText = StyleSheet.create({ fontSize: 11, fontWeight: '600' } as any);
const cardActions = StyleSheet.create({ flexDirection: 'row', gap: 6 } as any);
const toggleBtn = StyleSheet.create({ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' } as any);
const actionBtn = StyleSheet.create({ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' } as any);
const emptyText = StyleSheet.create({ textAlign: 'center', marginTop: 40, fontSize: 14 } as any);
