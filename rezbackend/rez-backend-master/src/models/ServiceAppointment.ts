import { logger } from '../config/logger';
import * as crypto from 'crypto';
// ServiceAppointment Model
// Tracks service appointments for stores (salons, spas, consultations, etc.)

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ITreatmentNotes {
  colourFormula?: string;
  stylistNotes?: string;
  productsUsed?: string[];
  resultRating?: number;
  clientVisibleNotes?: string;
  photos?: {
    before?: string;
    after?: string;
  };
}

export interface IRecurrence {
  enabled: boolean;
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endType: 'never' | 'after' | 'on_date';
  occurrences?: number;
  endDate?: Date;
  seriesId?: string;
  seriesIndex: number;
  isException: boolean;
}

export interface IAdditionalService {
  serviceId?: Types.ObjectId;
  serviceName: string;
  duration: number;
  price?: number;
  staffId?: Types.ObjectId;
  staffName?: string;
  order: number;
}

export interface IServiceAppointment extends Document {
  _id: Types.ObjectId;
  appointmentNumber: string;
  store: Types.ObjectId;
  user: Types.ObjectId;
  serviceType: string;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number; // in minutes
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  specialInstructions?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  staffMember?: string; // Legacy field for backward compatibility
  staffId?: Types.ObjectId; // New field: reference to MerchantUser
  staffName?: string; // New field: denormalized staff name for display speed
  recurrence?: IRecurrence;
  // Deposit / upfront payment fields
  depositAmount?: number;
  depositPaymentId?: string;
  depositStatus?: 'none' | 'pending' | 'paid' | 'refunded';
  // Cancellation policy fields
  cancellationPolicy?: {
    freeCancellationHours?: number;
    lateCancellationFee?: 'none' | 'partial' | 'full';
    feePercentage?: number;
  };
  // No-show tracking
  noShowFeeCharged?: boolean;
  noShowFeeAmount?: number;
  noShowFeeChargedAt?: Date;
  noShowMarkedAt?: Date;
  treatmentNotes?: ITreatmentNotes;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  rebookingNudgeSent?: boolean;
  // Audit / notification tracking fields
  statusHistory?: Array<{ status: string; timestamp: Date; note?: string }>;
  reminder24hSent?: boolean;
  reminder1hSent?: boolean;
  reviewRequestSent?: boolean;
  // Group booking fields - FEAT-06
  groupBookingId?: Types.ObjectId;
  isGroupLead?: boolean;
  groupSize?: number;
  guestName?: string;
  guestPhone?: string;
  // Buffer / cleanup time after service (minutes)
  bufferTimeAfter?: number;
  // Staff-level pricing fields - TASK 4
  price?: number;
  staffPriceOverride?: boolean;
  // Tip tracking - TASK 5
  tip?: number;
  tipPaymentId?: string;
  // Multi-service support
  additionalServices?: IAdditionalService[];
  totalDuration?: number;
  totalPrice?: number;
  // Room assignment
  roomId?: Types.ObjectId;
  roomName?: string;
  // No-show Protection fields
  depositRequired?: boolean;
  noShowProtection?: {
    hoursNotice?: number;
    lateFee?: number;
    lateFeeType?: 'fixed' | 'percentage';
  };
  // Virtual properties
  formattedDateTime?: string;
  // Instance methods
  updateStatus(
    newStatus: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show',
  ): Promise<IServiceAppointment>;
  cancel(reason?: string): Promise<IServiceAppointment>;
  confirm(): Promise<IServiceAppointment>;
}

const ServiceAppointmentSchema = new Schema(
  {
    appointmentNumber: {
      type: String,
      unique: true,
      required: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceType: {
      type: String,
      required: true,
      trim: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
      trim: true,
      // Format: "HH:MM" (e.g., "14:30")
    },
    duration: {
      type: Number,
      required: true,
      default: 60,
      min: 15,
      max: 480, // max 8 hours
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    staffMember: {
      type: String,
      trim: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'MerchantUser',
      required: false,
    },
    staffName: {
      type: String,
      trim: true,
    },
    confirmedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, trim: true },
      },
    ],
    reminder24hSent: {
      type: Boolean,
      default: false,
    },
    reminder1hSent: {
      type: Boolean,
      default: false,
    },
    reviewRequestSent: {
      type: Boolean,
      default: false,
    },
    rebookingNudgeSent: {
      type: Boolean,
      default: false,
    },
    // Deposit / upfront payment fields
    depositAmount: {
      type: Number,
      default: 0,
    },
    depositPaymentId: {
      type: String,
    },
    depositStatus: {
      type: String,
      enum: ['none', 'pending', 'paid', 'refunded'],
      default: 'none',
    },
    // Cancellation policy (snapshot at booking time)
    cancellationPolicy: {
      freeCancellationHours: { type: Number, default: 24 },
      lateCancellationFee: { type: String, enum: ['none', 'partial', 'full'], default: 'none' },
      feePercentage: { type: Number, default: 0 },
    },
    // No-show tracking
    noShowFeeCharged: {
      type: Boolean,
      default: false,
    },
    noShowFeeAmount: {
      type: Number,
    },
    noShowFeeChargedAt: {
      type: Date,
    },
    noShowMarkedAt: {
      type: Date,
    },
    treatmentNotes: {
      colourFormula: { type: String },
      stylistNotes: { type: String },
      productsUsed: [{ type: String }],
      resultRating: { type: Number, min: 1, max: 5 },
      clientVisibleNotes: { type: String },
      photos: {
        before: { type: String },
        after: { type: String },
      },
    },
    // Group booking fields - FEAT-06
    groupBookingId: {
      type: Schema.Types.ObjectId,
    },
    isGroupLead: {
      type: Boolean,
      default: false,
    },
    groupSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    guestName: {
      type: String,
      trim: true,
    },
    guestPhone: {
      type: String,
      trim: true,
    },
    // Buffer time after service (cleanup/processing) in minutes - TASK 2
    bufferTimeAfter: {
      type: Number,
      default: 0,
      min: 0,
      max: 120,
    },
    // Staff-level pricing - TASK 4
    price: {
      type: Number,
      min: 0,
    },
    staffPriceOverride: {
      type: Boolean,
      default: false,
    },
    // Tip tracking - TASK 5
    tip: {
      type: Number,
      min: 0,
    },
    tipPaymentId: {
      type: String,
    },
    // No-show Protection fields
    depositRequired: {
      type: Boolean,
      default: false,
    },
    noShowProtection: {
      hoursNotice: { type: Number, default: 24 },
      lateFee: { type: Number, default: 0 },
      lateFeeType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    },
    // Multi-service support
    additionalServices: [
      {
        serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
        serviceName: { type: String, required: true },
        duration: { type: Number, default: 0 },
        price: { type: Number },
        staffId: { type: Schema.Types.ObjectId, ref: 'User' },
        staffName: { type: String },
        order: { type: Number, default: 0 },
        _id: false,
      },
    ],
    totalDuration: { type: Number },
    totalPrice: { type: Number },
    // Room assignment
    roomId: { type: Schema.Types.ObjectId, ref: 'TreatmentRoom' },
    roomName: { type: String },
    // Recurring appointments
    recurrence: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'] },
      interval: { type: Number, default: 1 },
      daysOfWeek: [{ type: Number, min: 0, max: 6 }],
      endType: { type: String, enum: ['never', 'after', 'on_date'], default: 'never' },
      occurrences: { type: Number },
      endDate: { type: Date },
      seriesId: { type: String },
      seriesIndex: { type: Number, default: 0 },
      isException: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Auto-compute totalDuration and totalPrice from additionalServices
ServiceAppointmentSchema.pre('save', function (next) {
  if (this.additionalServices && this.additionalServices.length > 0) {
    const extraDuration = this.additionalServices.reduce((s, a) => s + (a.duration || 0), 0);
    const extraPrice = this.additionalServices.reduce((s, a) => s + (a.price || 0), 0);
    this.totalDuration = (this.duration || 0) + extraDuration;
    this.totalPrice = (this.price || 0) + extraPrice;
  }
  next();
});

// Compound Indexes for better query performance - SCALEPILOT OPTIMIZED
// Critical indexes for appointment queries
ServiceAppointmentSchema.index({ user: 1, appointmentDate: -1 });
ServiceAppointmentSchema.index({ store: 1, appointmentDate: 1, status: 1 }); // availability check
ServiceAppointmentSchema.index({ staffId: 1, appointmentDate: 1 }); // staff calendar
ServiceAppointmentSchema.index({ status: 1, appointmentDate: 1 }); // reminder job queries

// For reminder cron jobs
ServiceAppointmentSchema.index({
  reminder24hSent: 1,
  reminder1hSent: 1,
  appointmentDate: 1,
  status: 1,
});

// Appointment review-request job: { status:"completed", completedAt:range, reviewRequestSent:$ne true }
ServiceAppointmentSchema.index({ status: 1, completedAt: 1, reviewRequestSent: 1 });

// Recurring series lookup
ServiceAppointmentSchema.index({ 'recurrence.seriesId': 1, 'recurrence.seriesIndex': 1 });

// Legacy indexes (kept for backward compatibility)
ServiceAppointmentSchema.index({ store: 1, appointmentDate: 1 });
ServiceAppointmentSchema.index({ user: 1, status: 1 });
ServiceAppointmentSchema.index({ user: 1, createdAt: -1 });
ServiceAppointmentSchema.index({ store: 1, status: 1, appointmentDate: 1 });
ServiceAppointmentSchema.index({ appointmentDate: 1, status: 1 });

// Virtual: Formatted date and time
ServiceAppointmentSchema.virtual('formattedDateTime').get(function (this: IServiceAppointment) {
  const date = new Date(this.appointmentDate);
  const dateStr = date.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return `${dateStr} at ${this.appointmentTime}`;
});

// Static method: Generate appointment number
ServiceAppointmentSchema.statics.generateAppointmentNumber = async function (): Promise<string> {
  const timestamp = Date.now();
  const random = crypto.randomUUID().replace('-', '').substring(0, 4);
  return `SA-${timestamp}-${random}`;
};

// Static method: Find appointment by appointment number
ServiceAppointmentSchema.statics.findByAppointmentNumber = async function (
  appointmentNumber: string,
): Promise<IServiceAppointment | null> {
  return this.findOne({ appointmentNumber })
    .populate('store', 'name logo location contact')
    .populate('user', 'profile.firstName profile.lastName profile.phoneNumber profile.email')
    .lean();
};

// Static method: Get store's appointments
ServiceAppointmentSchema.statics.findStoreAppointments = async function (
  storeId: Types.ObjectId,
  date?: Date,
): Promise<IServiceAppointment[]> {
  const query: any = { store: storeId };

  if (date) {
    // Get appointments for specific date
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    query.appointmentDate = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  return this.find(query)
    .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .lean();
};

// Static method: Get user's appointments
ServiceAppointmentSchema.statics.findUserAppointments = async function (
  userId: Types.ObjectId,
): Promise<IServiceAppointment[]> {
  return this.find({ user: userId })
    .populate('store', 'name logo location contact operationalInfo')
    .sort({ appointmentDate: -1, createdAt: -1 })
    .lean();
};

// Static method: Check availability for a time slot
ServiceAppointmentSchema.statics.checkAvailability = async function (
  storeId: Types.ObjectId,
  date: Date,
  time: string,
  duration: number = 60,
  staffId?: Types.ObjectId,
): Promise<boolean> {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Build query — optionally scoped to a specific staff member
  const apptQuery: any = {
    store: storeId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed', 'in_progress'] },
  };
  if (staffId) apptQuery.staffId = staffId;

  // Fetch all appointments + blocked slots for the day in parallel
  const { BlockedSlot } = require('./BlockedSlot');
  const blockedQuery: any = {
    storeId,
    date: { $gte: startOfDay, $lte: endOfDay },
  };

  const [appointments, blockedSlots] = await Promise.all([
    this.find(apptQuery).lean(),
    BlockedSlot.find(blockedQuery).lean(),
  ]);

  // Parse requested time window in minutes from midnight
  const [reqHour, reqMin] = time.split(':').map(Number);
  const reqStartTime = reqHour * 60 + reqMin;
  const reqEndTime = reqStartTime + duration;
  const reqEndStr = `${String(Math.floor(reqEndTime / 60)).padStart(2, '0')}:${String(reqEndTime % 60).padStart(2, '0')}`;

  // Check blocked slots first (all-day or window overlap)
  for (const blocked of blockedSlots) {
    if ((blocked as any).isAllDay) return false;
    if (time < (blocked as any).endTime && reqEndStr > (blocked as any).startTime) return false;
  }

  // Check appointment conflicts (include bufferTimeAfter in effective end time)
  for (const appt of appointments) {
    const [apptHour, apptMin] = appt.appointmentTime.split(':').map(Number);
    const apptStartTime = apptHour * 60 + apptMin;
    const apptEffectiveEnd = apptStartTime + appt.duration + (appt.bufferTimeAfter || 0);

    if (
      (reqStartTime >= apptStartTime && reqStartTime < apptEffectiveEnd) ||
      (reqEndTime > apptStartTime && reqEndTime <= apptEffectiveEnd) ||
      (reqStartTime <= apptStartTime && reqEndTime >= apptEffectiveEnd)
    ) {
      return false;
    }
  }

  return true;
};

// Static method: Get all time slots for a day in one pass (avoids N+1)
ServiceAppointmentSchema.statics.getAvailableTimeSlots = async function (
  storeId: Types.ObjectId,
  date: Date,
  duration: number,
  storeHours: { start: string; end: string },
  staffId?: Types.ObjectId,
): Promise<Array<{ time: string; available: boolean }>> {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const apptQuery: any = {
    store: storeId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed', 'in_progress'] },
  };
  if (staffId) apptQuery.staffId = staffId;

  const { BlockedSlot } = require('./BlockedSlot');
  const [appointments, blockedSlots] = await Promise.all([
    this.find(apptQuery).lean(),
    BlockedSlot.find({ storeId, date: { $gte: startOfDay, $lte: endOfDay } }).lean(),
  ]);

  const [openHour, openMin] = storeHours.start.split(':').map(Number);
  const [closeHour, closeMin] = storeHours.end.split(':').map(Number);
  const storeOpenTime = openHour * 60 + openMin;
  const storeCloseTime = closeHour * 60 + closeMin;

  const slots: Array<{ time: string; available: boolean }> = [];

  // Use `time + duration <= storeCloseTime` so the last slot doesn't extend past closing
  for (let time = storeOpenTime; time + duration <= storeCloseTime; time += 30) {
    const startHour = Math.floor(time / 60);
    const startMin = time % 60;
    const endTime = time + duration;
    const endHour = Math.floor(endTime / 60);
    const endMin = endTime % 60;
    const slotStart = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
    const slotEnd = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    let available = true;

    // Check blocked slots
    for (const blocked of blockedSlots) {
      if ((blocked as any).isAllDay) {
        available = false;
        break;
      }
      if (slotStart < (blocked as any).endTime && slotEnd > (blocked as any).startTime) {
        available = false;
        break;
      }
    }

    // Check appointment conflicts (include bufferTimeAfter in effective end time)
    if (available) {
      for (const appt of appointments) {
        const [apptHour, apptMin] = appt.appointmentTime.split(':').map(Number);
        const apptStart = apptHour * 60 + apptMin;
        const apptEffectiveEnd = apptStart + appt.duration + (appt.bufferTimeAfter || 0);
        if (
          (time >= apptStart && time < apptEffectiveEnd) ||
          (endTime > apptStart && endTime <= apptEffectiveEnd) ||
          (time <= apptStart && endTime >= apptEffectiveEnd)
        ) {
          available = false;
          break;
        }
      }
    }

    slots.push({ time: slotStart, available });
  }

  return slots;
};

// Instance method: Update status
ServiceAppointmentSchema.methods.updateStatus = async function (
  newStatus: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show',
): Promise<IServiceAppointment> {
  this.status = newStatus;

  if (newStatus === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = new Date();
  } else if (newStatus === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  } else if (newStatus === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  } else if (newStatus === 'no_show' && !this.noShowMarkedAt) {
    this.noShowMarkedAt = new Date();
  }

  await this.save();

  logger.info(`✅ Appointment ${this.appointmentNumber} status updated to: ${newStatus}`);
  return this as IServiceAppointment;
};

// Instance method: Cancel appointment
ServiceAppointmentSchema.methods.cancel = async function (reason?: string): Promise<IServiceAppointment> {
  this.status = 'cancelled';
  this.cancelledAt = new Date();

  if (reason) {
    this.cancellationReason = reason;
  }

  // Append to audit trail (mirrors updateStatus behaviour)
  if (!this.statusHistory) this.statusHistory = [];
  this.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: reason || 'Cancelled by user',
  });

  await this.save();

  logger.info(`✅ Appointment ${this.appointmentNumber} cancelled`);
  return this as IServiceAppointment;
};

// Instance method: Confirm appointment
ServiceAppointmentSchema.methods.confirm = async function (): Promise<IServiceAppointment> {
  this.status = 'confirmed';
  this.confirmedAt = new Date();

  await this.save();

  logger.info(`✅ Appointment ${this.appointmentNumber} confirmed`);
  return this as IServiceAppointment;
};

/** Static methods available on the ServiceAppointment model */
export interface IServiceAppointmentModel extends Model<IServiceAppointment> {
  generateAppointmentNumber(): Promise<string>;
  findByAppointmentNumber(appointmentNumber: string): Promise<IServiceAppointment | null>;
  findStoreAppointments(storeId: Types.ObjectId, date?: Date): Promise<IServiceAppointment[]>;
  findUserAppointments(userId: Types.ObjectId): Promise<IServiceAppointment[]>;
  checkAvailability(
    storeId: Types.ObjectId,
    date: Date,
    time: string,
    duration?: number,
    staffId?: Types.ObjectId,
  ): Promise<boolean>;
  getAvailableTimeSlots(
    storeId: Types.ObjectId,
    date: Date,
    duration: number,
    storeHours: { start: string; end: string },
    staffId?: Types.ObjectId,
  ): Promise<Array<{ time: string; available: boolean }>>;
}

export const ServiceAppointment = mongoose.model<IServiceAppointment, IServiceAppointmentModel>(
  'ServiceAppointment',
  ServiceAppointmentSchema,
);
