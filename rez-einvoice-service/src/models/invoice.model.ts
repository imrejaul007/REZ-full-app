import mongoose, { Schema, Document } from 'mongoose';

// GST Rate type
export type GstRate = 0 | 0.25 | 3 | 5 | 12 | 18 | 28;

// Invoice status enum
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  MODIFIED = 'MODIFIED'
}

// Supply type
export enum SupplyType {
  B2B = 'B2B',
  B2C = 'B2C',
  EXPORT = 'EXPORT',
  SEZ = 'SEZ',
  DEEMED_EXPORT = 'DEEMED_EXPORT'
}

// Document reference types
export interface IDocumentRef {
  documentType: string;
  documentNumber: string;
  documentDate: string;
}

// Party address interface
export interface IPartyAddress {
  gstin: string;
  legalName?: string;
  tradeName?: string;
  address1: string;
  address2?: string;
  location: string;
  pincode: string;
  stateCode: string;
  countryCode: string;
}

// Item HSN code interface
export interface IItemHsn {
  hsnCode: string;
  quantity?: number;
  unit?: string;
  unitPrice: number;
  grossAmount: number;
  taxableAmount: number;
  igstRate: GstRate;
  cgstRate?: GstRate;
  sgstRate?: GstRate;
  cessRate?: number;
  cessAdvol?: number;
}

// Shipping address interface
export interface IShippingAddress {
  gstin?: string;
  legalName?: string;
  address1: string;
  address2?: string;
  location: string;
  pincode: string;
  stateCode: string;
  countryCode: string;
}

// Payment terms interface
export interface IPaymentTerms {
  mode: string;
  creditPeriod?: string;
  payableAmount?: number;
  bankAccountNumber?: string;
  bankName?: string;
}

// E-invoice schema interface
export interface IEinvoice extends Document {
  // Header fields
  irn: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: string;
  supplyType: SupplyType;

  // Document reference
  documentRef: IDocumentRef;

  // Seller details
  seller: IPartyAddress;

  // Buyer details
  buyer: IPartyAddress;

  // Shipping details
  shipping: IShippingAddress;

  // Dispatch from
  dispatchFrom: IPartyAddress;

  // Items
  items: IItemHsn[];

  // Value details
  totalTaxableValue: number;
  totalIgst: number;
  totalCgst: number;
  totalSgst: number;
  totalCess: number;
  totalCessAdvol: number;
  totalInvoiceValue: number;
  totalInvoiceValueInWords: string;

  // E-waybill fields
  ewaybillNumber?: string;
  ewaybillDate?: string;
  ewaybillValidUntil?: string;
  distance?: number;
  transportMode?: string;
  transportId?: string;
  vehicleNumber?: string;

  // QR Code
  qrCode?: string;
  qrCodeBase64?: string;

  // Status and metadata
  status: InvoiceStatus;
  ackNumber?: number;
  ackDate?: string;
  cancellationReason?: string;
  cancellationRemark?: string;
  modifiedReason?: string;
  modifiedDescription?: string;

  // Original IRN (for modified invoices)
  originalIrn?: string;

  // API response data
  apiResponse?: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Versioning
  version: number;
}

// Seller address schema
const PartyAddressSchema = new Schema<IPartyAddress>({
  gstin: { type: String, required: true },
  legalName: { type: String },
  tradeName: { type: String },
  address1: { type: String, required: true },
  address2: { type: String },
  location: { type: String, required: true },
  pincode: { type: String, required: true },
  stateCode: { type: String, required: true },
  countryCode: { type: String, default: 'IN' }
}, { _id: false });

// Item HSN schema
const ItemHsnSchema = new Schema<IItemHsn>({
  hsnCode: { type: String, required: true },
  quantity: { type: Number },
  unit: { type: String },
  unitPrice: { type: Number, required: true },
  grossAmount: { type: Number, required: true },
  taxableAmount: { type: Number, required: true },
  igstRate: { type: Number, required: true },
  cgstRate: { type: Number },
  sgstRate: { type: Number },
  cessRate: { type: Number },
  cessAdvol: { type: Number }
}, { _id: false });

// Document reference schema
const DocumentRefSchema = new Schema<IDocumentRef>({
  documentType: { type: String, required: true },
  documentNumber: { type: String, required: true },
  documentDate: { type: String, required: true }
}, { _id: false });

// Shipping address schema
const ShippingAddressSchema = new Schema<IShippingAddress>({
  gstin: { type: String },
  legalName: { type: String },
  address1: { type: String, required: true },
  address2: { type: String },
  location: { type: String, required: true },
  pincode: { type: String, required: true },
  stateCode: { type: String, required: true },
  countryCode: { type: String, default: 'IN' }
}, { _id: false });

// Payment terms schema
const PaymentTermsSchema = new Schema<IPaymentTerms>({
  mode: { type: String, required: true },
  creditPeriod: { type: String },
  payableAmount: { type: Number },
  bankAccountNumber: { type: String },
  bankName: { type: String }
}, { _id: false });

// Main E-invoice schema
const EinvoiceSchema = new Schema<IEinvoice>({
  // IRN - Invoice Reference Number (unique identifier)
  irn: { type: String, unique: true, sparse: true, index: true },

  // Invoice details
  invoiceNumber: { type: String, required: true, index: true },
  invoiceDate: { type: String, required: true },
  invoiceType: { type: String, required: true, default: 'INV' },
  supplyType: {
    type: String,
    enum: Object.values(SupplyType),
    required: true,
    default: SupplyType.B2B
  },

  // Document reference
  documentRef: { type: DocumentRefSchema, required: true },

  // Party details
  seller: { type: PartyAddressSchema, required: true },
  buyer: { type: PartyAddressSchema, required: true },
  shipping: { type: ShippingAddressSchema },
  dispatchFrom: { type: PartyAddressSchema },

  // Items
  items: { type: [ItemHsnSchema], required: true, validate: [arr => arr.length > 0, 'At least one item is required'] },

  // Value calculations
  totalTaxableValue: { type: Number, required: true },
  totalIgst: { type: Number, default: 0 },
  totalCgst: { type: Number, default: 0 },
  totalSgst: { type: Number, default: 0 },
  totalCess: { type: Number, default: 0 },
  totalCessAdvol: { type: Number, default: 0 },
  totalInvoiceValue: { type: Number, required: true },
  totalInvoiceValueInWords: { type: String },

  // E-waybill fields
  ewaybillNumber: { type: String, index: true },
  ewaybillDate: { type: String },
  ewaybillValidUntil: { type: String },
  distance: { type: Number },
  transportMode: { type: String },
  transportId: { type: String },
  vehicleNumber: { type: String },

  // QR Code
  qrCode: { type: String },
  qrCodeBase64: { type: String },

  // Status
  status: {
    type: String,
    enum: Object.values(InvoiceStatus),
    required: true,
    default: InvoiceStatus.DRAFT
  },
  ackNumber: { type: Number },
  ackDate: { type: String },

  // Cancellation and modification
  cancellationReason: { type: String },
  cancellationRemark: { type: String },
  modifiedReason: { type: String },
  modifiedDescription: { type: String },
  originalIrn: { type: String, ref: 'Einvoice' },

  // API response storage
  apiResponse: { type: Schema.Types.Mixed },

  // Version for optimistic locking
  version: { type: Number, default: 1 }
}, {
  timestamps: true,
  versionKey: 'version'
});

// Indexes for common queries
EinvoiceSchema.index({ 'seller.gstin': 1, invoiceDate: 1 });
EinvoiceSchema.index({ 'buyer.gstin': 1 });
EinvoiceSchema.index({ status: 1, createdAt: -1 });
EinvoiceSchema.index({ ewaybillNumber: 1 });

// Pre-save middleware for version increment
EinvoiceSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.version += 1;
  }
  next();
});

// Static method to find by IRN
EinvoiceSchema.statics.findByIrn = function(irn: string) {
  return this.findOne({ irn });
};

// Static method to find active invoices for a seller
EinvoiceSchema.statics.findActiveBySeller = function(gstin: string) {
  return this.find({
    'seller.gstin': gstin,
    status: { $in: [InvoiceStatus.GENERATED, InvoiceStatus.ACCEPTED] }
  });
};

// Static method to find invoices by date range
EinvoiceSchema.statics.findByDateRange = function(
  gstin: string,
  startDate: string,
  endDate: string
) {
  return this.find({
    'seller.gstin': gstin,
    invoiceDate: { $gte: startDate, $lte: endDate }
  }).sort({ invoiceDate: -1 });
};

export const EinvoiceModel = mongoose.model<IEinvoice>('Einvoice', EinvoiceSchema);
export { EinvoiceSchema };
