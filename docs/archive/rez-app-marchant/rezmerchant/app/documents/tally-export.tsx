import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api';
import { storageService } from '@/services/storage';
import { useStore } from '@/contexts/StoreContext';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function TallyExportScreen() {
  const { activeStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [fromMonth, setFromMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [toMonth, setToMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const months = Array.from({ length: 24 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const storeId = activeStore?._id || '';

  const downloadTallyXML = async () => {
    if (!storeId) {
      platformAlertSimple('Error', 'No store selected. Please select a store first.');
      return;
    }

    try {
      setLoading(true);
      // FIX: actual backend route is /merchant/documents/tally (no /export/ prefix)
      const response = await apiClient.get(
        `merchant/documents/tally?storeId=${storeId}&fromMonth=${fromMonth}&toMonth=${toMonth}`,
        { responseType: 'blob' }
      );

      const fileUri = `${FileSystem.documentDirectory}Tally_${fromMonth}_${toMonth}.xml`;
      const base64Data = response.data instanceof Blob
        ? await response.data.text()
        : typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);

      await FileSystem.writeAsStringAsync(fileUri, base64Data);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/xml',
          dialogTitle: `Tally XML Export (${fromMonth} to ${toMonth})`,
        });
      } else {
        platformAlertSimple('Saved', `File saved to: ${fileUri}`);
      }
    } catch (error: any) {
      platformAlertSimple('Error', error.message || 'Failed to download Tally XML');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (!storeId) {
      platformAlertSimple('Error', 'No store selected. Please select a store first.');
      return;
    }

    try {
      setLoading(true);
      // FIX: actual backend route is /merchant/documents/csv (no /export/ prefix)
      const response = await apiClient.get(
        `merchant/documents/csv?storeId=${storeId}&fromMonth=${fromMonth}&toMonth=${toMonth}`,
        { responseType: 'blob' }
      );

      const fileUri = `${FileSystem.documentDirectory}Transactions_${fromMonth}_${toMonth}.csv`;
      const csvContent = response.data instanceof Blob
        ? await response.data.text()
        : typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Transaction CSV (${fromMonth} to ${toMonth})`,
        });
      } else {
        platformAlertSimple('Saved', `File saved to: ${fileUri}`);
      }
    } catch (error: any) {
      platformAlertSimple('Error', error.message || 'Failed to download CSV');
    } finally {
      setLoading(false);
    }
  };

  const fromYear = fromMonth.split('-')[0];
  const fromMon = fromMonth.split('-')[1];
  const fromMonthName = new Date(parseInt(fromYear), parseInt(fromMon) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });

  const toYear = toMonth.split('-')[0];
  const toMon = toMonth.split('-')[1];
  const toMonthName = new Date(parseInt(toYear), parseInt(toMon) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Export for Accountant</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Select Date Range</Text>

        <View style={styles.dateSection}>
          <View style={styles.dateColumn}>
            <Text style={styles.dateLabel}>From Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
              {months.map(m => {
                const [y, mo] = m.split('-');
                const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
                return (
                  <TouchableOpacity
                    key={`from-${m}`}
                    style={[styles.monthChip, fromMonth === m && styles.monthChipActive]}
                    onPress={() => setFromMonth(m)}
                  >
                    <Text style={[styles.monthChipText, fromMonth === m && styles.monthChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.dateColumn}>
            <Text style={styles.dateLabel}>To Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
              {months.map(m => {
                const [y, mo] = m.split('-');
                const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
                return (
                  <TouchableOpacity
                    key={`to-${m}`}
                    style={[styles.monthChip, toMonth === m && styles.monthChipActive]}
                    onPress={() => setToMonth(m)}
                  >
                    <Text style={[styles.monthChipText, toMonth === m && styles.monthChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <View style={styles.rangeInfo}>
          <Ionicons name="calendar-outline" size={16} color="#4f46e5" />
          <Text style={styles.rangeText}>
            {fromMonthName} to {toMonthName}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.exportTitle}>Export Formats</Text>

        <TouchableOpacity
          style={[styles.exportButton, styles.tallyButton]}
          onPress={downloadTallyXML}
          disabled={loading}
        >
          <View style={styles.exportIcon}>
            <Ionicons name="document-outline" size={24} color="#059669" />
          </View>
          <View style={styles.exportInfo}>
            <Text style={styles.exportLabel}>Tally XML</Text>
            <Text style={styles.exportDesc}>For Tally ERP 9 & Tally Prime</Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#059669" size="small" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#059669" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportButton, styles.csvButton]}
          onPress={downloadCSV}
          disabled={loading}
        >
          <View style={styles.exportIcon}>
            <Ionicons name="document-text-outline" size={24} color="#1d4ed8" />
          </View>
          <View style={styles.exportInfo}>
            <Text style={styles.exportLabel}>CSV File</Text>
            <Text style={styles.exportDesc}>For Zoho Books, Excel & Quickbooks</Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#1d4ed8" size="small" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#1d4ed8" />
          )}
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#4f46e5" />
          <Text style={styles.infoText}>
            Export transaction data for your accountant. The Tally XML format is compatible with Tally ERP 9 & Tally Prime. CSV format works with most accounting software.
          </Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What's Included</Text>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.featureText}>All transactions in date range</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.featureText}>Payment methods & amounts</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.featureText}>Product-wise breakdown</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.featureText}>Tax calculations</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  dateSection: { gap: 16, marginBottom: 16 },
  dateColumn: { gap: 8 },
  dateLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  monthScroll: { marginBottom: 0 },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  monthChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  monthChipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  monthChipTextActive: { color: '#fff' },
  rangeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginBottom: 16,
  },
  rangeText: { fontSize: 13, color: '#1d4ed8', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 20 },
  exportTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tallyButton: { borderColor: '#d1fae5' },
  csvButton: { borderColor: '#dbeafe' },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#f0fdf4',
  },
  tallyIcon: { backgroundColor: '#d1fae5' },
  csvIcon: { backgroundColor: '#dbeafe' },
  exportInfo: { flex: 1 },
  exportLabel: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 2 },
  exportDesc: { fontSize: 12, color: '#6b7280' },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1d4ed8', lineHeight: 18 },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featuresTitle: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 12 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  featureText: { fontSize: 13, color: '#374151', flex: 1 },
});
