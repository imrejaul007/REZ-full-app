/**
 * Canonical Booking types for the REZ platform.
 *
 * Source of truth (backend models):
 *   rezbackend/src/models/TableBooking.ts
 *   rezbackend/src/models/ServiceBooking.ts
 *   rezbackend/src/models/EventBooking.ts
 *   rezbackend/src/models/OtaBooking.ts
 *   rezbackend/src/models/TrialBooking.ts
 *
 * Uses a discriminated union (AnyBooking) so consumers can type-narrow
 * with a simple switch on `bookingType`.
 *
 * Do NOT redefine these types in frontend apps — import from @rez/shared instead.
 */
export type BookingType = 'table' | 'service' | 'event' | 'ota' | 'trial';
/** Backend sends suffixed values ('table_booking', etc.). Normalize to canonical short form. */
export declare function normalizeBookingType(raw: string): BookingType;
export type BookingStatus = 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'refunded' | 'expired';
export interface BaseBooking {
    _id: string;
    bookingNumber: string;
    status: BookingStatus;
    bookingType: BookingType;
    userId: string;
    storeId?: string;
    createdAt: string;
    updatedAt: string;
}
export interface TableBooking extends BaseBooking {
    bookingType: 'table';
    partySize: number;
    /** ISO date string — the date of the reservation */
    appointmentDate: string;
    /** HH:MM (24-hour format) */
    appointmentTime: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    specialRequests?: string;
    cancellationReason?: string;
}
export interface ServiceBooking extends BaseBooking {
    bookingType: 'service';
    serviceId: string;
    /** ISO date string */
    bookingDate: string;
    timeSlot: {
        start: string;
        end: string;
    };
    duration: number;
    serviceType: 'home' | 'store' | 'online';
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerNotes?: string;
    pricing?: {
        basePrice: number;
        total: number;
        currency: string;
        cashbackEarned?: number;
    };
    paymentStatus?: 'pending' | 'paid' | 'partial' | 'refunded' | 'failed';
    cancellationReason?: string;
    cancelledBy?: 'user' | 'merchant' | 'system';
}
export interface EventBooking extends BaseBooking {
    bookingType: 'event';
    eventId: string;
    slotId?: string;
    ticketTypeId?: string;
    quantity: number;
    /** ISO date string — when the booking was made */
    bookingDate: string;
    amount: number;
    currency: string;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    bookingReference: string;
    attendeeInfo: {
        name: string;
        email: string;
        phone?: string;
        age?: number;
        specialRequirements?: string;
    };
    qrCode?: string;
    checkInTime?: string;
    checkOutTime?: string;
}
export interface OtaBooking extends BaseBooking {
    bookingType: 'ota';
    hotelId: string;
    /** ISO date string */
    checkIn: string;
    /** ISO date string */
    checkOut: string;
    /** Amount in paise (INR ×100) */
    amountPaise: number;
}
export interface TrialBooking extends BaseBooking {
    bookingType: 'trial';
    trialId: string;
    merchantId: string;
    qrHash: string;
    qrExpiresAt: string;
    commitmentFeePaid: number;
    commitmentFeePaymentId: string;
    geoAtBooking: {
        lat: number;
        lng: number;
    };
    geoAtScan?: {
        lat: number;
        lng: number;
    };
    completedAt?: string;
    rewardCredited: boolean;
    rating?: number;
    reviewText?: string;
    reviewedAt?: string;
}
export type AnyBooking = TableBooking | ServiceBooking | EventBooking | OtaBooking | TrialBooking;
export declare function isTableBooking(booking: AnyBooking): booking is TableBooking;
export declare function isServiceBooking(booking: AnyBooking): booking is ServiceBooking;
export declare function isEventBooking(booking: AnyBooking): booking is EventBooking;
export declare function isOtaBooking(booking: AnyBooking): booking is OtaBooking;
export declare function isTrialBooking(booking: AnyBooking): booking is TrialBooking;
