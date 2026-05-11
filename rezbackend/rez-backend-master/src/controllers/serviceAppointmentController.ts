import { logger } from '../config/logger';
// ServiceAppointment Controller
// Handles service appointment booking API endpoints

import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { ServiceAppointment } from '../models/ServiceAppointment';
import { ServiceBooking } from '../models/ServiceBooking';
import { Store } from '../models/Store';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Create new service appointment
 * POST /api/service-appointments
 */
export const createServiceAppointment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  const {
    storeId,
    serviceType,
    appointmentDate,
    appointmentTime,
    duration,
    customerName,
    customerPhone,
    customerEmail,
    specialInstructions,
    staffMember,
    staffId,
    staffName,
    price,
    staffPriceOverride,
    bufferTimeAfter,
    additionalServices,
    roomId,
    roomName,
  } = req.body;

  // Validate required fields
  if (!storeId || !serviceType || !appointmentDate || !appointmentTime || !customerName || !customerPhone) {
    sendError(res, 'Missing required fields', 400);
    return;
  }

  // Guard: appointment date must be today or in the future
  const apptDate = new Date(appointmentDate);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (isNaN(apptDate.getTime()) || apptDate < today) {
    sendError(res, 'Appointment date must be today or in the future', 400);
    return;
  }

  // Check if store exists
  const store = await Store.findById(storeId).lean();
  if (!store) {
    sendNotFound(res, 'Store not found');
    return;
  }

  // Verify store type supports appointments (SERVICE, CONSULTATION, and HYBRID all support appointments)
  const storeTypeField = store.bookingType;
  const appointmentSupportedTypes = ['SERVICE', 'CONSULTATION', 'HYBRID'];
  if (storeTypeField && !appointmentSupportedTypes.includes(storeTypeField)) {
    sendError(res, 'This store does not support service appointments', 400);
    return;
  }

  // Check availability
  const isAvailable = await ServiceAppointment.checkAvailability(
    new Types.ObjectId(storeId),
    new Date(appointmentDate),
    appointmentTime,
    duration || 60,
  );

  if (!isAvailable) {
    sendError(res, 'This time slot is not available. Please choose another time.', 409);
    return;
  }

  // Generate appointment number
  const appointmentNumber = await ServiceAppointment.generateAppointmentNumber();

  // Create appointment
  const appointment = await ServiceAppointment.create({
    appointmentNumber,
    store: new Types.ObjectId(storeId),
    user: new Types.ObjectId(userId),
    serviceType,
    appointmentDate: new Date(appointmentDate),
    appointmentTime,
    duration: duration || 60,
    customerName,
    customerPhone,
    customerEmail,
    specialInstructions,
    ...(staffMember && { staffMember }),
    ...(staffId && Types.ObjectId.isValid(staffId) && { staffId: new Types.ObjectId(staffId) }),
    ...(staffName && { staffName }),
    ...(price !== undefined && { price }),
    ...(staffPriceOverride !== undefined && { staffPriceOverride }),
    ...(bufferTimeAfter !== undefined && { bufferTimeAfter }),
    ...(Array.isArray(additionalServices) && additionalServices.length > 0 && { additionalServices }),
    ...(roomId && Types.ObjectId.isValid(roomId) && { roomId: new Types.ObjectId(roomId) }),
    ...(roomName && { roomName }),
    status: 'pending',
  });

  // Populate store and user details
  const populatedAppointment = await ServiceAppointment.findById(appointment._id)
    .populate('store', 'name logo location contact')
    .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
    .lean();

  logger.info(`✅ [SERVICE APPOINTMENT] Created appointment ${appointmentNumber} for store ${storeId}`);

  // SA-01: Award coins for service booking (non-blocking)
  try {
    const { rewardEngine } = await import('../core/rewardEngine');
    await rewardEngine.issue({
      userId,
      amount: 15,
      coinType: 'rez',
      source: 'order',
      rewardType: 'engagement',
      description: `15 coins for booking at ${store.name || 'store'}`,
      operationType: 'store_payment_reward',
      referenceId: `service-appt:${appointment._id}`,
      referenceModel: 'ServiceAppointment',
      metadata: { storeId, serviceType },
    });
  } catch (rewardErr) {
    logger.warn('Non-blocking: Failed to award service booking coins', rewardErr);
  }

  sendCreated(res, populatedAppointment, 'Service appointment created successfully');
});

/**
 * Get user's service appointments
 * GET /api/service-appointments/user
 */
export const getUserServiceAppointments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  const { status } = req.query;

  const query: any = { user: new Types.ObjectId(userId) };

  if (status) {
    query.status = status;
  }

  const appointments = await ServiceAppointment.find(query)
    .select('_id appointmentNumber serviceType appointmentDate appointmentTime status store user customerName')
    .populate('store', 'name logo location.city location.area')
    .sort({ appointmentDate: -1, createdAt: -1 })
    .lean();

  logger.info(`✅ [SERVICE APPOINTMENT] Retrieved ${appointments.length} appointments for user ${userId}`);

  sendSuccess(res, { appointments, total: appointments.length }, 'Appointments retrieved successfully');
});

/**
 * Get service appointment by ID
 * GET /api/service-appointments/:appointmentId
 */
export const getServiceAppointment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { appointmentId } = req.params;

  if (!userId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  if (!Types.ObjectId.isValid(appointmentId)) {
    sendError(res, 'Invalid appointment ID', 400);
    return;
  }

  const appointment = await ServiceAppointment.findById(appointmentId)
    .populate('store', 'name logo location contact operationalInfo bookingConfig')
    .populate('user', 'profile.firstName profile.lastName profile.phoneNumber profile.email')
    .lean();

  if (!appointment) {
    sendNotFound(res, 'Appointment not found');
    return;
  }

  // Verify the appointment belongs to the user
  if (appointment.user._id.toString() !== userId) {
    sendError(res, 'Unauthorized to access this appointment', 403);
    return;
  }

  logger.info(`✅ [SERVICE APPOINTMENT] Retrieved appointment ${appointmentId}`);

  sendSuccess(res, appointment, 'Appointment retrieved successfully');
});

/**
 * Get store's service appointments
 * GET /api/service-appointments/store/:storeId
 */
export const getStoreServiceAppointments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { storeId } = req.params;
  const { date, status, page: pageStr, limit: limitStr } = req.query as Record<string, string | undefined>;

  if (!userId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  if (!Types.ObjectId.isValid(storeId)) {
    sendError(res, 'Invalid store ID', 400);
    return;
  }

  // Check if store exists and verify caller is the store's merchant
  const store = await Store.findById(storeId).lean();
  if (!store) {
    sendNotFound(res, 'Store not found');
    return;
  }

  if ((store as any).merchantId?.toString() !== userId) {
    sendError(res, 'Unauthorized to view appointments for this store', 403);
    return;
  }

  const query: any = { store: new Types.ObjectId(storeId) };

  // Filter by date if provided
  if (date) {
    const filterDate = new Date(date as string);
    const startOfDay = new Date(filterDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(filterDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    query.appointmentDate = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  // Filter by status if provided
  if (status) {
    query.status = status;
  }

  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(limitStr || '20', 10)));
  const skip = (page - 1) * limit;

  // Build a parallel query for ServiceBookings so consumer-created bookings
  // are visible to the merchant alongside ServiceAppointments.
  const bookingQuery: any = { store: new Types.ObjectId(storeId) };
  if (date) {
    const filterDate = new Date(date as string);
    const startOfDay = new Date(filterDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(filterDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    bookingQuery.bookingDate = { $gte: startOfDay, $lte: endOfDay };
  }
  if (status) {
    bookingQuery.status = status;
  }
  // Exclude slot-counter synthetic documents
  bookingQuery._type = { $ne: 'slot_counter' };

  const [appointments, totalCount, serviceBookings] = await Promise.all([
    ServiceAppointment.find(query)
      .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ServiceAppointment.countDocuments(query),
    ServiceBooking.find(bookingQuery)
      .populate('user', 'profile.firstName profile.lastName phoneNumber')
      .populate('service', 'name')
      .sort({ bookingDate: 1 })
      .lean(),
  ]);

  // Map ServiceBooking documents into the ServiceAppointment shape so the
  // merchant UI can render them without changes.
  const bookingsAsAppointments = (serviceBookings as any[]).map((b) => ({
    _id: b._id,
    appointmentNumber: b.bookingNumber,
    store: b.store,
    user: b.user,
    serviceType: (b.service as any)?.name || 'Service Booking',
    appointmentDate: b.bookingDate,
    appointmentTime: b.timeSlot?.start || '',
    duration: b.duration || 60,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    customerEmail: b.customerEmail,
    specialInstructions: b.customerNotes,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    // Distinguish the source so the merchant UI can optionally badge it
    _source: 'service_booking',
  }));

  // Merge and re-sort by appointment date ascending
  const allAppointments = [...appointments, ...bookingsAsAppointments].sort((a: any, b: any) => {
    const dateA = new Date(a.appointmentDate).getTime();
    const dateB = new Date(b.appointmentDate).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
  });

  const mergedTotal = totalCount + (serviceBookings as any[]).length;

  logger.info(
    `✅ [SERVICE APPOINTMENT] Retrieved ${appointments.length} appointments + ${(serviceBookings as any[]).length} service bookings for store ${storeId}`,
  );

  sendSuccess(
    res,
    {
      appointments: allAppointments,
      page,
      limit,
      totalCount: mergedTotal,
      totalPages: Math.ceil(mergedTotal / limit),
    },
    'Store appointments retrieved successfully',
  );
});

/**
 * Cancel service appointment
 * PUT /api/service-appointments/:appointmentId/cancel
 */
export const cancelServiceAppointment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { appointmentId } = req.params;
  const { reason } = req.body;

  if (!userId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  if (!Types.ObjectId.isValid(appointmentId)) {
    sendError(res, 'Invalid appointment ID', 400);
    return;
  }

  // Do NOT use .lean() here — we need the Mongoose instance to call .cancel()
  const appointment = await ServiceAppointment.findById(appointmentId);

  if (!appointment) {
    sendNotFound(res, 'Appointment not found');
    return;
  }

  // Verify the appointment belongs to the user
  if (appointment.user.toString() !== userId) {
    sendError(res, 'Unauthorized to cancel this appointment', 403);
    return;
  }

  // Check if appointment can be cancelled
  if (appointment.status === 'cancelled') {
    sendError(res, 'Appointment is already cancelled', 400);
    return;
  }

  if (appointment.status === 'completed') {
    sendError(res, 'Cannot cancel a completed appointment', 400);
    return;
  }

  // Cancel the appointment (instance method — requires a Mongoose document, not a lean object)
  await appointment.cancel(reason);

  // Populate for response
  const updatedAppointment = await ServiceAppointment.findById(appointmentId)
    .populate('store', 'name logo location contact')
    .lean();

  logger.info(`✅ [SERVICE APPOINTMENT] Cancelled appointment ${appointmentId}`);

  sendSuccess(res, updatedAppointment ?? null, 'Appointment cancelled successfully');
});

/**
 * Check availability for a time slot
 * GET /api/service-appointments/availability/:storeId
 */
export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const { date, time, duration } = req.query;

  if (!Types.ObjectId.isValid(storeId)) {
    sendError(res, 'Invalid store ID', 400);
    return;
  }

  if (!date) {
    sendError(res, 'Date is required', 400);
    return;
  }

  // Check if store exists
  const store = await Store.findById(storeId).lean();
  if (!store) {
    sendNotFound(res, 'Store not found');
    return;
  }

  if (!time) {
    sendError(res, 'Time parameter is required for availability check', 400);
    return;
  }

  const appointmentDate = new Date(date as string);
  const appointmentTime = time as string;
  const appointmentDuration = duration ? parseInt(duration as string, 10) : 60;

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(appointmentTime)) {
    sendError(res, 'Invalid time format. Use HH:MM format', 400);
    return;
  }

  const isAvailable = await ServiceAppointment.checkAvailability(
    new Types.ObjectId(storeId),
    appointmentDate,
    appointmentTime,
    appointmentDuration,
  );

  logger.info(`✅ [SERVICE APPOINTMENT] Checked availability for ${storeId} on ${date} at ${time}: ${isAvailable}`);

  sendSuccess(
    res,
    {
      available: isAvailable,
      date: appointmentDate,
      time: appointmentTime,
      duration: appointmentDuration,
    },
    isAvailable ? 'Time slot is available' : 'Time slot is not available',
  );
});

/**
 * Get available time slots for a date
 * GET /api/service-appointments/slots/:storeId
 */
export const getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const { date, duration } = req.query;

  if (!Types.ObjectId.isValid(storeId)) {
    sendError(res, 'Invalid store ID', 400);
    return;
  }

  if (!date) {
    sendError(res, 'Date is required', 400);
    return;
  }

  // Check if store exists
  const store = await Store.findById(storeId).lean();
  if (!store) {
    sendNotFound(res, 'Store not found');
    return;
  }

  const appointmentDate = new Date(date as string);
  const appointmentDuration = duration ? parseInt(duration as string, 10) : 60;

  // Get store working hours (default 9 AM to 9 PM if not specified)
  let workingHours = { start: '09:00', end: '21:00' };

  if (store.bookingConfig?.workingHours) {
    workingHours = store.bookingConfig.workingHours as { start: string; end: string };
  } else if (store.operationalInfo?.hours) {
    // Try to get from operational hours
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    // hours has fixed day-name keys; use index signature to access dynamically
    const dayHours = (
      store.operationalInfo.hours as Record<string, { open: string; close: string; closed?: boolean } | undefined>
    )[dayName];
    if (dayHours && !dayHours.closed) {
      workingHours = { start: dayHours.open, end: dayHours.close };
    }
  }

  // Generate time slots in a single pass (avoids N+1 per-slot availability queries)
  const slots = await ServiceAppointment.getAvailableTimeSlots(
    new Types.ObjectId(storeId),
    appointmentDate,
    appointmentDuration,
    { start: workingHours.start, end: workingHours.end },
  );

  logger.info(`✅ [SERVICE APPOINTMENT] Generated ${slots.length} time slots for ${storeId} on ${date}`);

  sendSuccess(
    res,
    {
      date: appointmentDate,
      slots,
      workingHours,
    },
    'Available slots retrieved successfully',
  );
});

/**
 * Mark appointment as no-show
 * PUT /api/service-appointments/:id/no-show
 */
export const markNoShow = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { reason } = req.body;

  if (!userId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  if (!Types.ObjectId.isValid(id)) {
    sendError(res, 'Invalid appointment ID', 400);
    return;
  }

  const appointment = await ServiceAppointment.findById(id);
  if (!appointment) {
    sendNotFound(res, 'Appointment not found');
    return;
  }

  if (!['pending', 'confirmed', 'in_progress'].includes(appointment.status)) {
    sendError(res, `Cannot mark as no-show from status: ${appointment.status}`, 400);
    return;
  }

  // Only the merchant who owns the store can mark a no-show
  const storeForNoShow = await Store.findById(appointment.store).select('merchantId').lean();
  if (!storeForNoShow || (storeForNoShow as any).merchantId?.toString() !== userId) {
    sendError(res, 'Only the store merchant can mark appointments as no-show', 403);
    return;
  }

  appointment.status = 'no_show';
  appointment.noShowMarkedAt = new Date();
  if (reason) appointment.cancellationReason = reason;
  await appointment.save();

  // Notify consumer (non-blocking)
  if (appointment.user) {
    const storeDoc = await Store.findById(appointment.store).select('name').lean();
    import('../services/pushNotificationService')
      .then(({ default: push }) => {
        push
          .sendPushToUser(appointment.user.toString(), {
            title: 'Missed appointment',
            body: `You missed your ${appointment.serviceType || 'appointment'} at ${(storeDoc as any)?.name || 'the store'}. Rebook anytime.`,
            data: { screen: 'my-bookings', appointmentId: id },
          })
          .catch(() => {});
      })
      .catch(() => {});
  }

  logger.info(`✅ [SERVICE APPOINTMENT] Marked as no-show: ${id}`);
  sendSuccess(res, appointment, 'Appointment marked as no-show');
});

/**
 * Add treatment notes to an appointment
 * PUT /api/service-appointments/:id/treatment-notes
 */
export const addTreatmentNotes = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { stylistNotes, clientVisibleNotes, colourFormula, productsUsed, resultRating, photosBefore, photosAfter } =
    req.body;

  if (!userId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  if (!Types.ObjectId.isValid(id)) {
    sendError(res, 'Invalid appointment ID', 400);
    return;
  }

  const appointment = await ServiceAppointment.findById(id);
  if (!appointment) {
    sendNotFound(res, 'Appointment not found');
    return;
  }

  // Only the merchant who owns the store can add treatment notes
  const storeForNotes = await Store.findById(appointment.store).select('merchantId').lean();
  if (!storeForNotes || (storeForNotes as any).merchantId?.toString() !== userId) {
    sendError(res, 'Only the store merchant can add treatment notes', 403);
    return;
  }

  // Merge with existing notes
  const existing = appointment.treatmentNotes || {};
  appointment.treatmentNotes = {
    ...existing,
    ...(stylistNotes !== undefined && { stylistNotes }),
    ...(clientVisibleNotes !== undefined && { clientVisibleNotes }),
    ...(colourFormula !== undefined && { colourFormula }),
    ...(productsUsed !== undefined && { productsUsed }),
    ...(resultRating !== undefined && { resultRating }),
    photos: {
      ...(existing.photos || {}),
      ...(photosBefore && { before: photosBefore }),
      ...(photosAfter && { after: photosAfter }),
    },
  };

  await appointment.save();

  logger.info(`✅ [SERVICE APPOINTMENT] Treatment notes saved for appointment ${id}`);
  sendSuccess(res, appointment, 'Treatment notes saved successfully');
});

/**
 * Update appointment details (reschedule / reassign staff)
 * PUT /api/service-appointments/:id
 */
export const updateAppointment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { appointmentDate, appointmentTime, duration, staffId, staffName, specialInstructions } = req.body;

  if (!userId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  if (!Types.ObjectId.isValid(id)) {
    sendError(res, 'Invalid appointment ID', 400);
    return;
  }

  const appointment = await ServiceAppointment.findById(id);
  if (!appointment) {
    sendNotFound(res, 'Appointment not found');
    return;
  }

  if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
    sendError(res, `Cannot update appointment in status: ${appointment.status}`, 400);
    return;
  }

  // Authorization: user must be the appointment owner OR the merchant who owns the store
  const isOwner = appointment.user.toString() === userId;
  if (!isOwner) {
    const storeForUpdate = await Store.findById(appointment.store).select('merchantId').lean();
    if (!storeForUpdate || (storeForUpdate as any).merchantId?.toString() !== userId) {
      sendError(res, 'Unauthorized to update this appointment', 403);
      return;
    }
  }

  // If rescheduling (date, time, or duration changed) verify new slot is available
  const durationChanged = duration !== undefined && duration !== appointment.duration;
  if (appointmentDate || appointmentTime || durationChanged) {
    const newDate = appointmentDate ? new Date(appointmentDate) : appointment.appointmentDate;
    const newTime = appointmentTime || appointment.appointmentTime;
    const newDuration = duration !== undefined ? duration : appointment.duration;

    const isAvailable = await ServiceAppointment.checkAvailability(appointment.store, newDate, newTime, newDuration);
    // "Conflict with self" only counts when date AND time are unchanged AND duration is not growing
    const sameSlot =
      newDate.toDateString() === appointment.appointmentDate.toDateString() &&
      newTime === appointment.appointmentTime &&
      !durationChanged;
    if (!isAvailable && !sameSlot) {
      sendError(res, 'New time slot is not available', 409);
      return;
    }

    appointment.appointmentDate = newDate;
    appointment.appointmentTime = newTime;
  }

  if (duration !== undefined) appointment.duration = duration;
  if (staffId !== undefined) appointment.staffId = new Types.ObjectId(staffId);
  if (staffName !== undefined) appointment.staffName = staffName;
  if (specialInstructions !== undefined) appointment.specialInstructions = specialInstructions;

  await appointment.save();

  const updated = await ServiceAppointment.findById(id)
    .populate('store', 'name logo location contact')
    .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
    .lean();

  logger.info(`✅ [SERVICE APPOINTMENT] Updated appointment ${id}`);
  sendSuccess(res, updated, 'Appointment updated successfully');
});

/**
 * Update service appointment status
 * PUT /api/service-appointments/:id/status
 */
export const updateServiceAppointmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { status, tip, tipPaymentId } = req.body;

  if (!userId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  if (!Types.ObjectId.isValid(id)) {
    sendError(res, 'Invalid appointment ID', 400);
    return;
  }

  const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
  if (!validStatuses.includes(status)) {
    sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    return;
  }

  const appointment = await ServiceAppointment.findById(id);
  if (!appointment) {
    sendNotFound(res, 'Appointment not found');
    return;
  }

  // Authorization: must be the appointment owner or the merchant who owns the store
  const isOwner = appointment.user.toString() === userId;
  if (!isOwner) {
    const storeForStatus = await Store.findById(appointment.store).select('merchantId').lean();
    if (!storeForStatus || (storeForStatus as any).merchantId?.toString() !== userId) {
      sendError(res, 'Unauthorized to update this appointment status', 403);
      return;
    }
  }

  // Update status with timestamps
  appointment.status = status;
  if (status === 'confirmed' && !appointment.confirmedAt) appointment.confirmedAt = new Date();
  if (status === 'completed' && !appointment.completedAt) appointment.completedAt = new Date();
  if (status === 'cancelled' && !appointment.cancelledAt) appointment.cancelledAt = new Date();
  if (status === 'no_show' && !appointment.noShowMarkedAt) appointment.noShowMarkedAt = new Date();

  // Tip tracking on completion
  if (status === 'completed' && tip !== undefined) {
    appointment.tip = tip;
    if (tipPaymentId) appointment.tipPaymentId = tipPaymentId;
  }

  await appointment.save();

  // P0: Consumer push on status change (non-blocking)
  if (appointment.user) {
    import('../services/pushNotificationService')
      .then(({ default: pushNotificationService }) => {
        const userId = appointment.user?.toString() || '';
        if (!userId) return;
        if (status === 'confirmed') {
          pushNotificationService
            .sendPushToUser(userId, {
              title: 'Appointment Confirmed ✅',
              body: `Your ${appointment.serviceType || 'appointment'} is confirmed for ${appointment.appointmentDate} at ${appointment.appointmentTime}`,
              data: { screen: 'my-bookings', appointmentId: String(appointment._id) },
            })
            .catch(() => {});
        } else if (status === 'completed') {
          pushNotificationService
            .sendPushToUser(userId, {
              title: 'How was your experience? ⭐',
              body: `Book your next ${appointment.serviceType || 'appointment'} at ${(appointment as any).storeName || 'the store'} in one tap.`,
              data: { screen: 'rebook', appointmentId: String(appointment._id), storeId: String(appointment.store) },
            })
            .catch(() => {});
        } else if (status === 'cancelled') {
          pushNotificationService
            .sendPushToUser(userId, {
              title: 'Appointment Cancelled',
              body: `Your ${appointment.serviceType || 'appointment'} on ${appointment.appointmentDate} has been cancelled.`,
              data: { screen: 'my-bookings' },
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }

  // ED-03: Award coins on completion
  if (status === 'completed') {
    // v3: Use merchantRewardService for rule-based rewards (idempotent, journaled)
    const apptUserId = appointment.user?.toString();
    const apptStore = await Store.findById(appointment.store).select('merchantId _id').lean();
    if (apptUserId && apptStore) {
      import('../merchantservices/merchantRewardService')
        .then(({ merchantRewardService }) => {
          merchantRewardService
            .processReward({
              sessionId: `service-appt:${appointment._id}`,
              merchantId: apptStore.merchantId?.toString() || '',
              storeId: apptStore._id?.toString(),
              userId: apptUserId,
              eventType: 'appointment',
              // price/totalPrice are legacy optional fields not in the typed interface
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              amount: (appointment as any).price || (appointment as any).totalPrice || 0,
            })
            .catch((err: any) => logger.warn('[ServiceAppt] Non-blocking reward failed', err));
        })
        .catch((err: any) => logger.warn('[ServiceAppt] merchantRewardService import failed', err));
    }
  }

  logger.info(`✅ [SERVICE APPOINTMENT] Status updated to ${status} for appointment ${id}`);

  // Re-fetch and populate so the client gets full store/user objects (not raw ObjectIds)
  const updatedAppointment = await ServiceAppointment.findById(id)
    .populate('store', 'name logo location contact')
    .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
    .lean();
  sendSuccess(res, updatedAppointment, `Appointment status updated to ${status}`);
});

/**
 * Calculate next occurrence date based on frequency/interval
 */
function nextOccurrenceDate(baseDate: Date, frequency: string, interval: number, stepIndex: number): Date {
  const d = new Date(baseDate);
  const steps = interval * stepIndex;
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + steps);
      break;
    case 'weekly':
      d.setDate(d.getDate() + steps * 7);
      break;
    case 'biweekly':
      d.setDate(d.getDate() + steps * 14);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + steps);
      break;
  }
  return d;
}

/**
 * Create a recurring series of appointments
 * POST /api/appointments/recurring
 */
export const createRecurringSeries = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  const {
    storeId,
    serviceType,
    appointmentDate,
    appointmentTime,
    duration,
    customerName,
    customerPhone,
    customerEmail,
    specialInstructions,
    staffMember,
    staffId,
    staffName,
    price,
    staffPriceOverride,
    bufferTimeAfter,
    recurrence,
  } = req.body;

  if (!storeId || !serviceType || !appointmentDate || !appointmentTime || !customerName || !customerPhone) {
    sendError(res, 'Missing required fields', 400);
    return;
  }

  if (!recurrence || !recurrence.frequency) {
    sendError(res, 'recurrence.frequency is required', 400);
    return;
  }

  const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly'];
  if (!validFrequencies.includes(recurrence.frequency)) {
    sendError(res, `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`, 400);
    return;
  }

  const baseDate = new Date(appointmentDate);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (isNaN(baseDate.getTime()) || baseDate < today) {
    sendError(res, 'Appointment date must be today or in the future', 400);
    return;
  }

  const store = await Store.findById(storeId).lean();
  if (!store) {
    sendNotFound(res, 'Store not found');
    return;
  }

  const MAX_OCCURRENCES = 52;
  const interval = recurrence.interval || 1;
  const endType: string = recurrence.endType || 'never';

  // Determine total occurrences
  let totalOccurrences: number;
  if (endType === 'after') {
    totalOccurrences = Math.min(recurrence.occurrences || 1, MAX_OCCURRENCES);
  } else if (endType === 'on_date') {
    // Count how many steps fit before endDate
    const endDate = new Date(recurrence.endDate);
    let count = 0;
    for (let i = 0; i < MAX_OCCURRENCES; i++) {
      const d = nextOccurrenceDate(baseDate, recurrence.frequency, interval, i);
      if (d > endDate) break;
      count++;
    }
    totalOccurrences = Math.max(1, count);
  } else {
    // 'never' — default to 52
    totalOccurrences = MAX_OCCURRENCES;
  }

  const seriesId = new mongoose.Types.ObjectId().toString();

  const baseDuration = duration || 60;

  const docs: any[] = [];
  for (let i = 0; i < totalOccurrences; i++) {
    const occDate = nextOccurrenceDate(baseDate, recurrence.frequency, interval, i);
    const appointmentNumber = await ServiceAppointment.generateAppointmentNumber();
    docs.push({
      appointmentNumber,
      store: new Types.ObjectId(storeId),
      user: new Types.ObjectId(userId),
      serviceType,
      appointmentDate: occDate,
      appointmentTime,
      duration: baseDuration,
      customerName,
      customerPhone,
      ...(customerEmail && { customerEmail }),
      ...(specialInstructions && { specialInstructions }),
      ...(staffMember && { staffMember }),
      ...(staffId && Types.ObjectId.isValid(staffId) && { staffId: new Types.ObjectId(staffId) }),
      ...(staffName && { staffName }),
      ...(price !== undefined && { price }),
      ...(staffPriceOverride !== undefined && { staffPriceOverride }),
      ...(bufferTimeAfter !== undefined && { bufferTimeAfter }),
      status: 'pending',
      recurrence: {
        enabled: true,
        frequency: recurrence.frequency,
        interval,
        daysOfWeek: recurrence.daysOfWeek || [],
        endType,
        ...(endType === 'after' && { occurrences: totalOccurrences }),
        ...(endType === 'on_date' && recurrence.endDate && { endDate: new Date(recurrence.endDate) }),
        seriesId,
        seriesIndex: i,
        isException: false,
      },
    });
  }

  const created = await ServiceAppointment.insertMany(docs);

  const first = await ServiceAppointment.findById(created[0]._id)
    .populate('store', 'name logo location contact')
    .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
    .lean();

  logger.info(`✅ [SERVICE APPOINTMENT] Created recurring series ${seriesId} with ${created.length} occurrences`);

  sendCreated(
    res,
    { seriesId, createdCount: created.length, firstAppointment: first },
    `Recurring series created with ${created.length} appointments`,
  );
});

/**
 * Update appointments in a series by scope
 * PUT /api/appointments/:id/series
 */
export const updateSeriesFromHere = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  const { updateScope, appointmentDate, appointmentTime, duration, staffId, staffName, specialInstructions } = req.body;

  if (!userId) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  if (!Types.ObjectId.isValid(id)) {
    sendError(res, 'Invalid appointment ID', 400);
    return;
  }

  const validScopes = ['this', 'this_and_following', 'all'];
  if (!updateScope || !validScopes.includes(updateScope)) {
    sendError(res, `updateScope must be one of: ${validScopes.join(', ')}`, 400);
    return;
  }

  const appointment = await ServiceAppointment.findById(id);
  if (!appointment) {
    sendNotFound(res, 'Appointment not found');
    return;
  }

  // Authorization: owner or merchant
  const isOwner = appointment.user.toString() === userId;
  if (!isOwner) {
    const storeForSeries = await Store.findById(appointment.store).select('merchantId').lean();
    if (!storeForSeries || (storeForSeries as any).merchantId?.toString() !== userId) {
      sendError(res, 'Unauthorized to update this appointment series', 403);
      return;
    }
  }

  const seriesId = appointment.recurrence?.seriesId;
  const seriesIndex = appointment.recurrence?.seriesIndex ?? 0;

  const updateFields: Record<string, any> = {};
  if (appointmentTime !== undefined) updateFields.appointmentTime = appointmentTime;
  if (duration !== undefined) updateFields.duration = duration;
  if (staffName !== undefined) updateFields.staffName = staffName;
  if (specialInstructions !== undefined) updateFields.specialInstructions = specialInstructions;
  if (staffId !== undefined && Types.ObjectId.isValid(staffId)) {
    updateFields.staffId = new Types.ObjectId(staffId);
  }

  if (updateScope === 'this') {
    // Update single instance and mark as exception
    if (appointmentDate !== undefined) appointment.appointmentDate = new Date(appointmentDate);
    Object.assign(appointment, updateFields);
    if (appointment.recurrence) {
      appointment.recurrence.isException = true;
    }
    await appointment.save();

    const updated = await ServiceAppointment.findById(id)
      .populate('store', 'name logo location contact')
      .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
      .lean();

    logger.info(`✅ [SERVICE APPOINTMENT] Updated single instance ${id} in series ${seriesId}`);
    sendSuccess(res, { updatedCount: 1, appointment: updated }, 'Appointment updated');
    return;
  }

  if (!seriesId) {
    sendError(res, 'This appointment is not part of a recurring series', 400);
    return;
  }

  let query: Record<string, any>;
  if (updateScope === 'this_and_following') {
    query = { 'recurrence.seriesId': seriesId, 'recurrence.seriesIndex': { $gte: seriesIndex } };
  } else {
    // 'all'
    query = { 'recurrence.seriesId': seriesId };
  }

  const result = await ServiceAppointment.updateMany(query, { $set: updateFields });

  logger.info(
    `✅ [SERVICE APPOINTMENT] Updated ${result.modifiedCount} appointments in series ${seriesId} (scope: ${updateScope})`,
  );

  sendSuccess(
    res,
    { updatedCount: result.modifiedCount, seriesId, updateScope },
    `${result.modifiedCount} appointments updated`,
  );
});
