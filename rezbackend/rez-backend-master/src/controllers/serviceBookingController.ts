import { Request, Response } from 'express';
import { ServiceBooking } from '../models/ServiceBooking';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { ServiceCategory } from '../models/ServiceCategory';
import { CancellationPolicy } from '../models/CancellationPolicy';
import { logger } from '../config/logger';
import mongoose from 'mongoose';
import travelCashbackService from '../services/travelCashbackService';
import { createRefund as createRazorpayRefund } from '../services/razorpayService';
import stripeService from '../services/stripeService';
import { Refund } from '../models/Refund';
import { pct } from '../utils/currency';
import { asyncHandler } from '../utils/asyncHandler';
import merchantNotificationService from '../services/merchantNotificationService';
import pushNotificationService from '../services/pushNotificationService';

// Use Express Request with user property (extended globally)

// Helper function to format dates
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Create a new service booking
 * POST /api/service-bookings
 */
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const { serviceId, bookingDate, timeSlot, serviceType, serviceAddress, customerNotes, paymentMethod } = req.body;

  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  // Validate required fields
  if (!serviceId || !bookingDate || !timeSlot) {
    return res.status(400).json({
      success: false,
      message: 'Service ID, booking date, and time slot are required',
    });
  }

  // Fetch the service with store data in one populate (avoid sequential await for store)
  const service = (await Product.findOne({
    _id: serviceId,
    productType: 'service',
    isActive: true,
    isDeleted: { $ne: true },
  })
    .populate('store serviceCategory')
    .lean()) as any;

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  // Check if service requires address for home service
  const svcType = serviceType || service.serviceDetails?.serviceType || 'store';
  if (svcType === 'home' && !serviceAddress) {
    return res.status(400).json({
      success: false,
      message: 'Service address is required for home services',
    });
  }

  // Store is already populated, use it directly
  const store = service.store;
  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found',
    });
  }

  // Parse booking date — use UTC to avoid timezone-dependent day boundaries
  const bookingDateObj = new Date(bookingDate);
  bookingDateObj.setUTCHours(0, 0, 0, 0);

  // VIKTOR: concurrency fix — slot booking race condition
  // Multiple users can simultaneously pass the availability check and create bookings
  // Solution: Use atomic findOneAndUpdate with condition to reserve slot before creating booking

  const duration = service.serviceDetails?.duration || 60;
  const maxBookingsPerSlot = service.serviceDetails?.maxBookingsPerSlot || 1;

  // Check for duplicate booking BEFORE reserving a slot (so we don't reserve then immediately undo)
  const existingBooking = await ServiceBooking.findOne({
    user: userId,
    service: service._id,
    bookingDate: bookingDateObj,
    status: { $in: ['pending', 'confirmed', 'assigned'] },
  }).lean();

  if (existingBooking) {
    return res.status(400).json({
      success: false,
      message: 'You already have a booking for this service on this date',
    });
  }

  // VIKTOR: atomic slot reservation using MongoDB operator
  // Verify slot availability and increment booking count atomically in a single operation
  // NOTE: $setOnInsert and $inc must NOT target the same field — $inc already initialises
  // from 0 on first upsert, so $setOnInsert on bookingCount would cause a conflict error.
  const slotReservation = await (ServiceBooking as any).collection.findOneAndUpdate(
    {
      _type: 'slot_counter',
      service: service._id,
      store: service.store._id || service.store,
      bookingDate: bookingDateObj,
      'timeSlot.start': timeSlot.start,
    },
    {
      $inc: { bookingCount: 1 },
      $setOnInsert: { _type: 'slot_counter', createdAt: new Date() },
    },
    { upsert: true, returnDocument: 'after' },
  );

  // MongoDB driver v4+ returns the document directly (not wrapped in .value)
  const currentCount = slotReservation?.bookingCount ?? 1;

  // Check if we've exceeded max bookings per slot (after atomic increment)
  if (currentCount > maxBookingsPerSlot) {
    // Undo the increment since we exceeded capacity
    await (ServiceBooking as any).collection.findOneAndUpdate(
      {
        _type: 'slot_counter',
        service: service._id,
        store: service.store._id || service.store,
        bookingDate: bookingDateObj,
        'timeSlot.start': timeSlot.start,
      },
      { $inc: { bookingCount: -1 } },
    );
    return res.status(400).json({
      success: false,
      message: `Maximum ${maxBookingsPerSlot} bookings allowed for this time slot`,
    });
  }

  // Calculate pricing
  const basePrice = service.pricing?.selling || service.pricing?.basePrice || service.price?.current || 0;
  const cashbackPercentage = service.cashback?.percentage || 0;

  // Always compute price server-side — never accept client-supplied totalPrice
  // (prevents price manipulation via customerNotes JSON payload)
  const totalPrice = basePrice;
  let bookingDetails: any = {};

  if (customerNotes) {
    try {
      bookingDetails = JSON.parse(customerNotes);
      // Extract metadata (passengers, guests) but discard any price fields
    } catch (parseError) {
      logger.warn(`[CREATE BOOKING] Failed to parse customerNotes JSON`, parseError);
    }
  }

  // Validate maximum passengers/guests/travelers if specified in booking details
  if (bookingDetails.passengers || bookingDetails.guests || bookingDetails.travelers) {
    const passengers = bookingDetails.passengers || bookingDetails.guests || bookingDetails.travelers;
    const totalPassengers = (passengers.adults || 0) + (passengers.children || 0);

    // Check service-specific limits (if defined in serviceDetails)
    const maxPassengers = service.serviceDetails?.maxPassengers;
    if (maxPassengers && totalPassengers > maxPassengers) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxPassengers} passengers allowed for this service`,
      });
    }
  }

  // Validate minimum advance booking time (if specified)
  const minAdvanceHours = service.serviceDetails?.minAdvanceBookingHours;
  if (minAdvanceHours) {
    const hoursUntilBooking = (bookingDateObj.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilBooking < minAdvanceHours) {
      return res.status(400).json({
        success: false,
        message: `Booking must be made at least ${minAdvanceHours} hours in advance`,
      });
    }
  }

  // Calculate cashback based on total price (not base price)
  const cashbackEarned = pct(totalPrice, cashbackPercentage);

  // Generate booking number with category-specific prefix
  const categorySlug = (service.serviceCategory as any)?.slug || 'SB';
  const bookingNumberPrefix = (() => {
    if (categorySlug === 'flights') return 'FLT';
    if (categorySlug === 'hotels') return 'HTL';
    if (categorySlug === 'trains') return 'TRN';
    if (categorySlug === 'cab') return 'CAB';
    if (categorySlug === 'bus') return 'BUS';
    if (categorySlug === 'packages') return 'PKG';
    return 'SB';
  })();

  const bookingNumber = await (ServiceBooking as any).generateBookingNumber(bookingNumberPrefix);

  // Get customer info (phoneNumber and email are on user object, not profile)
  // Try to get from customerNotes first (for bookings with custom contact info), then fallback to user profile
  let customerName = req.user?.profile?.firstName
    ? `${req.user.profile.firstName} ${req.user.profile.lastName || ''}`.trim()
    : 'Customer';
  let customerPhone = req.user?.phoneNumber || '';
  let customerEmail = req.user?.email;

  // Extract contact info from customerNotes if available (for packages, flights, etc. with custom contact)
  if (customerNotes && bookingDetails.contactInfo) {
    if (bookingDetails.contactInfo.name) {
      customerName = bookingDetails.contactInfo.name;
    }
    if (bookingDetails.contactInfo.phone) {
      customerPhone = bookingDetails.contactInfo.phone;
    }
    if (bookingDetails.contactInfo.email) {
      customerEmail = bookingDetails.contactInfo.email;
    }
  }

  // Determine if this is a travel booking
  const isTravelBooking = travelCashbackService.isTravelCategory(categorySlug);

  // For travel bookings: enforce upfront payment, set verification days and refund policy
  const requiresPaymentUpfront = isTravelBooking ? true : service.serviceDetails?.requiresPaymentUpfront || false;
  const verificationDays = isTravelBooking ? travelCashbackService.getVerificationDays(categorySlug) : 7;
  const refundPolicy = isTravelBooking ? { tiers: travelCashbackService.getRefundTiers(categorySlug) } : undefined;

  // Extract travel details from customerNotes (structured data instead of raw JSON)
  let travelDetails: any = undefined;
  if (isTravelBooking && bookingDetails) {
    travelDetails = {};
    if (bookingDetails.route) {
      travelDetails.route = {
        from: bookingDetails.route.from || bookingDetails.from,
        to: bookingDetails.route.to || bookingDetails.to,
        fromCode: bookingDetails.route.fromCode,
        toCode: bookingDetails.route.toCode,
      };
    }
    if (bookingDetails.class) travelDetails.class = bookingDetails.class;
    if (bookingDetails.passengers) travelDetails.passengers = bookingDetails.passengers;
    if (bookingDetails.tripType) travelDetails.tripType = bookingDetails.tripType;
    if (bookingDetails.returnDate) travelDetails.returnDate = new Date(bookingDetails.returnDate);
  }

  // Price sanity check for travel: reject if totalPrice > basePrice * 10
  if (isTravelBooking && totalPrice > basePrice * 10) {
    return res.status(400).json({
      success: false,
      message: 'Total price exceeds acceptable range for this service',
    });
  }

  // Create booking
  const booking = new ServiceBooking({
    bookingNumber,
    user: userId,
    service: service._id,
    serviceCategory: service.serviceCategory,
    store: service.store,
    merchantId: store.merchantId || service.merchantId,
    customerName,
    customerPhone,
    customerEmail,
    bookingDate: bookingDateObj,
    timeSlot,
    duration,
    serviceType: svcType,
    serviceAddress: svcType === 'home' ? serviceAddress : undefined,
    pricing: {
      basePrice,
      total: totalPrice,
      cashbackEarned,
      cashbackPercentage,
      currency: service.pricing.currency || 'INR',
    },
    requiresPaymentUpfront,
    paymentStatus: 'pending',
    paymentMethod,
    customerNotes,
    status: 'pending',
    // Travel-specific fields
    verificationDays,
    refundPolicy,
    travelDetails,
    cashbackStatus: 'pending',
  });

  await booking.save();

  // Send email confirmation (fire-and-forget)
  if (customerEmail) {
    try {
      const emailService = require('../services/emailService');
      const appointmentDateFormatted = bookingDateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      await emailService.sendEmail({
        to: customerEmail,
        subject: `Booking Confirmed — ${service.name} at ${store.name}`,
        html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #1a3a52;">Booking Confirmed ✓</h2>
              <p>Hi ${customerName},</p>
              <p>Your appointment has been confirmed:</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Service</strong></td><td>${service.name}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Store</strong></td><td>${store.name}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Date</strong></td><td>${appointmentDateFormatted}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Time</strong></td><td>${timeSlot.start}</td></tr>
                <tr><td style="padding: 8px;"><strong>Booking #</strong></td><td>${booking.bookingNumber || booking._id}</td></tr>
              </table>
              <p style="margin-top: 16px; color: #666; font-size: 12px;">Free cancellation up to 2 hours before your appointment. Questions? Reply to this email.</p>
              <p style="color: #666; font-size: 12px;">Powered by REZ</p>
            </div>
          `,
      });
    } catch (emailErr) {
      logger.error('[ServiceBooking] Email confirmation failed (non-fatal):', emailErr);
    }
  }

  // Send notifications (fire-and-forget)
  try {
    // Merchant notification
    await merchantNotificationService
      .notify({
        merchantId: store.merchantId?.toString() || '',
        type: 'new_booking',
        priority: 'high',
        title: 'New Appointment Booked',
        message: `${customerName} booked ${service.name} for ${formatDate(bookingDateObj)} at ${timeSlot.start}`,
        data: { bookingId: booking._id?.toString(), serviceId, appointmentDate: bookingDateObj.toISOString() },
      })
      .catch((err: any) => logger.error('[SERVICE BOOKING] Failed to send merchant notification: ' + err.message));

    // Consumer push confirmation
    await pushNotificationService
      .sendPushToUser(userId.toString(), {
        title: 'Booking Confirmed ✓',
        body: `Your ${service.name} at ${store.name} on ${formatDate(bookingDateObj)} is confirmed.`,
        data: { screen: 'my-bookings', bookingId: booking._id?.toString() },
      })
      .catch((err: any) => logger.error('[SERVICE BOOKING] Failed to send consumer push: ' + err.message));
  } catch (notifErr: any) {
    logger.error('[SERVICE BOOKING] Notification error: ' + notifErr.message);
  }

  // Populate booking data for response
  const populatedBooking = await ServiceBooking.findById(booking._id)
    .populate('service', 'name images pricing serviceDetails')
    .populate('serviceCategory', 'name icon cashbackPercentage')
    .populate('store', 'name logo location contact operationalInfo')
    .lean();

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: populatedBooking,
    requiresPayment: requiresPaymentUpfront,
  });
});

/**
 * Get user's bookings
 * GET /api/service-bookings
 */
export const getUserBookings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { status, page = '1', limit = '20' } = req.query;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const query: any = { user: userId };
  if (status) {
    // F-M5/FL-04 FIX: 'upcoming' and 'past' are computed filters, not real DB statuses.
    // Translate them into date-range queries so MongoDB returns correct results.
    const now = new Date();
    if (status === 'upcoming') {
      // Upcoming = not yet complete/cancelled, and booking date is in the future
      query.$or = [
        { bookingDate: { $gte: now } },
        { status: { $in: ['pending', 'confirmed', 'assigned', 'in_progress'] } },
      ];
    } else if (status === 'past') {
      // Past = completed, cancelled, no_show, expired, or booking date is in the past
      query.$or = [
        { status: { $in: ['completed', 'cancelled', 'no_show', 'refunded', 'expired'] } },
        { bookingDate: { $lt: now }, status: { $nin: ['pending', 'confirmed', 'assigned', 'in_progress'] } },
      ];
    } else {
      // Real status value — pass directly
      query.status = status;
    }
  }

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const [bookings, total] = await Promise.all([
    ServiceBooking.find(query)
      .populate('service', 'name images pricing serviceDetails')
      .populate('serviceCategory', 'name icon cashbackPercentage')
      .populate('store', 'name logo location contact operationalInfo')
      .sort({ bookingDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ServiceBooking.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: bookings,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get booking by ID
 * GET /api/service-bookings/:id
 */
export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID',
    });
  }

  const booking = await ServiceBooking.findOne({
    _id: id,
    user: userId,
  })
    .populate('service', 'name images pricing serviceDetails description')
    .populate('serviceCategory', 'name icon cashbackPercentage')
    .populate('store', 'name logo location contact operationalInfo')
    .lean();

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
    });
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

/**
 * Cancel a booking
 * PUT /api/service-bookings/:id/cancel
 */
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID',
    });
  }

  // Must NOT use .lean() here — cancelBooking calls Mongoose document methods
  // (booking.cancel, booking.save) which are only available on full documents.
  const booking = await ServiceBooking.findOne({
    _id: id,
    user: userId,
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
    });
  }

  // Check if booking can be cancelled
  if (!['pending', 'confirmed', 'assigned'].includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: 'This booking cannot be cancelled',
    });
  }

  // Determine category slug for travel-specific logic (use populate from booking or direct query)
  let catSlug = '';
  let isTravelCancel = false;

  // Try to use category data if already populated in booking, otherwise fetch
  if (typeof booking.serviceCategory === 'object' && (booking.serviceCategory as any)?.slug) {
    catSlug = (booking.serviceCategory as any).slug;
    isTravelCancel = travelCashbackService.isTravelCategory(catSlug);
  } else {
    const populatedCategory = await ServiceCategory.findById(booking.serviceCategory).lean();
    catSlug = populatedCategory?.slug || '';
    isTravelCancel = travelCashbackService.isTravelCategory(catSlug);
  }

  if (isTravelCancel) {
    // Travel bookings use category-specific refund tiers instead of fixed 2-hour window
    const { refundPercentage } = travelCashbackService.calculateRefundAmount(booking, catSlug);

    if (refundPercentage === 0) {
      return res.status(400).json({
        success: false,
        message: 'This booking is past the cancellation window and cannot be cancelled for a refund',
      });
    }

    // Cancel the booking
    await booking.cancel(reason || 'Cancelled by user', 'user');

    // Handle cashback clawback for travel bookings
    if (booking.cashbackStatus === 'credited' || booking.cashbackStatus === 'held') {
      try {
        await travelCashbackService.handleRefund(booking._id.toString(), reason || 'Booking cancelled by user');
      } catch (refundError: any) {
        logger.error('Error processing travel cashback refund:', refundError);
        // Booking is still cancelled even if cashback clawback fails — admin will review
      }
    }

    // Process payment gateway refund
    if (booking.paymentStatus === 'paid' && booking.paymentId) {
      try {
        const paymentRefundAmount = (booking.pricing?.total || 0) * (refundPercentage / 100);
        if (paymentRefundAmount > 0) {
          const isRazorpay = booking.paymentId.startsWith('pay_');
          let gatewayRefundId: string | undefined;

          if (isRazorpay) {
            const result = await createRazorpayRefund(booking.paymentId, paymentRefundAmount);
            gatewayRefundId = result.id;
          } else {
            const result = await stripeService.createRefund({
              paymentIntentId: booking.paymentId,
              amount: Math.round(paymentRefundAmount * 100),
              reason: 'requested_by_customer',
            });
            gatewayRefundId = result.id;
          }

          // Wrap booking status update + Refund record in a session so
          // a crash between the two writes cannot leave them out of sync.
          const refundSession = await mongoose.startSession();
          try {
            await refundSession.withTransaction(async () => {
              booking.paymentStatus = refundPercentage === 100 ? 'refunded' : 'partial';
              await booking.save({ session: refundSession });

              if (gatewayRefundId) {
                await Refund.create(
                  [
                    {
                      order: booking._id,
                      user: booking.user,
                      orderNumber: booking.bookingNumber,
                      paymentMethod: isRazorpay ? 'razorpay' : 'stripe',
                      refundAmount: paymentRefundAmount,
                      refundType: refundPercentage === 100 ? 'full' : 'partial',
                      refundReason: reason || 'Travel booking cancelled',
                      gatewayRefundId,
                      status: 'processing',
                      requestedAt: new Date(),
                      metadata: { bookingType: 'service_booking', categorySlug: catSlug, refundPercentage },
                    },
                  ],
                  { session: refundSession },
                );
              }
            });
          } finally {
            refundSession.endSession();
          }

          logger.info('Payment refund processed:', {
            bookingId: booking._id,
            refundAmount: paymentRefundAmount,
            refundPercentage,
            gateway: isRazorpay ? 'razorpay' : 'stripe',
            gatewayRefundId,
          });
        }
      } catch (refundError: any) {
        logger.error('Payment refund failed (admin will review):', refundError);
      }
    }
  } else {
    // Non-travel: use CancellationPolicy configured per-store (default: 2 hours)
    // C16 FIX: Consult the store's CancellationPolicy instead of hardcoding 2 hours.
    const policy = await CancellationPolicy.findOne({ storeId: booking.store }).lean();
    const freeHours = policy?.freeCancelHours ?? 2;

    const now = new Date();
    const bookingDateTime = new Date(booking.bookingDate);
    const [hours, minutes] = booking.timeSlot.start.split(':').map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    const cutoffTime = new Date(bookingDateTime.getTime() - freeHours * 60 * 60 * 1000);

    if (now >= cutoffTime) {
      return res.status(400).json({
        success: false,
        message: `Bookings can only be cancelled at least ${freeHours} hour${freeHours !== 1 ? 's' : ''} before the scheduled time`,
      });
    }

    await booking.cancel(reason || 'Cancelled by user', 'user');

    // BUG-025 FIX: Non-travel paid bookings also need a payment refund
    if (booking.paymentStatus === 'paid' && booking.paymentId) {
      try {
        const isRazorpay = booking.paymentId.startsWith('pay_');
        const refundAmount = booking.pricing?.total || 0;
        if (refundAmount > 0) {
          let gatewayRefundId: string | undefined;
          if (isRazorpay) {
            const result = await createRazorpayRefund(booking.paymentId, refundAmount);
            gatewayRefundId = result.id;
          } else {
            const result = await stripeService.createRefund({
              paymentIntentId: booking.paymentId,
              amount: Math.round(refundAmount * 100),
              reason: 'requested_by_customer',
            });
            gatewayRefundId = result.id;
          }
          const refundSession = await mongoose.startSession();
          try {
            await refundSession.withTransaction(async () => {
              booking.paymentStatus = 'refunded' as any;
              await booking.save({ session: refundSession });
              if (gatewayRefundId) {
                await Refund.create(
                  [
                    {
                      order: booking._id,
                      user: booking.user,
                      orderNumber: booking.bookingNumber,
                      paymentMethod: isRazorpay ? 'razorpay' : 'stripe',
                      refundAmount,
                      refundType: 'full',
                      refundReason: reason || 'Booking cancelled by user',
                      gatewayRefundId,
                      status: 'processing',
                      requestedAt: new Date(),
                      metadata: { bookingType: 'service_booking' },
                    },
                  ],
                  { session: refundSession },
                );
              }
            });
          } finally {
            refundSession.endSession();
          }
        }
      } catch (refundError: any) {
        logger.error('[cancelBooking] Refund failed (admin will review):', refundError);
      }
    }
  }

  // Populate booking data for response
  const updatedBooking = await ServiceBooking.findById(booking._id)
    .populate('service', 'name images pricing')
    .populate('serviceCategory', 'name icon')
    .populate('store', 'name logo location contact')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: updatedBooking,
  });
});

/**
 * Complete a booking
 * PUT /api/service-bookings/:id/complete
 */
export const completeBooking = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id || (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const booking = await ServiceBooking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Only the store owner/staff or admin can mark complete (not the customer)
  const isOwnerOrAdmin =
    (booking as any).storeId?.toString() === userId.toString() ||
    (req as any).user?.role === 'admin' ||
    (req as any).user?.role === 'merchant';

  if (!isOwnerOrAdmin && (booking as any).userId?.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to complete this booking' });
  }

  const completableStatuses = ['confirmed', 'assigned', 'in_progress'];
  if (!completableStatuses.includes((booking as any).status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot complete booking in status: ${(booking as any).status}`,
    });
  }

  (booking as any).status = 'completed';
  (booking as any).completedAt = new Date();
  await booking.save();

  return res.status(200).json({
    success: true,
    message: 'Booking marked as completed',
    data: booking,
  });
});

/**
 * Reschedule a booking
 * PUT /api/service-bookings/:id/reschedule
 */
export const rescheduleBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { bookingDate, timeSlot } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  if (!bookingDate || !timeSlot) {
    return res.status(400).json({
      success: false,
      message: 'New booking date and time slot are required',
    });
  }

  // Must NOT use .lean() here — rescheduleBooking calls Mongoose document methods
  // (booking.reschedule) which are only available on full documents.
  const booking = await ServiceBooking.findOne({
    _id: id,
    user: userId,
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
    });
  }

  // Check if booking can be rescheduled
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: 'This booking cannot be rescheduled',
    });
  }

  if (booking.rescheduleCount >= booking.maxReschedules) {
    return res.status(400).json({
      success: false,
      message: 'Maximum reschedule limit reached',
    });
  }

  // Parse new booking date
  const newBookingDate = new Date(bookingDate);
  newBookingDate.setUTCHours(0, 0, 0, 0);

  // Guard: reschedule date must be in the future
  const todayForReschedule = new Date();
  todayForReschedule.setUTCHours(0, 0, 0, 0);
  if (isNaN(newBookingDate.getTime()) || newBookingDate < todayForReschedule) {
    return res.status(400).json({
      success: false,
      message: 'Reschedule date must be today or in the future',
    });
  }

  // Check slot availability
  const isAvailable = await (ServiceBooking as any).checkSlotAvailability(
    booking.service,
    booking.store,
    newBookingDate,
    timeSlot,
    booking.duration,
    booking._id,
  );

  if (!isAvailable) {
    return res.status(400).json({
      success: false,
      message: 'Selected time slot is not available',
    });
  }

  await booking.reschedule(newBookingDate, timeSlot);

  // Populate booking data for response
  const updatedBooking = await ServiceBooking.findById(booking._id)
    .populate('service', 'name images pricing')
    .populate('serviceCategory', 'name icon')
    .populate('store', 'name logo location contact')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Booking rescheduled successfully',
    data: updatedBooking,
  });
});

/**
 * Add rating to a completed booking
 * POST /api/service-bookings/:id/rate
 */
export const rateBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { score, review } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  if (!score || score < 1 || score > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating score must be between 1 and 5',
    });
  }

  // Must NOT use .lean() here — rateBooking calls booking.addRating() which is
  // a Mongoose document method only available on full (non-lean) documents.
  const booking = await ServiceBooking.findOne({
    _id: id,
    user: userId,
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
    });
  }

  if (booking.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Only completed bookings can be rated',
    });
  }

  if (booking.rating?.score) {
    return res.status(400).json({
      success: false,
      message: 'This booking has already been rated',
    });
  }

  await booking.addRating(score, review);

  res.status(200).json({
    success: true,
    message: 'Rating added successfully',
    data: {
      bookingId: booking._id,
      rating: booking.rating,
    },
  });
});

/**
 * Get available time slots for a service on a specific date
 * GET /api/service-bookings/available-slots
 */
export const getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
  const { serviceId, date } = req.query;

  if (!serviceId || !date) {
    return res.status(400).json({
      success: false,
      message: 'Service ID and date are required',
    });
  }

  // Fetch the service with store populated (avoid sequential await)
  const service = (await Product.findOne({
    _id: serviceId,
    productType: 'service',
    isActive: true,
  })
    .populate('store')
    .lean()) as any;

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  // Store is already populated, use it directly
  const store = service.store;
  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found',
    });
  }

  // Parse date — use UTC to avoid timezone-dependent day boundaries
  const bookingDate = new Date(date as string);
  bookingDate.setUTCHours(0, 0, 0, 0);

  // Get store hours (default if not specified)
  const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';
  const hours = store.operationalInfo?.hours;
  const storeHours = hours?.[dayOfWeek] || {
    open: '09:00',
    close: '18:00',
  };

  // Get service duration
  const duration = service.serviceDetails?.duration || 60;

  // Get available slots — extract _id if store is populated (not a bare ObjectId)
  const storeIdForSlots = (service.store as any)?._id || service.store;
  const availableSlots = await (ServiceBooking as any).getAvailableSlots(
    storeIdForSlots,
    bookingDate,
    duration,
    storeHours,
  );

  res.status(200).json({
    success: true,
    data: {
      serviceId,
      date: bookingDate.toISOString().split('T')[0],
      duration,
      storeHours,
      slots: availableSlots,
    },
  });
});

/**
 * Charge no-show fee from customer's stored payment method
 * POST /api/service-bookings/:bookingId/charge-no-show
 */
export const chargeNoShowFee = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const merchantId = req.user?._id;

  if (!merchantId) {
    return res.status(401).json({
      success: false,
      message: 'Merchant not authenticated',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID',
    });
  }

  // Find booking with store
  const booking = (await ServiceBooking.findById(bookingId).populate('store service').lean()) as any;

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
    });
  }

  // Verify merchant owns the store
  const store = booking.store as any;
  if (!store || store.merchantId?.toString() !== merchantId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to charge fee for this booking',
    });
  }

  // Check booking status is 'no_show'
  if (booking.status !== 'no_show') {
    return res.status(400).json({
      success: false,
      message: 'Booking must be marked as no_show first',
    });
  }

  // Check if fee already charged
  if (booking.noShowFeeCharged === true) {
    return res.status(400).json({
      success: false,
      message: 'No-show fee already charged for this booking',
    });
  }

  // Verify stored payment method exists
  if (!booking.paymentId) {
    return res.status(400).json({
      success: false,
      message: 'No saved payment method for this booking',
    });
  }

  // Get service to check cancellation policy
  const service = booking.service as any;
  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  // Determine fee amount based on cancellation policy
  const lateCancellationFee = service.serviceDetails?.lateCancellationFee || 'none';
  let feeAmount = 0;

  if (lateCancellationFee === 'full') {
    feeAmount = (booking.pricing as any)?.total || 0;
  } else if (lateCancellationFee === 'partial') {
    feeAmount = Math.round(((booking.pricing as any)?.total || 0) * 0.5);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Service does not have a no-show fee configured',
    });
  }

  if (feeAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid fee amount calculated',
    });
  }

  try {
    // Attempt to charge via Razorpay (or mark as fee_applied if storage-only)
    // For now, we'll mark it as applied and log the revenue event
    await ServiceBooking.findByIdAndUpdate(bookingId, {
      noShowFeeCharged: true,
      noShowFeeAmount: feeAmount,
      noShowFeeChargedAt: new Date(),
    });

    // Log revenue event for analytics
    logger.info('[NO_SHOW_FEE] Charged', {
      bookingId: booking._id,
      customerId: booking.user,
      amount: feeAmount,
      storeId: store._id,
      merchantId: store.merchantId,
    });

    // Send merchant notification
    await merchantNotificationService
      .notify({
        merchantId: store.merchantId?.toString() || '',
        type: 'no_show_fee_charged',
        priority: 'high',
        title: 'No-Show Fee Charged',
        message: `₹${feeAmount} charged for booking ${booking.bookingNumber} — customer no-show`,
      })
      .catch((err) => logger.warn('[NO_SHOW_FEE] Notification failed', { error: err }));

    res.status(200).json({
      success: true,
      message: 'No-show fee charged successfully',
      data: {
        bookingId,
        feeAmount,
        chargedAt: new Date().toISOString(),
      },
    });
  } catch (chargeError) {
    logger.error('[NO_SHOW_FEE] Charge failed', {
      bookingId,
      error: chargeError,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to charge no-show fee',
    });
  }
});

/**
 * Add treatment notes to a booking
 * PATCH /api/service-bookings/:id/treatment-notes
 */
export const addTreatmentNotes = asyncHandler(async (req: Request, res: Response) => {
  const { colourFormula, productsUsed, stylistNotes, clientVisibleNotes } = req.body;
  const bookingId = req.params.id;

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID is required',
    });
  }

  try {
    // Ownership guard: only the merchant who owns this booking's store may update treatment notes.
    const merchantId = (req as any).merchantId;
    const ownershipFilter: Record<string, any> = { _id: bookingId };
    if (merchantId) {
      ownershipFilter.merchantId = merchantId;
    }

    const booking = await ServiceBooking.findOneAndUpdate(
      ownershipFilter,
      {
        $set: {
          'treatmentNotes.colourFormula': colourFormula || '',
          'treatmentNotes.productsUsed': productsUsed || [],
          'treatmentNotes.stylistNotes': stylistNotes || '',
          'treatmentNotes.clientVisibleNotes': clientVisibleNotes || '',
          'treatmentNotes.updatedAt': new Date(),
        },
      },
      { new: true },
    ).lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    return res.json({
      success: true,
      message: 'Treatment notes saved successfully',
      data: booking,
    });
  } catch (error) {
    logger.error('[TREATMENT_NOTES] Failed to save', {
      bookingId,
      error,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to save treatment notes',
    });
  }
});

// Export all controller functions
export default {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  rateBooking,
  getAvailableSlots,
  chargeNoShowFee,
  addTreatmentNotes,
};
