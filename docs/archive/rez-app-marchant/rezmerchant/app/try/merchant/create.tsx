import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { platformAlertSimple, platformAlert } from '@/utils/platformAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { trialsService, CreateTrialPayload, TrialImage } from '@/services/api/trials';
import { Colors } from '@/constants/Colors';

const CATEGORIES = ['Service', 'Sample Pickup', 'Experience', 'D2C Kit'];
const QR_WINDOW_TYPES = [
  { label: '30 min (Service)', value: '30min', minutes: 30 },
  { label: '2 hours (Pickup)', value: '2hours', minutes: 120 },
  { label: 'Fixed slot (Event)', value: 'Fixed', minutes: 1440 },
  { label: 'Auto (Delivery)', value: 'Auto', minutes: 86400 },
];
const COMMITMENT_FEES = [9, 19, 29];

type Step = 1 | 2 | 3;

interface FormData {
  title: string;
  category: string;
  originalPrice: number | '';
  trialCoinPrice: number;
  commitmentFee: number;
  dailySlots: number;
  qrWindowType: string;
  qrWindowMinutes: number;
  images: TrialImage[];
  terms: string;
  rewardCoins: number;
  brandedCoins: number;
  brandedCoinLabel: string;
  upsellLinks: Array<{ title: string; url: string }>;
  // Sample Pickup fields
  brandName?: string;
  productName?: string;
  totalStockUnits?: number;
  restockDate?: string;
}

export default function CreateTrialScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    title: '',
    category: CATEGORIES[0],
    originalPrice: '',
    trialCoinPrice: 30,
    commitmentFee: 9,
    dailySlots: 5,
    qrWindowType: '30min',
    qrWindowMinutes: 30,
    images: [],
    terms: '',
    rewardCoins: 50,
    brandedCoins: 0,
    brandedCoinLabel: '',
    upsellLinks: [{ title: '', url: '' }],
    brandName: '',
    productName: '',
    totalStockUnits: undefined,
    restockDate: '',
  });

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showWindowTypePicker, setShowWindowTypePicker] = useState(false);
  const [showCommitmentPicker, setShowCommitmentPicker] = useState(false);

  const updateForm = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateUpsell = (index: number, field: 'title' | 'url', value: string) => {
    const updated = [...form.upsellLinks];
    updated[index] = { ...updated[index], [field]: value };
    updateForm('upsellLinks', updated);
  };

  const addUpsell = () => {
    if (form.upsellLinks.length < 3) {
      updateForm('upsellLinks', [...form.upsellLinks, { title: '', url: '' }]);
    }
  };

  const removeUpsell = (index: number) => {
    updateForm('upsellLinks', form.upsellLinks.filter((_, i) => i !== index));
  };

  const handleWindowTypeChange = (type: string) => {
    const selected = QR_WINDOW_TYPES.find(t => t.value === type);
    if (selected) {
      updateForm('qrWindowType', selected.value);
      updateForm('qrWindowMinutes', selected.minutes);
    }
    setShowWindowTypePicker(false);
  };

  const validateStep = (stepNum: Step): boolean => {
    if (stepNum === 1) {
      if (!form.title.trim()) {
        platformAlertSimple('Validation Error', 'Please enter a trial title');
        return false;
      }
      if (!form.originalPrice || String(form.originalPrice) === '') {
        platformAlertSimple('Validation Error', 'Please enter the original price');
        return false;
      }
      if (form.images.length === 0) {
        platformAlertSimple('Validation Error', 'Please add at least one image');
        return false;
      }
      return true;
    }

    if (stepNum === 2) {
      if (!form.dailySlots || form.dailySlots < 1) {
        platformAlertSimple('Validation Error', 'Please set daily slots (minimum 1)');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 3) {
        setStep((step + 1) as Step);
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const payload: CreateTrialPayload = {
        title: form.title,
        category: form.category as any,
        originalPrice: Number(form.originalPrice),
        trialCoinPrice: form.trialCoinPrice,
        commitmentFee: form.commitmentFee,
        dailySlots: form.dailySlots,
        qrWindowType: form.qrWindowType as any,
        qrWindowMinutes: form.qrWindowMinutes,
        images: form.images,
        terms: form.terms,
        rewardCoins: form.rewardCoins,
        brandedCoins: form.brandedCoins,
        brandedCoinLabel: form.brandedCoinLabel,
        upsellLinks: form.upsellLinks.filter(l => l.title && l.url),
        // Include sample pickup fields if category is sample_pickup
        ...(form.category === 'Sample Pickup' && {
          brandName: form.brandName,
          productName: form.productName,
          totalStockUnits: form.totalStockUnits,
          restockDate: form.restockDate,
        }),
      };

      const response = await trialsService.createTrial(payload);
      if (response.success) {
        platformAlert('Success', 'Trial created and submitted for approval!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (err) {
      platformAlertSimple('Error', 'Failed to create trial. Please try again.');
      if (__DEV__) console.error('Failed to create trial:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Basic Information</Text>

      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.label}>Trial Title *</Text>
        <View style={styles.charCounter}>
          <Text style={styles.charCount}>{form.title.length}/60</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="e.g., Premium Haircut"
          value={form.title}
          onChangeText={v => updateForm('title', v.slice(0, 60))}
          placeholderTextColor={Colors.light.textMuted}
        />
      </View>

      {/* Category */}
      <View style={styles.field}>
        <Text style={styles.label}>Category *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCategoryPicker(true)}
        >
          <Text style={styles.pickerButtonText}>{form.category}</Text>
          <Ionicons name="chevron-down" size={20} color={Colors.light.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Original Price */}
      <View style={styles.field}>
        <Text style={styles.label}>Original Price (₹) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 500"
          value={String(form.originalPrice)}
          onChangeText={v => updateForm('originalPrice', v ? parseInt(v) : '')}
          keyboardType="number-pad"
          placeholderTextColor={Colors.light.textMuted}
        />
      </View>

      {/* Trial Coin Price */}
      <View style={styles.field}>
        <Text style={styles.label}>Trial Coin Price</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderValue}>{form.trialCoinPrice} Coins</Text>
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderFill,
                { width: `${((form.trialCoinPrice - 10) / (200 - 10)) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>10</Text>
            <Text style={styles.sliderLabel}>200</Text>
          </View>
        </View>
        <View style={styles.coinInputRow}>
          <TouchableOpacity
            onPress={() =>
              updateForm('trialCoinPrice', Math.max(10, form.trialCoinPrice - 10))
            }
          >
            <Ionicons name="remove-circle" size={28} color="#8B5CF6" />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.coinInput]}
            value={String(form.trialCoinPrice)}
            onChangeText={v => {
              const num = parseInt(v) || 10;
              updateForm('trialCoinPrice', Math.max(10, Math.min(200, num)));
            }}
            keyboardType="number-pad"
            textAlign="center"
          />
          <TouchableOpacity
            onPress={() =>
              updateForm('trialCoinPrice', Math.min(200, form.trialCoinPrice + 10))
            }
          >
            <Ionicons name="add-circle" size={28} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Commitment Fee */}
      <View style={styles.field}>
        <Text style={styles.label}>Commitment Fee *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCommitmentPicker(true)}
        >
          <Text style={styles.pickerButtonText}>₹{form.commitmentFee}</Text>
          <Ionicons name="chevron-down" size={20} color={Colors.light.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Images Placeholder */}
      <View style={styles.field}>
        <Text style={styles.label}>Images (up to 5) *</Text>
        <View style={styles.imageGrid}>
          {[...Array(Math.min(5, form.images.length + 1))].map((_, i) => (
            <View key={i} style={styles.imagePlaceholder}>
              <Ionicons
                name={i < form.images.length ? 'image' : 'add'}
                size={24}
                color={Colors.light.textMuted}
              />
            </View>
          ))}
        </View>
        <Text style={styles.helperText}>
          (Tap to select images — skipped for MVP)
        </Text>
      </View>

      {/* Terms */}
      <View style={styles.field}>
        <Text style={styles.label}>Terms & Conditions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g., Valid only once per customer..."
          value={form.terms}
          onChangeText={v => updateForm('terms', v)}
          placeholderTextColor={Colors.light.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Slots & Timing</Text>

      {/* Daily Slots */}
      <View style={styles.field}>
        <Text style={styles.label}>Daily Slots (1-50) *</Text>
        <View style={styles.numberInputRow}>
          <TouchableOpacity
            onPress={() => updateForm('dailySlots', Math.max(1, form.dailySlots - 1))}
          >
            <Ionicons name="remove-circle" size={28} color="#8B5CF6" />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.numberInput]}
            value={String(form.dailySlots)}
            onChangeText={v => {
              const num = parseInt(v) || 1;
              updateForm('dailySlots', Math.max(1, Math.min(50, num)));
            }}
            keyboardType="number-pad"
            textAlign="center"
          />
          <TouchableOpacity
            onPress={() => updateForm('dailySlots', Math.min(50, form.dailySlots + 1))}
          >
            <Ionicons name="add-circle" size={28} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* QR Window Type */}
      <View style={styles.field}>
        <Text style={styles.label}>QR Scanning Window *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowWindowTypePicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {QR_WINDOW_TYPES.find(t => t.value === form.qrWindowType)?.label}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.light.textMuted} />
        </TouchableOpacity>
        <Text style={styles.helperText}>
          Window: {form.qrWindowMinutes} minutes
        </Text>
      </View>

      {/* Sample Pickup Fields */}
      {form.category === 'Sample Pickup' && (
        <>
          <Text style={[styles.stepTitle, { marginTop: 20 }]}>Sample Details</Text>

          {/* Brand Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Brand Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Lakme, MAC, Neutrogena"
              value={form.brandName || ''}
              onChangeText={v => updateForm('brandName', v)}
              placeholderTextColor={Colors.light.textMuted}
            />
          </View>

          {/* Product Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Sunscreen SPF 50, Lipstick Red"
              value={form.productName || ''}
              onChangeText={v => updateForm('productName', v)}
              placeholderTextColor={Colors.light.textMuted}
            />
          </View>

          {/* Total Stock Units */}
          <View style={styles.field}>
            <Text style={styles.label}>Total Stock Units</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 100"
              value={form.totalStockUnits ? String(form.totalStockUnits) : ''}
              onChangeText={v => updateForm('totalStockUnits', v ? parseInt(v) : undefined)}
              keyboardType="number-pad"
              placeholderTextColor={Colors.light.textMuted}
            />
          </View>

          {/* Restock Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Restock Date (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={form.restockDate || ''}
              onChangeText={v => updateForm('restockDate', v)}
              placeholderTextColor={Colors.light.textMuted}
            />
            <Text style={styles.helperText}>
              When will you restock this sample
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Rewards & Upsell</Text>

      {/* Reward Coins */}
      <View style={styles.field}>
        <Text style={styles.label}>ReZ Coins to Award (0-500)</Text>
        <View style={styles.numberInputRow}>
          <TouchableOpacity
            onPress={() => updateForm('rewardCoins', Math.max(0, form.rewardCoins - 10))}
          >
            <Ionicons name="remove-circle" size={28} color="#8B5CF6" />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.numberInput]}
            value={String(form.rewardCoins)}
            onChangeText={v => {
              const num = parseInt(v) || 0;
              updateForm('rewardCoins', Math.max(0, Math.min(500, num)));
            }}
            keyboardType="number-pad"
            textAlign="center"
          />
          <TouchableOpacity
            onPress={() => updateForm('rewardCoins', Math.min(500, form.rewardCoins + 10))}
          >
            <Ionicons name="add-circle" size={28} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Branded Coins */}
      <View style={styles.field}>
        <Text style={styles.label}>Branded Coins to Award (0-200)</Text>
        <View style={styles.numberInputRow}>
          <TouchableOpacity
            onPress={() =>
              updateForm('brandedCoins', Math.max(0, form.brandedCoins - 10))
            }
          >
            <Ionicons name="remove-circle" size={28} color="#8B5CF6" />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.numberInput]}
            value={String(form.brandedCoins)}
            onChangeText={v => {
              const num = parseInt(v) || 0;
              updateForm('brandedCoins', Math.max(0, Math.min(200, num)));
            }}
            keyboardType="number-pad"
            textAlign="center"
          />
          <TouchableOpacity
            onPress={() =>
              updateForm('brandedCoins', Math.min(200, form.brandedCoins + 10))
            }
          >
            <Ionicons name="add-circle" size={28} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Branded Coin Label */}
      {form.brandedCoins > 0 && (
        <View style={styles.field}>
          <Text style={styles.label}>Branded Coin Label</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Shop Credits"
            value={form.brandedCoinLabel}
            onChangeText={v => updateForm('brandedCoinLabel', v)}
            placeholderTextColor={Colors.light.textMuted}
          />
        </View>
      )}

      {/* Upsell Links */}
      <View style={styles.field}>
        <Text style={styles.label}>Upsell Links (up to 3)</Text>
        {form.upsellLinks.map((link, i) => (
          <View key={i} style={styles.upsellItem}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Link title"
              value={link.title}
              onChangeText={v => updateUpsell(i, 'title', v)}
              placeholderTextColor={Colors.light.textMuted}
            />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
              placeholder="URL"
              value={link.url}
              onChangeText={v => updateUpsell(i, 'url', v)}
              placeholderTextColor={Colors.light.textMuted}
            />
            {form.upsellLinks.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeUpsell(i)}
              >
                <Ionicons name="close" size={20} color={Colors.light.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {form.upsellLinks.length < 3 && (
          <TouchableOpacity style={styles.addLink} onPress={addUpsell}>
            <Ionicons name="add" size={16} color="#8B5CF6" />
            <Text style={styles.addLinkText}>Add another link</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#A78BFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Trial</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map(s => (
          <View
            key={s}
            style={[
              styles.progressStep,
              { backgroundColor: s <= step ? '#8B5CF6' : Colors.light.border },
            ]}
          />
        ))}
        <Text style={styles.progressText}>
          Step {step} of 3
        </Text>
      </View>

      {/* Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => setStep((step - 1) as Step)}
            disabled={loading}
          >
            <Text style={styles.buttonSecondaryText}>← Back</Text>
          </TouchableOpacity>
        )}
        {step < 3 ? (
          <TouchableOpacity
            style={[styles.buttonPrimary, step === 1 && { marginLeft: 0 }]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.buttonPrimaryText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.buttonPrimary, { backgroundColor: '#10B981' }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Submit for Approval</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalContent}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={styles.pickerOption}
                onPress={() => {
                  updateForm('category', cat);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{cat}</Text>
                {form.category === cat && (
                  <Ionicons name="checkmark" size={20} color="#8B5CF6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Window Type Picker Modal */}
      <Modal visible={showWindowTypePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowWindowTypePicker(false)}
        >
          <View style={styles.modalContent}>
            {QR_WINDOW_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                style={styles.pickerOption}
                onPress={() => handleWindowTypeChange(type.value)}
              >
                <Text style={styles.pickerOptionText}>{type.label}</Text>
                {form.qrWindowType === type.value && (
                  <Ionicons name="checkmark" size={20} color="#8B5CF6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Commitment Fee Picker Modal */}
      <Modal visible={showCommitmentPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowCommitmentPicker(false)}
        >
          <View style={styles.modalContent}>
            {COMMITMENT_FEES.map(fee => (
              <TouchableOpacity
                key={fee}
                style={styles.pickerOption}
                onPress={() => {
                  updateForm('commitmentFee', fee);
                  setShowCommitmentPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>₹{fee}</Text>
                {form.commitmentFee === fee && (
                  <Ionicons name="checkmark" size={20} color="#8B5CF6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  progressStep: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  progressText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 8,
  },
  charCounter: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  charCount: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.textHeading,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonText: {
    fontSize: 14,
    color: Colors.light.textHeading,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 6,
  },
  sliderContainer: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 16,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 12,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  coinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  coinInput: {
    flex: 1,
    textAlign: 'center',
  },
  numberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numberInput: {
    flex: 1,
    textAlign: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  imagePlaceholder: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upsellItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  removeButton: {
    padding: 8,
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
  },
  addLinkText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  buttonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#8B5CF6',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonPrimary: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  pickerOptionText: {
    fontSize: 14,
    color: Colors.light.textHeading,
  },
});
