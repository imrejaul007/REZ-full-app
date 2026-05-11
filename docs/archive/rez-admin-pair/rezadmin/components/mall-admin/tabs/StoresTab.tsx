/**
 * components/mall-admin/tabs/StoresTab.tsx
 * ADM-005: Mall managed stores tab.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ManagedMallStore } from '../../../services/api/mall';
import { Colors } from '../../../constants/Colors';

type ColorsType = typeof Colors.light;

interface Props {
  colors: ColorsType;
  managedStores: ManagedMallStore[];
  managedStoresSearch: string;
  managedStoresFilter: 'all' | 'mall' | 'non-mall';
  managedStoresLoading: boolean;
  processingManagedStore: string | null;
  onSearchChange: (v: string) => void;
  onFilterChange: (v: 'all' | 'mall' | 'non-mall') => void;
  onRefresh: () => void;
  onToggleMall: (store: ManagedMallStore) => void;
  onToggleFeatured: (store: ManagedMallStore) => void;
  onTogglePremium: (store: ManagedMallStore) => void;
}

export function StoresTab({ colors, managedStores, managedStoresSearch, managedStoresFilter, managedStoresLoading, processingManagedStore, onSearchChange, onFilterChange, onRefresh, onToggleMall, onToggleFeatured, onTogglePremium }: Props) {
  const filtered = managedStores.filter((s) => {
    if (managedStoresFilter === 'mall') return s.deliveryCategories?.mall;
    if (managedStoresFilter === 'non-mall') return !s.deliveryCategories?.mall;
    return true;
  }).filter((s) => s.name.toLowerCase().includes(managedStoresSearch.toLowerCase()));

  const renderItem = ({ item }: { item: ManagedMallStore }) => {
    const isProcessing = processingManagedStore === item._id;
    return (
      <View style={[row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={rowLeft}>
          <Text style={[rowName, { color: colors.text }]}>{item.name}</Text>
          {item.deliveryCategories?.mall && (
            <View style={[badge, { backgroundColor: colors.tint + '20' }]}>
              <Text style={[badgeText, { color: colors.tint }]}>Mall</Text>
            </View>
          )}
          {item.isFeatured && (
            <View style={[badge, { backgroundColor: '#f59e0b20' }]}>
              <Text style={[badgeText, { color: '#f59e0b' }]}>Featured</Text>
            </View>
          )}
        </View>
        <View style={rowActions}>
          <TouchableOpacity style={[actionBtn, { backgroundColor: item.deliveryCategories?.mall ? colors.tint + '20' : colors.border + '80' }]} onPress={() => onToggleMall(item)} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator size="small" /> : <Ionicons name={item.deliveryCategories?.mall ? 'close' : 'add'} size={16} color={item.deliveryCategories?.mall ? colors.tint : colors.icon} />}
          </TouchableOpacity>
          {item.deliveryCategories?.mall && (
            <>
              <TouchableOpacity style={[actionBtn, { backgroundColor: item.isFeatured ? colors.tint + '20' : colors.border + '80' }]} onPress={() => onToggleFeatured(item)} disabled={isProcessing}>
                <Ionicons name="star" size={16} color={item.isFeatured ? colors.tint : colors.icon} />
              </TouchableOpacity>
              <TouchableOpacity style={[actionBtn, { backgroundColor: item.deliveryCategories?.premium ? '#f59e0b20' : colors.border + '80' }]} onPress={() => onTogglePremium(item)} disabled={isProcessing}>
                <Ionicons name="diamond" size={16} color={item.deliveryCategories?.premium ? '#f59e0b' : colors.icon} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[container, { backgroundColor: colors.background }]}>
      <View style={[searchRow, { borderColor: colors.border }]}>
        <TextInput style={[searchInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} placeholder="Search stores..." placeholderTextColor={colors.icon} value={managedStoresSearch} onChangeText={onSearchChange} />
        <View style={filterRow}>
          {(['all', 'mall', 'non-mall'] as const).map((f) => (
            <TouchableOpacity key={f} style={[filterBtn, managedStoresFilter === f && { backgroundColor: colors.tint }]} onPress={() => onFilterChange(f)}>
              <Text style={[filterText, { color: managedStoresFilter === f ? colors.card : colors.icon }]}>{f === 'all' ? 'All' : f === 'mall' ? 'In Mall' : 'Not in Mall'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {managedStoresLoading ? <ActivityIndicator style={{ marginTop: 40 }} /> : (
        <FlatList data={filtered} renderItem={renderItem} keyExtractor={(item) => item._id} contentContainerStyle={{ padding: 12, gap: 8 }} refreshing={managedStoresLoading} onRefresh={onRefresh} />
      )}
    </View>
  );
}

const container = StyleSheet.create({ flex: 1 } as any);
const searchRow = StyleSheet.create({ padding: 12, gap: 8, borderBottomWidth: 1 } as any);
const searchInput = StyleSheet.create({ borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14 } as any);
const filterRow = StyleSheet.create({ flexDirection: 'row', gap: 8 } as any);
const filterBtn = StyleSheet.create({ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 } as any);
const filterText = StyleSheet.create({ fontSize: 12, fontWeight: '600' } as any);
const row = StyleSheet.create({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 } as any);
const rowLeft = StyleSheet.create({ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 } as any);
const rowName = StyleSheet.create({ fontSize: 14, fontWeight: '600', flex: 1 } as any);
const rowActions = StyleSheet.create({ flexDirection: 'row', gap: 6 } as any);
const actionBtn = StyleSheet.create({ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' } as any);
const badge = StyleSheet.create({ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 } as any);
const badgeText = StyleSheet.create({ fontSize: 11, fontWeight: '600' } as any);
