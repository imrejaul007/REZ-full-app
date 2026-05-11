import mongoose, { Schema } from 'mongoose';

/**
 * CampaignRule — Merchant loyalty and promotion rules
 *
 * CANONICAL TYPES: @rez/shared-types/entities/campaign.ts#IMerchantCampaign
 *
 * Used for loyalty programs, promotional rules, and broadcast campaigns.
 * Supports condition-based triggers, reward types, and audience targeting.
 *
 * CRIT-004 FIX: Changed from strict: true to strict: true
 * With strict: true, arbitrary fields could be persisted without validation.
 * strict: true prevents unknown fields from being saved to the database.
 */

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    name: { type: String },
    title: { type: String },
    description: { type: String },
    type: { type: String },
    status: { type: String },
    isActive: { type: Boolean },
    startDate: { type: Date },
    endDate: { type: Date },
    budget: { type: Number },
    budgetCap: { type: Number },
    targetSegment: { type: Schema.Types.Mixed },
    targetAudience: { type: Schema.Types.Mixed },
    rewardValue: { type: Number },
    rewardType: { type: String },
    durationDays: { type: Number },
    source: { type: String },
    conditions: { type: Schema.Types.Mixed },
    actions: { type: [Schema.Types.Mixed] },
    triggers: { type: [Schema.Types.Mixed] },
    priority: { type: Number },
    cooldownDays: { type: Number },
    metadata: { type: Schema.Types.Mixed },
  },
  // CRIT-004 FIX: Changed from strict: true to strict: true (default)
  // With strict: true, arbitrary fields could be persisted without validation.
  // This was mitigated at the route layer with explicit field validation (campaigns.ts).
  // strict: true prevents unknown fields from being saved to the database.
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, storeId: 1 });
export const CampaignRule = mongoose.models.CampaignRule || mongoose.model('CampaignRule', s, 'campaignrules');
