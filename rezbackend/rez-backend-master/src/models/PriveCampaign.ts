import mongoose, { Schema, Document, Types } from 'mongoose';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'closed' | 'archived';
export type CampaignType = 'photo_contest' | 'video_contest' | 'review_challenge' | 'social_story' | 'referral_drive' | 'content_creation';

export interface ICampaignReward {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  coins: number;
  coinType: 'rez' | 'prive';
  badge?: string;
  description: string;
}

export interface IPriveCampaign extends Document {
  title: string;
  description: string;
  shortDescription: string;
  type: CampaignType;
  status: CampaignStatus;

  // Media & Branding
  image: string;
  bannerImage?: string;
  icon: string;

  // Timeline
  startDate: Date;
  endDate: Date;
  submissionDeadline: Date;

  // Requirements
  minAge?: number;
  requiredTier?: 'none' | 'entry' | 'signature' | 'elite';
  minReputationScore?: number;
  minSubmissions?: number;
  maxSubmissions?: number;

  // Participation
  participantCount: number;
  submissionCount: number;
  maxParticipants?: number; // 0 = unlimited

  // Rewards
  totalRewardPool: number;
  rewards: ICampaignReward[];
  participationBonus: number; // coins for just participating

  // Engagement Metrics
  views: number;
  clicks: number;
  submissions: number;

  // Rules & Content
  guidelinesText: string;
  allowedFormats: string[]; // ['jpg', 'png', 'mp4', 'mov']
  minFileSize?: number;
  maxFileSize?: number;
  hashtagRequired?: string;

  // Visibility & Priority
  isActive: boolean;
  isFeatured: boolean;
  priority: number; // higher = more prominent
  visibility: 'public' | 'tier_restricted' | 'invite_only';

  // Admin
  createdBy: Types.ObjectId;
  category?: string;
  tags?: string[];
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const CampaignRewardSchema = new Schema<ICampaignReward>(
  {
    tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], required: true },
    coins: { type: Number, required: true, min: 0 },
    coinType: { type: String, enum: ['rez', 'prive'], default: 'prive' },
    badge: { type: String, default: null },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const PriveCampaignSchema = new Schema<IPriveCampaign>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '', maxlength: 500 },
    type: {
      type: String,
      required: true,
      enum: ['photo_contest', 'video_contest', 'review_challenge', 'social_story', 'referral_drive', 'content_creation'],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'closed', 'archived'],
      default: 'draft',
      index: true,
    },

    // Media
    image: { type: String, required: true },
    bannerImage: { type: String, default: '' },
    icon: { type: String, default: '🏆' },

    // Timeline
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    submissionDeadline: { type: Date, required: true },

    // Requirements
    minAge: { type: Number, default: null, min: 13 },
    requiredTier: {
      type: String,
      enum: ['none', 'entry', 'signature', 'elite'],
      default: 'none',
    },
    minReputationScore: { type: Number, default: 0, min: 0 },
    minSubmissions: { type: Number, default: 1, min: 1 },
    maxSubmissions: { type: Number, default: 10, min: 1 },

    // Participation
    participantCount: { type: Number, default: 0, min: 0 },
    submissionCount: { type: Number, default: 0, min: 0 },
    maxParticipants: { type: Number, default: 0 }, // 0 = unlimited

    // Rewards
    totalRewardPool: { type: Number, required: true, default: 0, min: 0 },
    rewards: { type: [CampaignRewardSchema], default: [] },
    participationBonus: { type: Number, default: 0, min: 0 },

    // Engagement
    views: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    submissions: { type: Number, default: 0, min: 0 },

    // Content Rules
    guidelinesText: { type: String, default: '' },
    allowedFormats: { type: [String], default: ['jpg', 'png', 'mp4'] },
    minFileSize: { type: Number, default: null }, // bytes
    maxFileSize: { type: Number, default: 52428800 }, // 50MB
    hashtagRequired: { type: String, default: null },

    // Visibility
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    priority: { type: Number, default: 0 },
    visibility: {
      type: String,
      enum: ['public', 'tier_restricted', 'invite_only'],
      default: 'public',
    },

    // Admin
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, default: null, index: true },
    tags: { type: [String], default: [] },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Indexes
PriveCampaignSchema.index({ status: 1, isActive: 1, startDate: -1 });
PriveCampaignSchema.index({ isFeatured: 1, isActive: 1, priority: -1 });
PriveCampaignSchema.index({ requiredTier: 1, isActive: 1 });
PriveCampaignSchema.index({ type: 1, isActive: 1 });
PriveCampaignSchema.index({ endDate: 1, status: 1 });
PriveCampaignSchema.index({ isDeleted: 1, isActive: 1 });

export const PriveCampaign = mongoose.model<IPriveCampaign>('PriveCampaign', PriveCampaignSchema);
