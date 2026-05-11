import mongoose, { Document, Schema } from 'mongoose';

export interface ITableSessionItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  course?: 'starter' | 'main' | 'dessert';
  modifiers?: Array<{ name: string; price: number }>;
}

export interface ITableSession extends Document {
  merchantId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  userId?: string; // The user who opened the session
  tableId: string; // tableNumber as string
  tableNumber: number;
  sessionToken?: string; // Short token for QR code scanning
  customerPhone?: string;
  customerName?: string;
  guestCount?: number;
  items: ITableSessionItem[];
  orders?: mongoose.Types.ObjectId[]; // Linked order IDs
  subtotal?: number;
  total?: number;
  status: 'open' | 'billed' | 'bill_requested' | 'paid' | 'closed';
  openedAt: Date;
  closedAt?: Date;
  billId?: mongoose.Types.ObjectId;
  totalAmount: number;
  // Payment fields set when session is paid
  paymentId?: string;
  paymentMethod?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TableSessionItemSchema = new Schema<ITableSessionItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    course: { type: String, enum: ['starter', 'main', 'dessert'], default: 'main' },
    modifiers: [{ name: String, price: Number }],
  },
  { _id: false },
);

const TableSessionSchema = new Schema<ITableSession>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    tableId: { type: String, required: true },
    tableNumber: { type: Number, required: true },
    customerPhone: String,
    customerName: String,
    guestCount: Number,
    items: [TableSessionItemSchema],
    status: { type: String, enum: ['open', 'billed', 'closed'], default: 'open' },
    openedAt: { type: Date, default: Date.now },
    closedAt: Date,
    billId: { type: Schema.Types.ObjectId, ref: 'StorePayment' },
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Indexes for fast lookup
TableSessionSchema.index({ storeId: 1, status: 1 });
TableSessionSchema.index({ storeId: 1, tableId: 1, status: 1 });

// Partial unique index: prevents two OPEN sessions for the same table in the same store
TableSessionSchema.index({ storeId: 1, tableId: 1 }, { unique: true, partialFilterExpression: { status: 'open' } });

export const TableSession = mongoose.model<ITableSession>('TableSession', TableSessionSchema);
export default TableSession;
