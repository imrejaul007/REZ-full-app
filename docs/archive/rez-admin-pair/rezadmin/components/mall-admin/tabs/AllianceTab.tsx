/**
 * components/mall-admin/tabs/AllianceTab.tsx
 * ADM-005: Mall alliance stores tab.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AllianceStore } from '../../../services/api/mall';
import { Colors } from '../../../constants/Colors';

type ColorsType = typeof Colors.light;

interface Props {
  colors: ColorsType;
  stores: AllianceStore[];
  search: string;
  loading: boolean;
  processingId: string | null;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onToggleAlliance: (store: AllianceStore) => void;
}

export function AllianceTab({ colors, stores, search, loading, processingId, onSearchChange, onRefresh, onToggleAlliance }: Props) {
  const filtered = stores.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const renderItem = ({ item }: { item: AllianceStore }) => {
    const isProcessing = processingId === item._id;
    return (
      <View style={[card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={cardLeft}>
          <Text style={[storeName, { color: colors.text }]}>{item.name}</Text>
          {item.category?.name && <Text style={[storeMeta, { color: colors.icon }]}>{item.category.name}</Text>}
          {item.deliveryCategories?.alliance && (
            <View style={[badge, { backgroundColor: colors.tint + '20' }]}>
              <Text style={[badgeText, { color: colors.tint }]}>Alliance</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={[toggleBtn, { backgroundColor: item.deliveryCategories?.alliance ? colors.tint + '20' : colors.border + '80' }]} onPress={() => onToggleAlliance(item)} disabled={isProcessing}>
          {isProcessing ? <ActivityIndicator size="small" /> : <Ionicons name={item.deliveryCategories?.alliance ? 'checkmark' : 'add'} size={16} color={item.deliveryCategories?.alliance ? colors.tint : colors.icon} />}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[container, { backgroundColor: colors.background }]}>
      <View style={[searchRow, { borderColor: colors.border }]}>
        <TextInput style={[searchInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="Search alliance stores..." placeholderTextColor={colors.icon} value={search} onChangeText={onSearchChange} />
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : (
        <FlatList data={filtered} renderItem={renderItem} keyExtractor={(item) => item._id} contentContainerStyle={{ padding: 12, gap: 8 }} refreshing={loading} onRefresh={onRefresh}
          ListEmptyComponent={<Text style={[emptyText, { color: colors.icon }]}>No alliance stores</Text>} />
      )}
    </View>
  );
}

const container = StyleSheet.create({ flex: 1 } as any);
const searchRow = StyleSheet.create({ padding: 12 } as any);
const searchInput = StyleSheet.create({ borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 } as any);
const card = StyleSheet.create({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 } as any);
const cardLeft = StyleSheet.create({ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 } as any);
const storeName = StyleSheet.create({ fontSize: 14, fontWeight: '600' } as any);
const storeMeta = StyleSheet.create({ fontSize: 12 } as any);
const badge = StyleSheet.create({ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 } as any);
const badgeText = StyleSheet.create({ fontSize: 11, fontWeight: '600' } as any);
const toggleBtn = StyleSheet.create({ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' } as any);
const emptyText = StyleSheet.create({ textAlign: 'center', marginTop: 40, fontSize: 14 } as any);
