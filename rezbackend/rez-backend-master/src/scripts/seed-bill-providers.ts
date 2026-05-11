/**
 * Seed 20 Bill Providers
 * Run: npx ts-node src/scripts/seed-bill-providers.ts
 *
 * Uses upsert so it's safe to run multiple times.
 * Add MONGODB_URI to your .env before running.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { BillProvider, IRequiredField } from '../models/BillProvider';
import { connectDatabase } from '../config/database';
import { logger } from '../config/logger';

dotenv.config();

// ─── Required Fields by Bill Type ────────────────────────────────────────

const getRequiredFieldsForType = (type: string): IRequiredField[] => {
  const fieldsMap: Record<string, IRequiredField[]> = {
    mobile_prepaid: [
      { fieldName: 'mobileNumber', label: 'Mobile Number', placeholder: 'Enter 10-digit mobile number', type: 'text' },
    ],
    mobile_postpaid: [
      { fieldName: 'mobileNumber', label: 'Mobile Number', placeholder: 'Enter 10-digit mobile number', type: 'text' },
    ],
    electricity: [
      {
        fieldName: 'consumerNumber',
        label: 'Consumer Number',
        placeholder: 'Enter your consumer number',
        type: 'text',
      },
    ],
    gas: [
      {
        fieldName: 'consumerNumber',
        label: 'Consumer Number',
        placeholder: 'Enter your LPG consumer number',
        type: 'text',
      },
    ],
    broadband: [
      { fieldName: 'subscriberId', label: 'Subscriber ID', placeholder: 'Enter your subscriber ID', type: 'text' },
    ],
    dth: [{ fieldName: 'subscriberId', label: 'Subscriber ID', placeholder: 'Enter your subscriber ID', type: 'text' }],
    fastag: [{ fieldName: 'tagId', label: 'FASTag ID', placeholder: 'Enter your FASTag ID', type: 'text' }],
    insurance: [
      { fieldName: 'policyNumber', label: 'Policy Number', placeholder: 'Enter your policy number', type: 'text' },
    ],
    education_fee: [
      { fieldName: 'studentId', label: 'Student ID', placeholder: 'Enter your student ID', type: 'text' },
    ],
    water: [
      {
        fieldName: 'consumerNumber',
        label: 'Consumer Number',
        placeholder: 'Enter your consumer number',
        type: 'text',
      },
    ],
  };
  return (
    fieldsMap[type] || [
      {
        fieldName: 'consumerNumber',
        label: 'Consumer Number',
        placeholder: 'Enter your consumer number',
        type: 'text',
      },
    ]
  );
};

// ─── Bill Providers Data (20 providers) ──────────────────────────────────

const providers = [
  // Mobile Prepaid
  {
    name: 'Jio',
    code: 'JIO',
    type: 'mobile_prepaid',
    aggregatorCode: 'JIO',
    promoCoinsFixed: 15,
    promoExpiryDays: 7,
    maxRedemptionPercent: 15,
    cashbackPercent: 2,
    displayOrder: 1,
    isFeatured: true,
  },
  {
    name: 'Airtel',
    code: 'AIRTEL',
    type: 'mobile_prepaid',
    aggregatorCode: 'AIRTEL',
    promoCoinsFixed: 25,
    promoExpiryDays: 7,
    maxRedemptionPercent: 15,
    cashbackPercent: 2,
    displayOrder: 2,
    isFeatured: true,
  },
  {
    name: 'BSNL',
    code: 'BSNL',
    type: 'mobile_prepaid',
    aggregatorCode: 'BSNL',
    promoCoinsFixed: 10,
    promoExpiryDays: 7,
    maxRedemptionPercent: 10,
    cashbackPercent: 1.5,
    displayOrder: 3,
    isFeatured: false,
  },
  {
    name: 'Vi (Vodafone Idea)',
    code: 'VI',
    type: 'mobile_prepaid',
    aggregatorCode: 'VI',
    promoCoinsFixed: 20,
    promoExpiryDays: 7,
    maxRedemptionPercent: 15,
    cashbackPercent: 2,
    displayOrder: 4,
    isFeatured: true,
  },
  // Mobile Postpaid
  {
    name: 'Airtel Postpaid',
    code: 'AIRTEL_POST',
    type: 'mobile_postpaid',
    aggregatorCode: 'AIRTEL',
    promoCoinsFixed: 30,
    promoExpiryDays: 14,
    maxRedemptionPercent: 20,
    cashbackPercent: 2.5,
    displayOrder: 5,
    isFeatured: true,
  },
  {
    name: 'Jio Postpaid',
    code: 'JIO_POST',
    type: 'mobile_postpaid',
    aggregatorCode: 'JIO',
    promoCoinsFixed: 25,
    promoExpiryDays: 14,
    maxRedemptionPercent: 20,
    cashbackPercent: 2,
    displayOrder: 6,
    isFeatured: false,
  },
  // Electricity
  {
    name: 'BESCOM',
    code: 'BESCOM',
    type: 'electricity',
    aggregatorCode: 'BESCOM',
    promoCoinsFixed: 25,
    promoExpiryDays: 14,
    maxRedemptionPercent: 20,
    cashbackPercent: 1.5,
    displayOrder: 7,
    isFeatured: true,
  },
  {
    name: 'TSSPDCL',
    code: 'TSSPDCL',
    type: 'electricity',
    aggregatorCode: 'TSSPDCL',
    promoCoinsFixed: 20,
    promoExpiryDays: 14,
    maxRedemptionPercent: 20,
    cashbackPercent: 1.5,
    displayOrder: 8,
    isFeatured: false,
  },
  {
    name: 'MSEDCL',
    code: 'MSEDCL',
    type: 'electricity',
    aggregatorCode: 'MSEDCL',
    promoCoinsFixed: 20,
    promoExpiryDays: 14,
    maxRedemptionPercent: 20,
    cashbackPercent: 1.5,
    displayOrder: 9,
    isFeatured: false,
  },
  // Gas
  {
    name: 'Indane Gas',
    code: 'INDANE',
    type: 'gas',
    aggregatorCode: 'INDANE_GAS',
    promoCoinsFixed: 15,
    promoExpiryDays: 14,
    maxRedemptionPercent: 15,
    cashbackPercent: 1,
    displayOrder: 10,
    isFeatured: true,
  },
  {
    name: 'HP Gas',
    code: 'HPGAS',
    type: 'gas',
    aggregatorCode: 'HP_GAS',
    promoCoinsFixed: 15,
    promoExpiryDays: 14,
    maxRedemptionPercent: 15,
    cashbackPercent: 1,
    displayOrder: 11,
    isFeatured: false,
  },
  // Broadband
  {
    name: 'ACT Broadband',
    code: 'ACT',
    type: 'broadband',
    aggregatorCode: 'ACT_FIBERNET',
    promoCoinsFixed: 40,
    promoExpiryDays: 14,
    maxRedemptionPercent: 20,
    cashbackPercent: 2.5,
    displayOrder: 12,
    isFeatured: true,
  },
  {
    name: 'Hathway',
    code: 'HATHWAY',
    type: 'broadband',
    aggregatorCode: 'HATHWAY',
    promoCoinsFixed: 30,
    promoExpiryDays: 14,
    maxRedemptionPercent: 20,
    cashbackPercent: 2,
    displayOrder: 13,
    isFeatured: false,
  },
  // DTH
  {
    name: 'Tata Sky',
    code: 'TATA_SKY',
    type: 'dth',
    aggregatorCode: 'TATA_PLAY',
    promoCoinsFixed: 20,
    promoExpiryDays: 10,
    maxRedemptionPercent: 15,
    cashbackPercent: 1.5,
    displayOrder: 14,
    isFeatured: true,
  },
  {
    name: 'Dish TV',
    code: 'DISH_TV',
    type: 'dth',
    aggregatorCode: 'DISH_TV',
    promoCoinsFixed: 20,
    promoExpiryDays: 10,
    maxRedemptionPercent: 15,
    cashbackPercent: 1.5,
    displayOrder: 15,
    isFeatured: false,
  },
  // FASTag
  {
    name: 'HDFC FASTag',
    code: 'HDFC_FASTAG',
    type: 'fastag',
    aggregatorCode: 'HDFC_FASTAG',
    promoCoinsFixed: 20,
    promoExpiryDays: 10,
    maxRedemptionPercent: 15,
    cashbackPercent: 1.5,
    displayOrder: 16,
    isFeatured: true,
  },
  {
    name: 'ICICI FASTag',
    code: 'ICICI_FASTAG',
    type: 'fastag',
    aggregatorCode: 'ICICI_FASTAG',
    promoCoinsFixed: 20,
    promoExpiryDays: 10,
    maxRedemptionPercent: 15,
    cashbackPercent: 1.5,
    displayOrder: 17,
    isFeatured: false,
  },
  // Insurance
  {
    name: 'LIC Premium',
    code: 'LIC',
    type: 'insurance',
    aggregatorCode: 'LIC',
    promoCoinsFixed: 50,
    promoExpiryDays: 30,
    maxRedemptionPercent: 10,
    cashbackPercent: 1,
    displayOrder: 18,
    isFeatured: true,
  },
  // Education
  {
    name: 'Delhi University',
    code: 'DU',
    type: 'education_fee',
    aggregatorCode: 'DU_FEE',
    promoCoinsFixed: 60,
    promoExpiryDays: 30,
    maxRedemptionPercent: 10,
    cashbackPercent: 0.5,
    displayOrder: 19,
    isFeatured: false,
  },
  // Water
  {
    name: 'Delhi Jal Board',
    code: 'DJB',
    type: 'water',
    aggregatorCode: 'DJB_WATER',
    promoCoinsFixed: 15,
    promoExpiryDays: 14,
    maxRedemptionPercent: 15,
    cashbackPercent: 1,
    displayOrder: 20,
    isFeatured: false,
  },
];

async function seed(): Promise<void> {
  logger.info('🚀 Starting seed-bill-providers script...');
  await connectDatabase();

  let seeded = 0;
  for (const p of providers) {
    const requiredFields = getRequiredFieldsForType(p.type as string);

    await BillProvider.findOneAndUpdate(
      { code: p.code },
      {
        $set: {
          ...p,
          requiredFields,
          aggregatorName: 'razorpay',
          isActive: true,
          minAmount: 10,
          maxAmount: 100000,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    logger.info(`✅ ${p.name} (${p.type}) — ${p.promoCoinsFixed} coins, ${p.promoExpiryDays}d expiry`);
    seeded++;
  }

  logger.info(`\n✨ Successfully seeded ${seeded} bill providers`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error('Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
