import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

// User profile interface
export interface IUserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  locationHistory?: Array<{
    coordinates: [number, number];
    address: string;
    city?: string;
    timestamp: Date;
    source: 'manual' | 'gps' | 'ip';
  }>;
  timezone?: string;
  ringSize?: string;
  jewelryPreferences?: {
    preferredMetals?: string[];
    preferredStones?: string[];
    style?: 'traditional' | 'modern' | 'vintage' | 'contemporary';
  };
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  verificationDocuments?: {
    documentType: string;
    documentNumber: string;
    documentImage: string;
    submittedAt: Date;
  };
}

// User preferences interface
export interface IUserPreferences {
  language?: string;
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP';
  notifications?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
  categories?: Types.ObjectId[];
  theme?: 'light' | 'dark';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
}

// DM-L4: IUserWallet removed — User.wallet sub-doc dropped from schema.
// Wallet data lives in the Wallet collection (GET /wallet/balance).
// Compatibility shim: exported so that models/index.ts re-export and any
// controller that still types user.wallet compile without changes.
// Controllers should migrate to the Wallet collection API over time.
/** @deprecated Use the Wallet collection (rez-wallet-service) instead. */
export interface IUserWallet {
  balance: number;
  isFrozen?: boolean;
}

// User auth interface
export interface IUserAuth {
  isVerified: boolean;
  isOnboarded: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  otpCode?: string;
  otpExpiry?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  totpSecret?: string;
  totpEnabled?: boolean;
  pinHash?: string;
  pinSetAt?: Date;
  pinAttempts?: number;
  pinLockedUntil?: Date;
}

// User referral interface
export interface IUserReferral {
  referralCode: string; // User's own referral code
  referredBy?: string; // Referral code of person who referred this user
  referredUsers: string[]; // Array of user IDs that this user referred
  totalReferrals: number;
  referralEarnings: number; // Total cashback earned from referrals
  // BUG FIX #4: Referral reward deduplication flag
  referralRewardIssued?: boolean; // Flag to prevent duplicate reward issuance
}

// User verifications interface (for exclusive zones)
export interface IUserVerifications {
  student?: {
    verified: boolean;
    verifiedAt?: Date;
    instituteName?: string;
    documentType?: 'student_id' | 'edu_email' | 'enrollment_letter';
    expiresAt?: Date;
  };
  corporate?: {
    verified: boolean;
    verifiedAt?: Date;
    companyName?: string;
    corporateEmail?: string;
    expiresAt?: Date;
  };
  defence?: {
    verified: boolean;
    verifiedAt?: Date;
    documentType?: 'military_id' | 'service_card' | 'canteen_card' | 'ex_servicemen_card';
    serviceType?: 'army' | 'navy' | 'airforce' | 'paramilitary';
  };
  healthcare?: {
    verified: boolean;
    verifiedAt?: Date;
    documentType?: 'hospital_id' | 'medical_council' | 'nursing_license';
    profession?: 'doctor' | 'nurse' | 'paramedic' | 'pharmacist';
  };
  senior?: {
    verified: boolean;
    verifiedAt?: Date;
    dateOfBirth?: Date;
  };
  teacher?: {
    verified: boolean;
    verifiedAt?: Date;
    instituteName?: string;
    documentType?: 'school_id' | 'college_id' | 'ugc_id';
  };
  government?: {
    verified: boolean;
    verifiedAt?: Date;
    department?: string;
    documentType?: 'govt_id' | 'pay_slip';
  };
  differentlyAbled?: {
    verified: boolean;
    verifiedAt?: Date;
    documentType?: 'disability_certificate' | 'udid_card';
    disabilityType?: string;
  };
}

// Main User interface
export interface IUser extends Document {
  phoneNumber: string;
  email?: string;
  password?: string; // For social login or password-based auth
  profile: IUserProfile;
  preferences: IUserPreferences;
  // DM-L4: wallet sub-doc removed — use Wallet collection
  /** @deprecated Wallet data lives in the Wallet collection. This field is undefined at runtime. */
  wallet?: IUserWallet;
  auth: IUserAuth;
  referral: IUserReferral;
  verifications?: IUserVerifications;
  socialLogin?: {
    googleId?: string;
    facebookId?: string;
    provider?: 'google' | 'facebook';
  };
  role: 'user' | 'admin' | 'merchant' | 'support' | 'operator' | 'super_admin' | 'consumer';
  isActive: boolean;
  isSuspended?: boolean; // Admin-controlled suspension flag (set by adminDashboardRoutes)
  // F-H5 FIX: status field mirrors isActive/isSuspended — kept in sync by suspension-sync pre-save hook
  status?: 'active' | 'suspended' | 'inactive';
  suspendedAt?: Date;
  suspendReason?: string;
  createdAt: Date;
  updatedAt: Date;

  // Convenience properties for direct access (flatten nested properties)
  // DM-L4: walletBalance removed — was synced from wallet.balance (now dropped)
  referralCode?: string; // Direct access to referral.referralCode
  fullName?: string; // Computed from profile.firstName + profile.lastName
  username?: string; // Username for display
  referralTier?: 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'; // Referral tier level
  isPremium?: boolean; // Premium membership status
  premiumExpiresAt?: Date; // Premium expiry date

  // Denormalized entitlement fields (for fast queries, kept in sync by privilegeResolutionService)
  rezPlusTier?: 'free' | 'premium' | 'vip';
  priveTier?: 'none' | 'entry' | 'signature' | 'elite';
  activeZones?: string[];
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';

  // Additional user properties
  userType?: string; // User type for targeting (e.g., 'regular', 'premium', 'new')
  age?: number; // User age computed from dateOfBirth
  location?: string; // Direct access to profile.location (city or address)
  interests?: string[]; // User interests/categories for personalization
  phone?: string; // Alias for phoneNumber (for compatibility with services)

  // Push notification tokens (multiple devices)
  pushTokens?: Array<{
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceInfo?: Record<string, any>;
    lastUsed: Date;
  }>;

  // Patch test tracking for salon services (hair colour, lash tint, etc.)
  patchTests?: Array<{
    serviceCategory: string;
    testedAt: Date;
    expiresAt: Date;
    result: 'pass' | 'reaction';
    conductedBy: string;
    storeId: Schema.Types.ObjectId;
  }>;

  // Identity layer fields
  featureLevel?: number;
  verificationSegment?: 'none' | 'provisional' | 'pending' | 'verified';
  segment?: 'normal' | 'verified_student' | 'verified_employee' | 'verified_defence' | 'verified_healthcare';
  instituteStatus?: 'not_available' | 'pending_referral' | 'onboarded';
  statedIdentity?: 'student' | 'corporate' | 'other' | 'general';
  isFlagged?: boolean;
  flagReason?: string;
  flaggedBy?: Schema.Types.ObjectId;
  flaggedAt?: Date;

  // Game access control
  gameBanned?: boolean;
  gameBanReason?: string;
  gameBannedAt?: Date;
  lastLogin?: Date; // Alias for auth.lastLogin (for compatibility with services)

  // Terms of service / privacy policy acceptance
  tosAcceptedAt?: Date | null;
  tosVersion?: string | null;
  privacyPolicyAcceptedAt?: Date | null;
  privacyPolicyVersion?: string | null;

  // Fraud detection flags (set by fraudDetection cron job)
  fraudFlags?: {
    coinVelocity?: {
      flaggedAt: Date;
      earnedLast24h: number; // coins earned in last 24h at time of flagging
      zScore: number; // statistical z-score vs. platform mean
      cleared?: boolean; // true once an admin clears the flag
      clearedAt?: Date; // when the flag was cleared
    };
    referralAbuse?: {
      flaggedAt: Date;
      reason: string;
    };
  };

  // Soft-delete
  deletedAt: Date | null;
  isDeleted: boolean; // virtual

  // Device info cleared on account deletion (BED-023)
  deviceInfo?: unknown;

  // Student-specific fields
  studentCoins?: {
    balance: number;
    lastUpdated: Date;
  };
  studentWallet?: {
    monthlyBudget: number;
    spentThisMonth: number;
    budgetAlertThreshold: number;
    linkedParents: Array<{
      id: string;
      name: string;
      relationship: string;
    }>;
    fundingRequests: Array<{
      requestId: string;
      parentId: string;
      parentName: string;
      amount: number;
      reason?: string;
      status: 'pending' | 'approved' | 'rejected';
      createdAt: Date;
      processedAt?: Date;
      rejectReason?: string;
    }>;
  };
  studentMissions?: string[]; // Array of completed mission IDs
  studentProfile?: {
    referralCode: string;
    referralsCount: number;
    totalSavings: number;
  };
  studentStats?: {
    totalOrders: number;
    totalSavings: number;
    lastOrderAt?: Date;
  };

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateOTP(): string;
  verifyOTP(otp: string): boolean;
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  softDelete(): Promise<void>;
}

// User Schema
const UserSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: 8,
      select: false, // Don't include password in queries by default
    },
    profile: {
      firstName: {
        type: String,
        trim: true,
        maxlength: 50,
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: 50,
      },
      avatar: {
        type: String,
        default: null,
      },
      bio: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      website: {
        type: String,
        trim: true,
        maxlength: 200,
        match: [/^https?:\/\/.+/, 'Please enter a valid website URL'],
      },
      dateOfBirth: {
        type: Date,
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      },
      location: {
        address: String,
        city: String,
        state: String,
        pincode: {
          type: String,
          match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode'],
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: '2dsphere', // For geospatial queries
        },
      },
      // locationHistory is capped at 100 entries via $slice: -100 on every $push.
      // All writes to this field MUST use: { $push: { 'profile.locationHistory': { $each: [entry], $slice: -100 } } }
      locationHistory: [
        {
          coordinates: {
            type: [Number],
            required: true,
          },
          address: {
            type: String,
            required: true,
          },
          city: String,
          timestamp: {
            type: Date,
            default: Date.now,
          },
          source: {
            type: String,
            enum: ['manual', 'gps', 'ip'],
            default: 'manual',
          },
        },
      ],
      timezone: {
        type: String,
        default: 'Asia/Kolkata',
      },
      ringSize: {
        type: String,
        enum: ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
      },
      jewelryPreferences: {
        preferredMetals: [
          {
            type: String,
            enum: ['gold', 'silver', 'platinum', 'diamond', 'pearl', 'gemstone'],
          },
        ],
        preferredStones: [
          {
            type: String,
            enum: ['diamond', 'ruby', 'emerald', 'sapphire', 'pearl', 'amethyst', 'topaz', 'garnet'],
          },
        ],
        style: {
          type: String,
          enum: ['traditional', 'modern', 'vintage', 'contemporary'],
        },
      },
      // F-H4 FIX: verificationStatus was in IUserProfile interface but missing from schema.
      // Without this, any writes to profile.verificationStatus were silently discarded by Mongoose strict mode.
      verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
      },
    },
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      // B09 FIX: currency was accepted by the Joi validator and expected by the consumer
      // frontend, but was missing from the Mongoose schema — writes were silently dropped.
      currency: {
        type: String,
        enum: ['INR', 'USD', 'EUR', 'GBP'],
        default: 'INR',
      },
      notifications: {
        push: {
          type: Boolean,
          default: true,
        },
        email: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
      },
      categories: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Category',
        },
      ],
      theme: {
        type: String,
        default: 'light',
        enum: ['light', 'dark'],
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
    },
    // NOTE: User.wallet sub-doc removed (DM-L4). Wallet data is in the Wallet collection.
    // Use WalletService or GET /wallet/balance to read wallet balances.
    auth: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      isOnboarded: {
        type: Boolean,
        default: false,
      },
      lastLogin: {
        type: Date,
      },
      refreshToken: {
        type: String,
        select: false,
      },
      otpCode: {
        type: String,
        select: false,
      },
      otpExpiry: {
        type: Date,
        select: false,
      },
      loginAttempts: {
        type: Number,
        default: 0,
      },
      totpSecret: {
        type: String,
        select: false,
      },
      totpEnabled: {
        type: Boolean,
        default: false,
      },
      lockUntil: {
        type: Date,
        select: false,
      },
      pinHash: {
        type: String,
        select: false,
      },
      pinSetAt: {
        type: Date,
      },
      pinAttempts: {
        type: Number,
        default: 0,
      },
      pinLockedUntil: {
        type: Date,
      },
    },
    referral: {
      type: {
        referralCode: {
          type: String,
          unique: true,
          sparse: true,
          uppercase: true,
          trim: true,
          validate: {
            validator: function (v: string) {
              // Allow undefined/null (will be generated by pre-save hook)
              if (!v) return true;

              // New format: REF + 6 or 8 chars (9 or 11 total)
              if (v.startsWith('REF')) {
                return [9, 11].includes(v.length);
              }

              // Accept legacy codes (any format, min 4 chars) for backward compatibility
              // This ensures existing users with old referral codes can still login
              return v.length >= 4;
            },
            message: 'Invalid referral code format',
          },
        },
        referredBy: {
          type: String,
          uppercase: true,
          trim: true,
        },
        referredUsers: [
          {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        totalReferrals: {
          type: Number,
          default: 0,
        },
        referralEarnings: {
          type: Number,
          default: 0,
        },
        // BUG FIX #4: Referral reward deduplication flag
        referralRewardIssued: {
          type: Boolean,
          default: false,
        },
      },
      default: () => ({
        referredUsers: [],
        totalReferrals: 0,
        referralEarnings: 0,
        referralRewardIssued: false,
      }),
    },
    socialLogin: {
      googleId: String,
      facebookId: String,
      provider: {
        type: String,
        enum: ['google', 'facebook'],
      },
    },
    verifications: {
      student: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        instituteName: String,
        documentType: { type: String, enum: ['student_id', 'edu_email', 'enrollment_letter'] },
        expiresAt: Date,
      },
      corporate: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        companyName: String,
        corporateEmail: String,
        expiresAt: Date,
      },
      defence: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        documentType: { type: String, enum: ['military_id', 'service_card', 'canteen_card', 'ex_servicemen_card'] },
        serviceType: { type: String, enum: ['army', 'navy', 'airforce', 'paramilitary'] },
      },
      healthcare: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        documentType: { type: String, enum: ['hospital_id', 'medical_council', 'nursing_license'] },
        profession: { type: String, enum: ['doctor', 'nurse', 'paramedic', 'pharmacist'] },
      },
      senior: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        dateOfBirth: Date,
      },
      teacher: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        instituteName: String,
        documentType: { type: String, enum: ['school_id', 'college_id', 'ugc_id'] },
      },
      government: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        department: String,
        documentType: { type: String, enum: ['govt_id', 'pay_slip'] },
      },
      differentlyAbled: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        documentType: { type: String, enum: ['disability_certificate', 'udid_card'] },
        disabilityType: String,
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'merchant', 'support', 'operator', 'super_admin', 'consumer'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // isSuspended: admin-controlled suspension flag (written by adminDashboardRoutes suspend endpoint).
    // Distinct from isActive — a suspended user is blocked from transacting but their account remains.
    isSuspended: {
      type: Boolean,
      default: false,
    },
    // F-H5 FIX: status field added to schema to prevent Mongoose strict-mode stripping.
    // Kept in sync with isActive and isSuspended via the suspension-sync pre-save hook below.
    status: {
      type: String,
      enum: ['active', 'suspended', 'inactive'],
      default: 'active',
    },
    suspendedAt: {
      type: Date,
    },
    suspendReason: {
      type: String,
      trim: true,
    },
    // Convenience fields for direct access
    // DM-L4: walletBalance field removed (was synced from wallet.balance sub-doc, now dropped)
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    referralTier: {
      type: String,
      enum: ['starter', 'bronze', 'silver', 'gold', 'platinum', 'diamond'],
      default: 'starter',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: {
      type: Date,
    },
    userType: {
      type: String,
      default: 'regular',
    },
    rezPlusTier: {
      type: String,
      enum: ['free', 'premium', 'vip'],
      default: 'free',
    },
    priveTier: {
      type: String,
      enum: ['none', 'entry', 'signature', 'elite'],
      default: 'none',
    },
    activeZones: {
      type: [String],
      default: [],
    },
    loyaltyTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
    location: {
      type: String,
      trim: true,
    },
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    // Identity layer
    featureLevel: {
      type: mongoose.Schema.Types.Mixed,
      default: 1,
      set: (v: any) => {
        // Legacy data may have string values like "premium" — coerce to number
        if (typeof v === 'string') {
          const parsed = parseInt(v, 10);
          if (!isNaN(parsed)) return parsed;
          // Map string levels to numbers
          const map: Record<string, number> = { basic: 1, standard: 2, premium: 3, pro: 4, elite: 5 };
          return map[v.toLowerCase()] || 1;
        }
        return v;
      },
    },
    verificationSegment: {
      type: String,
      enum: ['none', 'provisional', 'pending', 'verified'],
      default: 'none',
    },
    segment: {
      type: String,
      enum: [
        'normal',
        'verified_student',
        'verified_employee',
        'verified_defence',
        'verified_healthcare',
        'verified_teacher',
        'verified_senior',
        'verified_government',
        'verified_differentlyAbled',
      ],
      default: 'normal',
    },
    instituteStatus: {
      type: String,
      enum: ['not_available', 'pending_referral', 'onboarded'],
      default: 'not_available',
    },
    statedIdentity: {
      type: String,
      enum: ['student', 'corporate', 'other', 'general'],
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      trim: true,
    },
    flaggedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // DM-C2 fix: no model named 'AdminUser' exists; admins are User docs with role admin/super_admin
    },
    flaggedAt: {
      type: Date,
    },
    gameBanned: {
      type: Boolean,
      default: false,
    },
    gameBanReason: {
      type: String,
      trim: true,
    },
    gameBannedAt: {
      type: Date,
    },
    tosAcceptedAt: {
      type: Date,
      default: null,
    },
    tosVersion: {
      type: String,
      default: null,
    },
    privacyPolicyAcceptedAt: {
      type: Date,
      default: null,
    },
    privacyPolicyVersion: {
      type: String,
      default: null,
    },
    pushTokens: [
      {
        token: { type: String, required: true },
        platform: { type: String, enum: ['ios', 'android', 'web'] },
        deviceInfo: { type: Schema.Types.Mixed },
        lastUsed: { type: Date, default: Date.now },
      },
    ],
    // BED-023: device info at user level (cleared on account deletion)
    deviceInfo: { type: Schema.Types.Mixed, default: undefined },
    patchTests: [
      {
        serviceCategory: { type: String }, // 'hair_colour', 'lash_tint', 'brow_tint'
        testedAt: { type: Date },
        expiresAt: { type: Date }, // testedAt + 6 months
        result: { type: String, enum: ['pass', 'reaction'] },
        conductedBy: { type: String }, // staff name or ID
        storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
    // Fraud detection flags — written by fraudDetection.ts job and cleared by admin dashboard
    // coinVelocity fields:
    //   flaggedAt      — when the job flagged this user
    //   earnedLast24h  — coins earned in the 24h window (written by fraudDetection job)
    //   zScore         — statistical z-score vs. platform mean (written by fraudDetection job)
    //   cleared        — true once an admin clears the flag (written by adminDashboardRoutes)
    //   clearedAt      — timestamp when admin cleared the flag
    fraudFlags: {
      coinVelocity: {
        flaggedAt: { type: Date },
        earnedLast24h: { type: Number },
        zScore: { type: Number },
        cleared: { type: Boolean, default: false },
        clearedAt: { type: Date },
      },
      referralAbuse: {
        flaggedAt: { type: Date },
        reason: { type: String },
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: function (_doc: any, ret: any) {
        delete ret.password;
        if (ret.auth) {
          delete ret.auth.refreshToken;
          delete ret.auth.otpCode;
          delete ret.auth.otpExpiry;
          delete ret.auth.lockUntil;
          delete ret.auth.totpSecret;
          delete ret.auth.pinHash;
        }
        // DM-M2: expose lastLogin at top level for backward-compatibility with
        // consumers that read user.lastLogin directly (mirrors auth.lastLogin).
        if (ret.auth?.lastLogin !== undefined && ret.lastLogin === undefined) {
          ret.lastLogin = ret.auth.lastLogin;
        }
        // DM-M2: also expose lastLoginAt as a canonical alias
        ret.lastLoginAt = ret.auth?.lastLogin ?? ret.lastLogin ?? null;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
);

// Indexes for performance
// Single field indexes
UserSchema.index({ 'referral.referredBy': 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'auth.isVerified': 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ referralTier: 1 });

// Compound indexes for common queries
UserSchema.index({ 'auth.isVerified': 1, isActive: 1 });
UserSchema.index({ phoneNumber: 1, 'auth.isVerified': 1 }); // sendOTP: findOne({ phoneNumber, isVerified: false })
UserSchema.index({ isActive: 1, createdAt: -1 }); // for user list filtering

// FIX: Missing compound indexes for common queries
UserSchema.index({ email: 1, role: 1 }); // for user lookup by email and role
UserSchema.index({ role: 1, createdAt: -1 }); // for admin user queries by role
UserSchema.index({ referralTier: 1, createdAt: -1 }); // for tier-based analytics
UserSchema.index({ 'preferences.theme': 1 }); // for theme analytics
UserSchema.index({ isSuspended: 1, createdAt: -1 }); // for suspension tracking

// HIGH-006 FIX: TTL index on auth.otpExpiry.
// Without this, every user document that was created during an OTP flow but never verified
// retains an otpExpiry field forever — MongoDB never GC's subdocument fields automatically.
// This sparse TTL index instructs MongoDB to delete the DOCUMENT (not just the field) if
// auth.otpExpiry is set and has passed. Documents without otpExpiry (verified users) are
// excluded due to `sparse: true`.
//
// NOTE: This only deletes UNVERIFIED user documents whose OTP window has expired (i.e., the
// user started sign-up, got an OTP, never verified, and the OTP TTL is now past).
// Verified users have auth.otpExpiry cleared on successful verification (see verifyOTP handler).
// If you want to keep unverified user records for analytics, change expireAfterSeconds to a
// larger value (e.g., 7 * 86400 for 7-day retention after OTP expiry).
UserSchema.index(
  { 'auth.otpExpiry': 1 },
  {
    expireAfterSeconds: 0, // Delete when otpExpiry datetime is reached
    sparse: true, // Only index docs that have auth.otpExpiry set
    name: 'idx_auth_otpExpiry_ttl',
  },
);

// Cascade cleanup when a user is deleted
UserSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const userId = (this as any)._id;
  const db = mongoose.connection;

  // Use a session if one is available on the document (supports transactional deletes)
  const session = (this as any).$session ? (this as any).$session() : undefined;
  const opts = session ? { session } : {};

  // Delete owned single-document records
  await db.collection('wallets').deleteOne({ user: userId }, opts);
  await db.collection('carts').deleteOne({ user: userId }, opts);

  // Delete owned multi-document records
  await db.collection('addresses').deleteMany({ user: userId }, opts);
  await db.collection('wishlists').deleteMany({ user: userId }, opts);
  await db.collection('searchhistories').deleteMany({ user: userId }, opts);
  await db.collection('cointransactions').deleteMany({ user: userId }, opts);

  // Delete notifications where user is sender or recipient
  await db.collection('notifications').deleteMany({ $or: [{ user: userId }, { recipient: userId }] }, opts);

  // Remove deleted user from referral records (unset referredBy, pull from referredUsers)
  await db
    .collection('users')
    .updateMany({ 'referral.referredUsers': userId }, { $pull: { 'referral.referredUsers': userId as any } }, opts);
  await db
    .collection('users')
    .updateMany({ 'referral.referredBy': userId.toString() }, { $unset: { 'referral.referredBy': '' } }, opts);

  // Soft-delete orders (preserve financial audit trail)
  await db.collection('orders').updateMany({ user: userId }, { $set: { user: null, deletedAt: new Date() } }, opts);
});

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function (this: IUser) {
  return !!(this.auth.lockUntil && this.auth.lockUntil > new Date());
});

// Virtual: true when the user has been soft-deleted
UserSchema.virtual('isDeleted').get(function (this: IUser) {
  return this.deletedAt != null;
});

// Pre-query middleware: automatically exclude soft-deleted users from find/findOne queries
// Pass { includeDeleted: true } in the query to bypass this filter.
UserSchema.pre(/^find/, function (this: any) {
  if (!this.getQuery().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

// Virtual properties for compatibility (aliases for nested properties)
UserSchema.virtual('phone').get(function (this: IUser) {
  return this.phoneNumber;
});

UserSchema.virtual('lastLogin').get(function (this: IUser) {
  return this.auth.lastLogin;
});

// DM-M2: lastLoginAt is the canonical field name; lastLogin is the legacy alias.
// Both resolve to auth.lastLogin so either field name works on serialised objects.
UserSchema.virtual('lastLoginAt').get(function (this: IUser) {
  return this.auth.lastLogin;
});

// F-H5 FIX: Suspension-sync pre-save hook.
// Keeps isActive, isSuspended, and status in sync so admin and consumer always agree on user state.
UserSchema.pre('save', function (next) {
  if (this.isModified('isActive')) {
    this.isSuspended = !this.isActive;
    this.status = this.isActive ? 'active' : 'suspended';
  }
  if (this.isModified('isSuspended')) {
    this.isActive = !this.isSuspended;
    this.status = this.isSuspended ? 'suspended' : 'active';
  }

  // P1-DATA-3 FIX: Normalize loyalty tiers to canonical lowercase.
  // referralTier arrives in mixed case ('STARTER', 'BRONZE', 'DIAMOND', etc.)
  // from legacy data or admin tools. Canonical storage is lowercase.
  if (this.isModified('referralTier') && this.referralTier) {
    const referralTierMap: Record<string, string> = {
      STARTER: 'starter',
      BRONZE: 'bronze',
      SILVER: 'silver',
      GOLD: 'gold',
      PLATINUM: 'platinum',
      DIAMOND: 'diamond',
    };
    const normalized = referralTierMap[this.referralTier.toUpperCase()];
    if (normalized) this.referralTier = normalized as typeof this.referralTier;
  }

  // Also normalize brandLoyalty tiers if present (same mapping)
  if (this.isModified('brandLoyalty') && Array.isArray((this as any).brandLoyalty)) {
    (this as any).brandLoyalty = (this as any).brandLoyalty.map((tier: any) => ({
      ...tier,
      tier: tier.tier
        ? ((tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1).toLowerCase()) as typeof tier.tier)
        : tier.tier,
    }));
  }

  next();
});

// Pre-save hook to generate referral code, hash password, and sync fields
UserSchema.pre('save', async function (this: IUser, next) {
  // Ensure referral object exists
  if (!this.referral) {
    this.referral = {
      referredUsers: [],
      totalReferrals: 0,
      referralEarnings: 0,
    } as any;
  }

  // Generate referral code for new users
  if (this.isNew && !this.referral.referralCode && !this.referralCode) {
    const code = await generateUniqueReferralCode();
    this.referral.referralCode = code;
    this.referralCode = code;
  }

  // Sync referralCode between nested and top-level
  if (this.isModified('referral.referralCode') && this.referral?.referralCode) {
    this.referralCode = this.referral.referralCode;
  } else if (this.isModified('referralCode') && this.referralCode) {
    if (!this.referral) {
      this.referral = {
        referredUsers: [],
        totalReferrals: 0,
        referralEarnings: 0,
      } as any;
    }
    this.referral.referralCode = this.referralCode;
  }

  // Compute fullName from firstName and lastName
  if (this.isModified('profile.firstName') || this.isModified('profile.lastName')) {
    const firstName = this.profile?.firstName || '';
    const lastName = this.profile?.lastName || '';
    this.fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;
  }

  // Compute age from dateOfBirth
  if (this.isModified('profile.dateOfBirth') && this.profile?.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.profile.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age > 0 ? age : undefined;
  }

  // Sync location from profile.location
  if (this.isModified('profile.location')) {
    this.location = this.profile?.location?.city || this.profile?.location?.address || undefined;
  }

  // DM-L4: wallet.balance / walletBalance sync removed — wallet sub-doc dropped.

  // Only hash the password if it has been modified (or is new)
  if (this.isModified('password') && this.password) {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

/**
 * Helper function to generate unique cryptographically secure referral code
 * Format: REF + 8 random alphanumeric characters (e.g., REF4A7B2C9D)
 * Uses crypto.randomBytes for cryptographic security
 */
async function generateUniqueReferralCode(): Promise<string> {
  const User = mongoose.model('User');
  let referralCode: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10; // Prevent infinite loops

  while (!isUnique && attempts < maxAttempts) {
    attempts++;

    // Generate 8 random hex characters using crypto (cryptographically secure)
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    referralCode = `REF${randomHex}`;

    // Check if code already exists
    const existingUser = await User.findOne({
      $or: [{ 'referral.referralCode': referralCode }, { referralCode: referralCode }],
    });

    if (!existingUser) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    // Fallback: use timestamp + random bytes to ensure uniqueness
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const randomBytes = crypto.randomBytes(2).toString('hex').toUpperCase();
    referralCode = `REF${timestamp}${randomBytes}`;
  }

  return referralCode!;
}

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate OTP
UserSchema.methods.generateOTP = function (): string {
  const otp = require('crypto').randomInt(100000, 1000000).toString();
  this.auth.otpCode = otp;
  // Read expiry from environment so it can be tuned without a code deploy.
  // Defaults to 5 minutes; override via OTP_EXPIRY_MINUTES env var.
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
  this.auth.otpExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
  return otp;
};

// Instance method to verify OTP
UserSchema.methods.verifyOTP = function (otp: string): boolean {
  // Always perform real OTP verification (no dev mode bypass)
  if (!this.auth.otpCode || !this.auth.otpExpiry) return false;

  // Timing-safe comparison to prevent timing oracle attacks
  const storedOtp = String(this.auth.otpCode);
  const inputOtp = String(otp);
  let otpMatch = false;
  if (storedOtp.length === inputOtp.length) {
    otpMatch = require('crypto').timingSafeEqual(Buffer.from(storedOtp), Buffer.from(inputOtp));
  }
  const isValid = otpMatch && this.auth.otpExpiry > new Date();

  if (isValid) {
    // Clear OTP after successful verification
    this.auth.otpCode = undefined;
    this.auth.otpExpiry = undefined;
    this.auth.isVerified = true;
  }

  return isValid;
};

// Instance method to check if account is locked
UserSchema.methods.isAccountLocked = function (): boolean {
  return !!(this.auth.lockUntil && this.auth.lockUntil > new Date());
};

// Instance method to increment login attempts
UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // Check if we have a previous lock that has expired
  if (this.auth.lockUntil && this.auth.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { 'auth.lockUntil': 1, 'auth.loginAttempts': 1 },
    });
  }

  const updates: any = { $inc: { 'auth.loginAttempts': 1 } };

  // Progressive lockout durations
  const getLockDuration = (attempts: number): number => {
    if (attempts >= 10) return 60 * 60 * 1000; // 1 hour
    if (attempts >= 7) return 15 * 60 * 1000; // 15 min
    if (attempts >= 5) return 5 * 60 * 1000; // 5 min
    if (attempts >= 3) return 1 * 60 * 1000; // 1 min
    return 0;
  };

  const nextAttempts = this.auth.loginAttempts + 1;
  const lockDuration = getLockDuration(nextAttempts);

  if (lockDuration > 0) {
    updates.$set = { 'auth.lockUntil': new Date(Date.now() + lockDuration) };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  return this.updateOne({
    $unset: { 'auth.lockUntil': 1, 'auth.loginAttempts': 1 },
  });
};

// Instance method to soft-delete a user
// Sets deletedAt to now instead of removing the document, preserving audit trail.
UserSchema.methods.softDelete = async function (): Promise<void> {
  this.deletedAt = new Date();
  await this.save();
};

// Static method to find by phone or email
UserSchema.statics.findByCredentials = function (identifier: string) {
  const isEmail = identifier.includes('@');
  const query = isEmail ? { email: identifier } : { phoneNumber: identifier };
  return this.findOne(query).select('+password');
};

export const User = mongoose.model<IUser>('User', UserSchema);
