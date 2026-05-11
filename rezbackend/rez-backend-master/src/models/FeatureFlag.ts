import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureFlag extends Document {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number; // 0-100, for gradual rollout
  allowedUserIds?: string[]; // specific users for beta testing
  environments: ('development' | 'staging' | 'production')[];
  updatedBy?: string;
  updatedAt: Date;
  createdAt: Date;
}

const schema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    description: { type: String, required: true },
    rolloutPercentage: { type: Number, default: 100, min: 0, max: 100 },
    allowedUserIds: [String],
    environments: [{ type: String, enum: ['development', 'staging', 'production'] }],
    updatedBy: String,
  },
  { timestamps: true },
);

// Compound index for key + enabled lookups (admin/service queries that filter by both)
schema.index({ key: 1, enabled: 1 });
// Dedicated index for enabled-only queries — used by /app-status to fetch all active flags.
// The compound index above has 'key' as the leading field so it can't serve { enabled: true } alone.
schema.index({ enabled: 1 });

export default mongoose.model<IFeatureFlag>('FeatureFlag', schema);
