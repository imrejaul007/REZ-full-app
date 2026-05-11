import * as crypto from 'crypto';
import { randomInt } from 'crypto';
import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { ServiceCategory } from '../models/ServiceCategory';
import { ServiceBooking } from '../models/ServiceBooking';
import { Store } from '../models/Store';
import { Refund } from '../models/Refund';
import { authMiddleware as merchantAuth } from '../middleware/merchantauth';
import { logger } from '../config/logger';
import mongoose from 'mongoose';
import pushNotificationService from '../services/pushNotificationService';
import { createRefund as createRazorpayRefund } from '../services/razorpayService';
import stripeService from '../services/stripeService';


const router = Router();

/**
 * Get merchant's services
 * GET /api/merchant/services
 */
router.get('/', merchantAuth, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as any).merchant?._id;
    const { page = '1', limit = '20', status, category, storeId } = req.query;

    const query: any = {
      productType: 'service',
      isDeleted: { $ne: true },
    };

    // Filter by merchant's stores
    if (storeId) {
      query.store = new mongoose.Types.ObjectId(storeId as string);
    } else if ((req as any).merchant?.stores && (req as any).merchant.stores.length > 0) {
      query.store = { $in: (req as any).merchant.stores };
    } else if ((req as any).merchant?.storeId) {
      query.store = (req as any).merchant.storeId;
    }

    // Merchant ID filter
    if (merchantId) {
      query.merchantId = merchantId;
    }

    // Status filter
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Category filter
    if (category) {
      const serviceCategory = await ServiceCategory.findOne({ slug: category });
      if (serviceCategory) {
        query.serviceCategory = serviceCategory._id;
      }
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      Product.find(query)
        .populate('store', 'name logo')
        .populate('serviceCategory', 'name icon cashbackPercentage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: services,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching merchant services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message,
    });
  }
});

/**
 * Create a new service
 * POST /api/merchant/services
 */
router.post('/', merchantAuth, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as any).merchant?._id;
    const storeId = req.body.storeId || (req as any).merchant?.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required',
      });
    }

    const {
      name,
      description,
      shortDescription,
      serviceCategoryId,
      categoryId,
      images,
      price,
      originalPrice,
      duration,
      serviceType,
      maxBookingsPerSlot,
      requiresAddress,
      requiresPaymentUpfront,
      serviceArea,
      cashbackPercentage,
      cashbackMaxAmount,
      tags,
      isFeatured,
      specifications,
    } = req.body;

    // Validate required fields
    if (!name || !price || !serviceCategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and service category are required',
      });
    }

    // Verify service category exists
    const serviceCategory = await ServiceCategory.findById(serviceCategoryId);
    if (!serviceCategory) {
      return res.status(404).json({
        success: false,
        message: 'Service category not found',
      });
    }

    // Generate SKU
    const timestamp = Date.now();
    const random = randomInt(0, 999)
      .toString()
      .padStart(3, '0');
    const sku = `SVC-${timestamp}-${random}`;

    // Generate slug
    const slug =
      name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim() +
      '-' +
      random;

    // Create service (product with type 'service')
    const service = new Product({
      name,
      slug,
      description,
      shortDescription,
      productType: 'service',
      category: categoryId || serviceCategory._id, // Use category if provided
      serviceCategory: serviceCategory._id,
      store: storeId,
      merchantId,
      sku,
      images: images || [],
      pricing: {
        original: originalPrice || price,
        selling: price,
        discount:
          originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
        currency: 'INR',
      },
      inventory: {
        stock: 999, // Services don't have stock
        isAvailable: true,
        unlimited: true,
      },
      serviceDetails: {
        duration: duration || 60,
        serviceType: serviceType || 'store',
        maxBookingsPerSlot: maxBookingsPerSlot || 1,
        requiresAddress: requiresAddress || serviceType === 'home',
        requiresPaymentUpfront: requiresPaymentUpfront || false,
        serviceArea: serviceType === 'home' ? serviceArea : undefined,
        serviceCategory: serviceCategory._id,
      },
      cashback: {
        percentage: cashbackPercentage || serviceCategory.cashbackPercentage || 5,
        maxAmount: cashbackMaxAmount,
        isActive: true,
      },
      tags: tags || [],
      isActive: true,
      isFeatured: isFeatured || false,
      isDigital: serviceType === 'online',
      specifications: specifications || [],
    });

    await service.save();

    // Increment service count in category
    await ServiceCategory.findByIdAndUpdate(serviceCategoryId, {
      $inc: { serviceCount: 1 },
    });

    // Populate service data for response
    const populatedService = await Product.findById(service._id)
      .populate('store', 'name logo')
      .populate('serviceCategory', 'name icon cashbackPercentage')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: populatedService,
    });
  } catch (error: any) {
    logger.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message,
    });
  }
});

/**
 * Update a service
 * PUT /api/merchant/services/:id
 */
router.put('/:id', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = (req as any).merchant?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
      });
    }

    const service = await Product.findOne({
      _id: id,
      productType: 'service',
      merchantId,
      isDeleted: { $ne: true },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const {
      name,
      description,
      shortDescription,
      serviceCategoryId,
      images,
      price,
      originalPrice,
      duration,
      serviceType,
      maxBookingsPerSlot,
      requiresAddress,
      requiresPaymentUpfront,
      serviceArea,
      cashbackPercentage,
      cashbackMaxAmount,
      tags,
      isFeatured,
      specifications,
      isActive,
    } = req.body;

    // Update fields
    if (name) service.name = name;
    if (description !== undefined) service.description = description;
    if (shortDescription !== undefined) service.shortDescription = shortDescription;
    if (images) service.images = images;
    if (tags) service.tags = tags;
    if (isFeatured !== undefined) service.isFeatured = isFeatured;
    if (isActive !== undefined) service.isActive = isActive;
    if (specifications !== undefined) (service as any).specifications = specifications;

    // Update pricing
    if (price !== undefined) {
      service.pricing.selling = price;
      if (originalPrice !== undefined) {
        service.pricing.original = originalPrice;
        service.pricing.discount =
          originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
      }
    }

    // Update service details
    if (duration !== undefined) service.serviceDetails!.duration = duration;
    if (serviceType !== undefined) service.serviceDetails!.serviceType = serviceType;
    if (maxBookingsPerSlot !== undefined) service.serviceDetails!.maxBookingsPerSlot = maxBookingsPerSlot;
    if (requiresAddress !== undefined) service.serviceDetails!.requiresAddress = requiresAddress;
    if (requiresPaymentUpfront !== undefined) service.serviceDetails!.requiresPaymentUpfront = requiresPaymentUpfront;
    if (serviceArea !== undefined) service.serviceDetails!.serviceArea = serviceArea;

    // Update cashback
    if (cashbackPercentage !== undefined) service.cashback!.percentage = cashbackPercentage;
    if (cashbackMaxAmount !== undefined) service.cashback!.maxAmount = cashbackMaxAmount;

    // Update service category if changed
    if (serviceCategoryId && serviceCategoryId !== service.serviceCategory?.toString()) {
      const newCategory = await ServiceCategory.findById(serviceCategoryId);
      if (newCategory) {
        // Decrement old category count
        await ServiceCategory.findByIdAndUpdate(service.serviceCategory, {
          $inc: { serviceCount: -1 },
        });
        // Increment new category count
        await ServiceCategory.findByIdAndUpdate(serviceCategoryId, {
          $inc: { serviceCount: 1 },
        });
        service.serviceCategory = newCategory._id as mongoose.Types.ObjectId;
        service.serviceDetails!.serviceCategory = newCategory._id as mongoose.Types.ObjectId;
      }
    }

    await service.save();

    // Populate service data for response
    const populatedService = await Product.findById(service._id)
      .populate('store', 'name logo')
      .populate('serviceCategory', 'name icon cashbackPercentage')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: populatedService,
    });
  } catch (error: any) {
    logger.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message,
    });
  }
});

/**
 * Delete a service (soft delete)
 * DELETE /api/merchant/services/:id
 */
router.delete('/:id', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = (req as any).merchant?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
      });
    }

    const service = await Product.findOne({
      _id: id,
      productType: 'service',
      merchantId,
      isDeleted: { $ne: true },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Soft delete
    service.isDeleted = true;
    service.deletedAt = new Date();
    service.deletedBy = merchantId;
    service.deletedByModel = 'Merchant';
    service.isActive = false;
    await service.save();

    // Decrement service count in category
    await ServiceCategory.findByIdAndUpdate(service.serviceCategory, {
      $inc: { serviceCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message,
    });
  }
});

/**
 * Get merchant's service bookings
 * GET /api/merchant/services/bookings
 */
router.get('/bookings', merchantAuth, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as any).merchant?._id;
    const { page = '1', limit = '20', status, date, storeId } = req.query;

    const query: any = { merchantId };

    // Store filter
    if (storeId) {
      query.store = new mongoose.Types.ObjectId(storeId as string);
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Date filter
    if (date) {
      const dateObj = new Date(date as string);
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      query.bookingDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Fetch from both ServiceBooking and ServiceAppointment models
    const { ServiceAppointment } = await import('../models/ServiceAppointment');

    // Build ServiceAppointment query (SA-02: merchant visibility)
    const saQuery: any = {};
    if (storeId) {
      saQuery.store = new mongoose.Types.ObjectId(storeId as string);
    } else if (merchantId) {
      // Get all stores for this merchant to find their appointments
      const { Store } = await import('../models/Store');
      const merchantStores = await Store.find({ merchant: merchantId }).select('_id').lean();
      saQuery.store = { $in: merchantStores.map((s: any) => s._id) };
    }
    if (status) saQuery.status = status;
    if (date) {
      const dateObj = new Date(date as string);
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      saQuery.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const [bookings, bookingTotal, serviceAppointments, saTotal] = await Promise.all([
      ServiceBooking.find(query)
        .populate('user', 'profile.firstName profile.lastName profile.phoneNumber profile.email')
        .populate('service', 'name images pricing serviceDetails')
        .populate('serviceCategory', 'name icon')
        .populate('store', 'name logo')
        .sort({ bookingDate: 1, 'timeSlot.start': 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ServiceBooking.countDocuments(query),
      ServiceAppointment.find(saQuery)
        .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
        .populate('store', 'name logo')
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ServiceAppointment.countDocuments(saQuery),
    ]);

    // Merge and normalize
    const normalizedAppointments = serviceAppointments.map((a: any) => ({
      ...a,
      _type: 'ServiceAppointment',
      bookingDate: a.appointmentDate,
      timeSlot: { start: a.appointmentTime },
    }));

    const merged = [...bookings, ...normalizedAppointments];
    const total = bookingTotal + saTotal;

    res.status(200).json({
      success: true,
      data: merged,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching merchant bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
});

/**
 * Update booking status
 * PUT /api/merchant/services/bookings/:id/status
 */
router.put('/bookings/:id/status', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignedStaff, note } = req.body;
    const merchantId = (req as any).merchant?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    const validStatuses = ['confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const booking = await ServiceBooking.findOne({
      _id: id,
      merchantId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Handle different status updates
    if (status === 'confirmed' || status === 'assigned') {
      await booking.confirm(assignedStaff);
    } else if (status === 'in_progress') {
      await booking.start();
    } else if (status === 'completed') {
      await booking.complete();
    } else if (status === 'cancelled') {
      await booking.cancel(note || 'Cancelled by merchant', 'merchant');

      // H18 FIX: Merchant cancellation must trigger a payment refund for paid bookings,
      // mirroring the user cancellation refund flow in serviceBookingController.ts.
      if (booking.paymentStatus === 'paid' && booking.paymentId) {
        try {
          const paymentId = booking.paymentId;
          const refundAmount = booking.pricing?.total || 0;
          if (refundAmount > 0) {
            const isRazorpay = paymentId.startsWith('pay_');
            let gatewayRefundId: string | undefined;
            if (isRazorpay) {
              const result = await createRazorpayRefund(paymentId, refundAmount);
              gatewayRefundId = result.id;
            } else {
              const result = await stripeService.createRefund({
                paymentIntentId: paymentId,
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
                        refundReason: note || 'Booking cancelled by merchant',
                        gatewayRefundId,
                        status: 'processing',
                        requestedAt: new Date(),
                        metadata: { bookingType: 'service_booking', cancelledBy: 'merchant' },
                      },
                    ],
                    { session: refundSession },
                  );
                }
              });
            } finally {
              refundSession.endSession();
            }
            logger.info('[MerchantServices] Refund issued for merchant-cancelled booking:', {
              bookingId: booking._id,
              refundAmount,
            });
          }
        } catch (refundErr: any) {
          // Log but do not block status update — admin will review
          logger.error(
            '[MerchantServices] Refund failed after merchant cancel (manual review needed):',
            refundErr?.message,
          );
        }
      }
    } else {
      await booking.updateStatus(status, merchantId, note);
    }

    // Populate booking data for response
    const updatedBooking = await ServiceBooking.findById(booking._id)
      .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
      .populate('service', 'name images pricing')
      .populate('serviceCategory', 'name icon')
      .lean();

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      data: updatedBooking,
    });
  } catch (error: any) {
    logger.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message,
    });
  }
});

/**
 * Mark booking as no-show
 * POST /api/merchant/services/bookings/:id/no-show
 */
router.post('/bookings/:id/no-show', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = (req as any).merchant?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    const booking = await ServiceBooking.findOne({
      _id: id,
      merchantId,
    })
      .populate('user')
      .populate('service');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Mark as no-show
    booking.status = 'no_show';
    (booking as any).noShowMarkedAt = new Date();
    await booking.save();

    // Handle no-show fee charging
    try {
      const service = booking.service as any;
      const store = await Store.findById(booking.store).select('name businessName').lean();

      // Check if we need to charge a fee
      if (service?.cancellationPolicy?.lateCancellationFee === 'partial') {
        const feePercentage = service.cancellationPolicy.feePercentage || 50;
        const feeAmount = Math.round((service.pricing.selling * feePercentage) / 100);

        // Check if payment was collected upfront
        const requiresUpfrontPayment = (booking as any).requiresPaymentUpfront || false;

        if (!requiresUpfrontPayment && feeAmount > 0 && booking.user) {
          // Notify user about the fee
          try {
            const consumerUser = booking.user as any;
            await pushNotificationService
              .sendPushToUser(consumerUser._id?.toString() || '', {
                title: 'No-show fee applied',
                body: `A ₹${feeAmount} no-show fee has been applied for your missed appointment at ${(store as any)?.businessName || store?.name || 'the store'}.`,
                data: { screen: 'my-bookings' },
              })
              .catch((err: any) => logger.error('[NO-SHOW] Failed to send fee notification: ' + err.message));
          } catch (feeNotifErr: any) {
            logger.error('[NO-SHOW] Fee notification error: ' + feeNotifErr.message);
          }
        }
      }
    } catch (feeErr: any) {
      logger.error('[NO-SHOW] Fee processing error:', feeErr.message);
      // Don't fail the no-show marking - log and continue
    }

    // Notify consumer about missed appointment (fire-and-forget)
    try {
      const store = await Store.findById(booking.store).select('name').lean();
      if (booking.user) {
        await pushNotificationService
          .sendPushToUser((booking.user as any)._id.toString(), {
            title: 'Missed appointment',
            body: `You missed your appointment at ${store?.name || 'the store'}. Reschedule anytime.`,
            data: { screen: 'my-bookings' },
          })
          .catch((err: any) => logger.error('[NO-SHOW] Failed to send consumer push: ' + err.message));
      }
    } catch (notifErr: any) {
      logger.error('[NO-SHOW] Notification error: ' + notifErr.message);
    }

    // Populate booking data for response
    const updatedBooking = await ServiceBooking.findById(booking._id)
      .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
      .populate('service', 'name images pricing')
      .populate('serviceCategory', 'name icon')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Booking marked as no-show',
      data: updatedBooking,
    });
  } catch (error: any) {
    logger.error('Error marking booking as no-show:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark booking as no-show',
      error: error.message,
    });
  }
});

/**
 * Get service categories for dropdown
 * GET /api/merchant/services/categories
 */
router.get('/categories', merchantAuth, async (req: Request, res: Response) => {
  try {
    const categories = await ServiceCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    logger.error('Error fetching service categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
});

/**
 * Get booking statistics
 * GET /api/merchant/services/bookings/stats
 */
router.get('/bookings/stats', merchantAuth, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as any).merchant?._id;
    const { storeId, period = '30' } = req.query;

    const query: any = { merchantId };
    if (storeId) {
      query.store = new mongoose.Types.ObjectId(storeId as string);
    }

    // Date range
    const days = parseInt(period as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    query.createdAt = { $gte: startDate };

    const stats = await ServiceBooking.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$pricing.total', 0],
            },
          },
        },
      },
    ]);

    // Calculate totals
    const totals = {
      totalBookings: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      revenue: 0,
    };

    stats.forEach((stat: any) => {
      totals.totalBookings += stat.count;
      if (stat._id === 'pending') totals.pending = stat.count;
      if (stat._id === 'confirmed' || stat._id === 'assigned') totals.confirmed += stat.count;
      if (stat._id === 'completed') {
        totals.completed = stat.count;
        totals.revenue = stat.revenue;
      }
      if (stat._id === 'cancelled') totals.cancelled = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        period: `Last ${days} days`,
        ...totals,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics',
      error: error.message,
    });
  }
});

/**
 * Get a single service by ID
 * GET /api/merchant/services/:id
 * NOTE: This route MUST be after /bookings, /categories, /bookings/stats to avoid /:id matching those paths
 */
router.get('/:id', merchantAuth, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as any).merchant?._id;
    const serviceId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
      });
    }

    const service = await Product.findOne({
      _id: serviceId,
      merchantId,
      productType: 'service',
      isDeleted: { $ne: true },
    })
      .populate('serviceCategory', 'name slug icon cashbackPercentage')
      .populate('store', 'name logo')
      .lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    logger.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: error.message,
    });
  }
});

// ==================== BLOCKED SLOTS ====================

import BlockedSlot from '../models/BlockedSlot';

/**
 * GET /api/merchant/services/blocked-slots
 * List merchant's blocked slots (filter by storeId and date range)
 */
router.get('/blocked-slots', merchantAuth, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as any).merchant?._id;
    const { storeId, from, to } = req.query;

    const query: any = { merchantId };
    if (storeId) query.storeId = new mongoose.Types.ObjectId(storeId as string);
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from as string);
      if (to) query.date.$lte = new Date(to as string);
    }

    const slots = await BlockedSlot.find(query).populate('serviceId', 'name').sort({ date: 1, startTime: 1 }).lean();

    return res.json({ success: true, data: { slots, total: slots.length } });
  } catch (err: any) {
    logger.error('Error fetching blocked slots:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch blocked slots' });
  }
});

/**
 * POST /api/merchant/services/blocked-slots
 * Block a time slot (prevents new bookings for that window)
 */
router.post('/blocked-slots', merchantAuth, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as any).merchant?._id;
    const { storeId, serviceId, date, startTime, endTime, reason, isAllDay, recurring } = req.body;

    if (!storeId || !date) {
      return res.status(400).json({ success: false, message: 'storeId and date are required' });
    }

    if (!isAllDay && (!startTime || !endTime)) {
      return res
        .status(400)
        .json({ success: false, message: 'startTime and endTime required unless isAllDay is true' });
    }

    // Verify merchant owns this store
    const store = await Store.findOne({ _id: storeId, merchant: merchantId }).select('_id').lean();
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found or unauthorized' });
    }

    const slot = await BlockedSlot.create({
      merchantId,
      storeId: new mongoose.Types.ObjectId(storeId),
      serviceId: serviceId ? new mongoose.Types.ObjectId(serviceId) : null,
      date: new Date(date),
      startTime: isAllDay ? '00:00' : startTime,
      endTime: isAllDay ? '23:59' : endTime,
      reason,
      isAllDay: !!isAllDay,
      recurring: recurring || undefined,
    });

    return res.status(201).json({ success: true, data: slot, message: 'Slot blocked successfully' });
  } catch (err: any) {
    logger.error('Error blocking slot:', err);
    return res.status(500).json({ success: false, message: 'Failed to block slot' });
  }
});

/**
 * DELETE /api/merchant/services/blocked-slots/:id
 * Unblock a previously blocked slot
 */
router.delete('/blocked-slots/:id', merchantAuth, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as any).merchant?._id;
    const slot = await BlockedSlot.findOneAndDelete({
      _id: req.params.id,
      merchantId, // Ensure merchant can only delete their own
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Blocked slot not found' });
    }

    return res.json({ success: true, message: 'Slot unblocked successfully' });
  } catch (err: any) {
    logger.error('Error unblocking slot:', err);
    return res.status(500).json({ success: false, message: 'Failed to unblock slot' });
  }
});

export default router;
