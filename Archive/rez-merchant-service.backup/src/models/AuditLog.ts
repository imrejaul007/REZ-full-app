import mongoose, { Schema } from 'mongoose';

const schema = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    merchantUserId: { type: Schema.Types.Mixed },
    action: { type: String },
    resourceType: { type: String },
    resourceId: { type: String },
    severity: { type: String },
    details: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'auditlogs' },
);
schema.index({ merchantId: 1, createdAt: -1 });
schema.index({ resourceType: 1, resourceId: 1 });
schema.index({ merchantId: 1, action: 1 });
schema.index({ resourceId: 1, createdAt: -1 });
schema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', schema);
