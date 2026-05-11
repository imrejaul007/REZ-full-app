import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed },
    storeId: { type: Schema.Types.Mixed, required: true },
    name: { type: String },
    tables: { type: [Schema.Types.Mixed] },
    sections: { type: [Schema.Types.Mixed] },
    dimensions: { type: Schema.Types.Mixed },
    status: { type: String },
    isActive: { type: Boolean },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ storeId: 1 });
export const FloorPlan = mongoose.models.FloorPlan || mongoose.model('FloorPlan', s, 'floorplans');
