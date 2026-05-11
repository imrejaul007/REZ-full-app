import mongoose, { Schema } from 'mongoose';

const schema = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    poNumber: { type: String },
    supplier: { type: Schema.Types.Mixed },
    items: { type: [Schema.Types.Mixed] },
    status: { type: String, default: 'draft' },
    notes: { type: String },
    expectedDeliveryDate: { type: Date },
    shippingAddress: { type: Schema.Types.Mixed },
    paymentTerms: { type: String },
    reference: { type: String },
    receivedAt: { type: Date },
    receivedItems: { type: [Schema.Types.Mixed] },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'purchaseorders' },
);
schema.index({ merchantId: 1, status: 1 });
schema.index({ merchantId: 1, createdAt: -1 });

export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', schema);
