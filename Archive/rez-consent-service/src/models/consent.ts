import mongoose, { Schema, Document } from 'mongoose';

// DPDP Consent Types
export type ConsentType =
  | 'location_tracking'
  | 'analytics'
  | 'marketing'
  | 'ai_profiling'
  | 'third_party_sharing'
  | 'data_processing';

export type ConsentStatus = 'granted' | 'denied' | 'withdrawn';

// Consent Record - per DPDP Article 6
export interface IConsentRecord extends Document {
  userId: string;
  consentType: ConsentType;
  status: ConsentStatus;
  grantedAt?: Date;
  deniedAt?: Date;
  withdrawnAt?: Date;
  version: string; // Consent version for tracking changes
  source: 'onboarding' | 'settings' | 'api' | 'marketing';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  purpose: string; // Why we need this consent
  createdAt: Date;
  updatedAt: Date;
}

// User Consent Profile - summary of all user consents
export interface IUserConsentProfile extends Document {
  userId: string;
  hasActiveConsent: boolean;
  consentVersion: string;
  consents: Map<ConsentType, ConsentStatus>;
  lastConsentUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Consent Log - audit trail
export interface IConsentLog extends Document {
  userId: string;
  consentType: ConsentType;
  action: 'granted' | 'denied' | 'withdrawn' | 'updated';
  previousStatus?: ConsentStatus;
  newStatus: ConsentStatus;
  version: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ConsentRecordSchema = new Schema<IConsentRecord>({
  userId: { type: String, required: true, index: true },
  consentType: {
    type: String,
    required: true,
    enum: ['location_tracking', 'analytics', 'marketing', 'ai_profiling', 'third_party_sharing', 'data_processing']
  },
  status: {
    type: String,
    required: true,
    enum: ['granted', 'denied', 'withdrawn']
  },
  grantedAt: { type: Date },
  deniedAt: { type: Date },
  withdrawnAt: { type: Date },
  version: { type: String, required: true, default: '1.0' },
  source: {
    type: String,
    enum: ['onboarding', 'settings', 'api', 'marketing'],
    default: 'settings'
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  metadata: { type: Schema.Types.Mixed },
  purpose: { type: String, required: true }
}, { timestamps: true });

// Compound index for efficient queries
ConsentRecordSchema.index({ userId: 1, consentType: 1 }, { unique: true });
ConsentRecordSchema.index({ userId: 1, status: 1 });

const UserConsentProfileSchema = new Schema<IUserConsentProfile>({
  userId: { type: String, required: true, unique: true, index: true },
  hasActiveConsent: { type: Boolean, default: false },
  consentVersion: { type: String, required: true, default: '1.0' },
  consents: { type: Map, of: String, default: new Map() },
  lastConsentUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

const ConsentLogSchema = new Schema<IConsentLog>({
  userId: { type: String, required: true, index: true },
  consentType: { type: String, required: true },
  action: { type: String, required: true },
  previousStatus: { type: String },
  newStatus: { type: String, required: true },
  version: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

ConsentLogSchema.index({ userId: 1, createdAt: -1 });

export const ConsentRecord = mongoose.model<IConsentRecord>('ConsentRecord', ConsentRecordSchema);
export const UserConsentProfile = mongoose.model<IUserConsentProfile>('UserConsentProfile', UserConsentProfileSchema);
export const ConsentLog = mongoose.model<IConsentLog>('ConsentLog', ConsentLogSchema);

// Consent purposes (required under DPDP)
export const CONSENT_PURPOSES: Record<ConsentType, string> = {
  location_tracking: 'To show nearby deals and personalized offers based on your location',
  analytics: 'To improve our services and understand usage patterns',
  marketing: 'To send you promotional messages about offers and campaigns',
  ai_profiling: 'To personalize your experience with AI-powered recommendations',
  third_party_sharing: 'To share data with our partner businesses for better offers',
  data_processing: 'To process your orders, payments, and transactions'
};

// Current consent version
export const CURRENT_CONSENT_VERSION = '2.0';
