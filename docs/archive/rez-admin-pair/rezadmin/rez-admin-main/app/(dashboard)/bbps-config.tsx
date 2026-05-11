import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
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

interface BBPSConfig {
  enabledTypes: string[];
  defaultCoins: Record<string, number>;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  maxCoinsPerUserPerMonth: number;
  maxPaymentsPerDayPerUser: number;
}

const DEFAULT_CONFIG: BBPSConfig = {
  enabledTypes: [
    'electricity',
    'mobile_prepaid',
    'mobile_postpaid',
    'dth',
    'gas',
    'broadband',
    'fastag',
  ],
  defaultCoins: {
    electricity: 25,
    mobile_prepaid: 15,
    mobile_postpaid: 30,
    dth: 20,
    gas: 15,
    broadband: 40,
    fastag: 20,
  },
  reminderEnabled: true,
  reminderDaysBefore: 3,
  maxCoinsPerUserPerMonth: 500,
  maxPaymentsPerDayPerUser: 10,
};

const BILL_TYPES = [
  'electricity',
  'mobile_prepaid',
  'mobile_postpaid',
  'dth',
  'gas',
  'broadband',
  'fastag',
];

const BILL_TYPE_LABELS: Record<string, string> = {
  electricity: '⚡ Electricity',
  mobile_prepaid: '📱 Mobile Prepaid',
  mobile_postpaid: '📱 Mobile Postpaid',
  dth: '📺 DTH',
  gas: '🔥 Gas',
  broadband: '🌐 Broadband',
  fastag: '🚗 FASTag',
};

export default function BBPSConfigScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [config, setConfig] = useState<BBPSConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const config = await bbpsService.getConfig();
      setConfig(config as any);
    } catch (err: any) {
      showAlert('Error', 'Failed to load config');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await bbpsService.updateConfig(config);
      showAlert('Success', 'Configuration saved successfully');
      setDirty(false);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const toggleBillType = (type: string) => {
    setConfig((prev) => ({
      ...prev,
      enabledTypes: prev.enabledTypes.includes(type)
        ? prev.enabledTypes.filter((t) => t !== type)
        : [...prev.enabledTypes, type],
    }));
    setDirty(true);
  };

  const updateDefaultCoins = (type: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      defaultCoins: {
        ...prev.defaultCoins,
        [type]: parseInt(value) || 0,
      },
    }));
    setDirty(true);
  };

  const updateField = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>BBPS Config</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!dirty || saving}
          style={[
            styles.saveButton,
            {
              backgroundColor: dirty ? colors.tint : colors.border,
              opacity: dirty ? 1 : 0.5,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        {/* Section 1: Bill Type Toggles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bill Types</Text>
          <Text style={[styles.sectionDescription, { color: colors.icon }]}>
            Enable/disable bill type support
          </Text>

          {BILL_TYPES.map((type) => (
            <View
              key={type}
              style={[
                styles.billTypeRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.billTypeLabel, { color: colors.text }]}>
                {BILL_TYPE_LABELS[type]}
              </Text>
              <Switch
                value={config.enabledTypes.includes(type)}
                onValueChange={() => toggleBillType(type)}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={config.enabledTypes.includes(type) ? colors.success : colors.icon}
              />
            </View>
          ))}
        </View>

        {/* Section 2: Default Coin Amounts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Default Coin Amounts</Text>
          <Text style={[styles.sectionDescription, { color: colors.icon }]}>
            Override per-provider defaults
          </Text>

          {BILL_TYPES.map((type) => (
            <View
              key={`coins-${type}`}
              style={[
                styles.coinInputRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.coinLabel, { color: colors.text }]}>
                {BILL_TYPE_LABELS[type]}
              </Text>
              <View style={styles.coinInputGroup}>
                <TextInput
                  style={[
                    styles.coinInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.icon}
                  value={config.defaultCoins[type]?.toString() || '0'}
                  onChangeText={(v) => updateDefaultCoins(type, v)}
                />
                <Text style={[styles.coinUnit, { color: colors.icon }]}>coins</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section 3: Reminder Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reminder Notifications</Text>
          <Text style={[styles.sectionDescription, { color: colors.icon }]}>
            Configure bill due reminders
          </Text>

          <View
            style={[
              styles.settingRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Send Bill Due Reminders
            </Text>
            <Switch
              value={config.reminderEnabled}
              onValueChange={(v) => updateField('reminderEnabled', v)}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={config.reminderEnabled ? colors.success : colors.icon}
            />
          </View>

          {config.reminderEnabled && (
            <View
              style={[
                styles.reminderOption,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.reminderLabel, { color: colors.text }]}>
                Days Before Due Date
              </Text>
              <View style={styles.reminderOptions}>
                {[1, 3, 7].map((days) => (
                  <TouchableOpacity
                    key={days}
                    onPress={() => updateField('reminderDaysBefore', days)}
                    style={[
                      styles.reminderOption2,
                      {
                        backgroundColor:
                          config.reminderDaysBefore === days ? colors.tint : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reminderOptionText,
                        {
                          color: config.reminderDaysBefore === days ? '#fff' : colors.text,
                        },
                      ]}
                    >
                      {days} day{days > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Section 4: Fraud Prevention */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fraud Prevention</Text>
          <Text style={[styles.sectionDescription, { color: colors.icon }]}>
            Set limits to prevent abuse
          </Text>

          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Max Coins Per User/Month
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              keyboardType="number-pad"
              placeholder="500"
              placeholderTextColor={colors.icon}
              value={config.maxCoinsPerUserPerMonth.toString()}
              onChangeText={(v) => updateField('maxCoinsPerUserPerMonth', parseInt(v) || 0)}
            />
          </View>

          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Max Payments Per Day/User
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={colors.icon}
              value={config.maxPaymentsPerDayPerUser.toString()}
              onChangeText={(v) => updateField('maxPaymentsPerDayPerUser', parseInt(v) || 0)}
            />
          </View>
        </View>

        {/* Save Notice */}
        {dirty && (
          <View
            style={[
              styles.notice,
              { backgroundColor: colors.warning + '20', borderColor: colors.warning },
            ]}
          >
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.warningDark }]}>
              You have unsaved changes. Press Save to apply.
            </Text>
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  billTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  billTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  coinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  coinLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  coinInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinInput: {
    width: 70,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  coinUnit: {
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  reminderOption: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  reminderLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  reminderOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderOption2: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  reminderOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    gap: 10,
  },
  noticeText: {
    fontSize: 13,
    flex: 1,
  },
});
