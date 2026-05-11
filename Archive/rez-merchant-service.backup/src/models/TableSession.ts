import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    storeId: { type: Schema.Types.Mixed, required: true },
    tableId: { type: Schema.Types.Mixed },
    merchantId: { type: Schema.Types.Mixed },
    guestCount: { type: Number },
    status: { type: String, default: 'open' },
    openedAt: { type: Date },
    closedAt: { type: Date },
    items: { type: [Schema.Types.Mixed] },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ storeId: 1, tableId: 1, status: 1 });
export const TableSession = mongoose.models.TableSession || mongoose.model('TableSession', s, 'tablesessions');
