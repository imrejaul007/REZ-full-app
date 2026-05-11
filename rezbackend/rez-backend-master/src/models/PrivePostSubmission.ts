import mongoose, { Schema, Document, Types } from 'mongoose';

export type SubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'flagged' | 'deleted';

export interface IPrivePostSubmission extends Document {
  campaign: Types.ObjectId;
  user: Types.ObjectId;

  // Content
  caption: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  mediaMetadata?: {
    width?: number;
    height?: number;
    duration?: number; // seconds for video
    fileSize: number;
    mimeType: string;
  };

  // Engagement
  likes: number;
  shares: number;
  comments: number;
  views: number;

  // Review & Status
  status: SubmissionStatus;
  rejectionReason?: string;
  flagReason?: string;
  moderatorNotes?: string;

  // Ranking & Awards
  rank?: number;
  awardTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  coinReward?: number;
  badgeAwarded?: string;

  // Visibility
  isPublished: boolean;
  isFeatured: boolean;
  featuredAt?: Date;

  // Metadata
  ipAddress?: string;
  userAgent?: string;
  hashtags?: string[];
  mentionedUsers?: Types.ObjectId[];

  // Review Info
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  appealCount: number;
  appealStatus?: 'none' | 'pending' | 'approved' | 'rejected';

  // Admin
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const MediaMetadataSchema = new Schema(
  {
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    duration: { type: Number, default: null },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
  },
  { _id: false },
);

const PrivePostSubmissionSchema = new Schema<IPrivePostSubmission>(
  {
    campaign: { type: Schema.Types.ObjectId, ref: 'PriveCampaign', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Content
    caption: { type: String, required: true, maxlength: 2000 },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    mediaMetadata: { type: MediaMetadataSchema, default: {} },

    // Engagement
    likes: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
    comments: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },

    // Review & Status
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'flagged', 'deleted'],
      default: 'submitted',
    },
    rejectionReason: { type: String, default: null },
    flagReason: { type: String, default: null },
    moderatorNotes: { type: String, default: null },

    // Ranking & Awards
    rank: { type: Number, default: null, min: 1 },
    awardTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: null,
    },
    coinReward: { type: Number, default: 0, min: 0 },
    badgeAwarded: { type: String, default: null },

    // Visibility
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    featuredAt: { type: Date, default: null },

    // Metadata
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    hashtags: { type: [String], default: [] },
    mentionedUsers: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },

    // Review Info
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    appealCount: { type: Number, default: 0, min: 0 },
    appealStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },

    // Admin
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

// Unique compound index: a user can only submit once per campaign (enforced at app level with status check)
PrivePostSubmissionSchema.index({ campaign: 1, user: 1 }, { unique: true });

// Additional indexes for common queries
PrivePostSubmissionSchema.index({ campaign: 1, status: 1 });
PrivePostSubmissionSchema.index({ user: 1, status: 1 });
PrivePostSubmissionSchema.index({ status: 1, isPublished: 1 });
PrivePostSubmissionSchema.index({ isFeatured: 1, isPublished: 1 });
PrivePostSubmissionSchema.index({ awardTier: 1, status: 1 });
PrivePostSubmissionSchema.index({ isDeleted: 1, status: 1 });
PrivePostSubmissionSchema.index({ createdAt: -1 });

export const PrivePostSubmission = mongoose.model<IPrivePostSubmission>(
  'PrivePostSubmission',
  PrivePostSubmissionSchema,
);
