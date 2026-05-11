import mongoose, { Schema } from 'mongoose';

const schema = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: Schema.Types.Mixed },
    contactPerson: { type: String },
    gstNumber: { type: String },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'suppliers' },
);
schema.index({ merchantId: 1, isDeleted: 1 });

export const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', schema);
