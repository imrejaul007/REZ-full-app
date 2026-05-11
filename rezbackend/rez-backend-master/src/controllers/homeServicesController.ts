import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { ServiceCategory } from '../models/ServiceCategory';
import { Store } from '../models/Store';
import { HomeServiceCategory } from '../models/HomeServiceCategory';
import { HomeService } from '../models/HomeService';
import {
  HomeServiceBooking,
  IHomeServiceBooking,
  HomeServiceBookingStatus,
  IHomeServiceBookingModel,
} from '../models/HomeServiceBooking';
import { logger } from '../config/logger';
import { sendSuccess, sendError, sendNotFound, sendBadRequest } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { regionService, isValidRegion, RegionId } from '../services/regionService';
import * as crypto from 'crypto';

// ─── Category Endpoints ────────────────────────────────────────────────────────

/**
 * Get home services categories for homepage section
 * GET /api/home-services/categories
 */
export const getHomeServicesCategories = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Prefer dedicated HomeServiceCategory model, fall back to ServiceCategory
    const dedicatedCategories = await HomeServiceCategory.find({ isActive: true }).sort({ sortOrder: 1 }).lean();

    if (dedicatedCategories.length > 0) {
      const transformed = dedicatedCategories.map((cat) => ({
        id: cat.slug,
        title: cat.name,
        icon: cat.icon,
        color: cat.metadata?.color || '#3B82F6',
        cashback: cat.metadata?.cashbackPercentage,
        description: cat.description,
      }));
      return sendSuccess(res, transformed, 'Home services categories fetched successfully');
    }

    // Fallback to ServiceCategory
    const categories = await ServiceCategory.find({
      isActive: true,
      slug: { $in: ['repair', 'cleaning', 'painting', 'carpentry', 'plumbing', 'electrical'] },
    })
      .select('name slug icon iconType cashbackPercentage serviceCount metadata')
      .sort({ sortOrder: 1 })
      .lean();

    const transformed = categories.map((cat) => ({
      id: cat.slug,
      title: cat.name,
      icon: cat.icon,
      iconType: cat.iconType || 'emoji',
      color: cat.metadata?.color || '#3B82F6',
      count: `${cat.serviceCount || 0}+ services`,
      cashback: cat.cashbackPercentage,
    }));

    return sendSuccess(res, transformed, 'Home services categories fetched successfully');
  } catch (error: any) {
    logger.error('Error fetching home services categories:', error);
    return sendError(res, 'Failed to fetch home services categories', 500);
  }
});

// ─── Service Listing Endpoints ─────────────────────────────────────────────────

/**
 * Get featured home services for homepage section
 * GET /api/home-services/featured
 */
export const getFeaturedHomeServices = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { limit = '6' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Try dedicated HomeService model first
    const dedicatedServices = await HomeService.find({ isFeatured: true }).limit(limitNum).lean();

    if (dedicatedServices.length > 0) {
      return sendSuccess(res, dedicatedServices, 'Featured home services fetched successfully');
    }

    // Fallback to Product-based services
    const regionHeader = req.headers['x-rez-region'] as string;
    const region: RegionId | undefined =
      regionHeader && isValidRegion(regionHeader) ? (regionHeader as RegionId) : undefined;

    const homeServicesCategory = await ServiceCategory.findOne({ slug: 'home-services' }).lean();
    if (!homeServicesCategory) {
      return sendSuccess(res, [], 'No home services found');
    }

    const childCategories = await ServiceCategory.find({
      parentCategory: homeServicesCategory._id,
      isActive: true,
    })
      .select('_id')
      .lean();

    const categoryIds = [homeServicesCategory._id, ...childCategories.map((c) => c._id)];

    const query: any = {
      productType: 'service',
      isActive: true,
      isFeatured: true,
      isDeleted: { $ne: true },
      $or: [{ serviceCategory: { $in: categoryIds } }, { 'serviceDetails.serviceType': 'home' }],
    };

    if (region) {
      const regionFilter = regionService.getStoreFilter(region);
      const storesInRegion = await Store.find({ isActive: true, ...regionFilter })
        .select('_id')
        .lean();
      const storeIds = storesInRegion.map((s: any) => s._id);
      query.store = { $in: storeIds };
    }

    const services = await Product.find(query)
      .populate('store', 'name logo location contact operationalInfo')
      .populate('serviceCategory', 'name icon cashbackPercentage slug')
      .sort({ 'ratings.average': -1, 'analytics.purchases': -1 })
      .limit(limitNum)
      .lean();

    return sendSuccess(res, services, 'Featured home services fetched successfully');
  } catch (error: any) {
    logger.error('Error fetching featured home services:', error);
    return sendError(res, 'Failed to fetch featured home services', 500);
  }
});

/**
 * Get home services by category slug
 * GET /api/home-services?category=&location=
 */
export const getHomeServices = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { category, location, page = '1', limit = '20', sortBy = 'rating' } = req.query;

    // Use dedicated HomeService model when category is provided
    if (category) {
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const query: any = { categorySlug: category as string, isActive: true };

      // Location filter: match against serviceAreas (city/pincode)
      if (location) {
        const loc = (location as string).toUpperCase();
        query.$or = [{ serviceAreas: { $in: [loc] } }, { 'address.city': { $regex: location, $options: 'i' } }];
      }

      let sortOptions: any;
      switch (sortBy) {
        case 'price_low':
          sortOptions = { basePrice: 1 };
          break;
        case 'price_high':
          sortOptions = { basePrice: -1 };
          break;
        case 'rating':
          sortOptions = { 'ratings.average': -1 };
          break;
        case 'popular':
          sortOptions = { 'ratings.count': -1 };
          break;
        default:
          sortOptions = { 'ratings.average': -1 };
      }

      const [services, total] = await Promise.all([
        HomeService.find(query)
          .populate('category', 'name slug icon metadata')
          .populate('merchantId', 'name logo phone')
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        HomeService.countDocuments(query),
      ]);

      return sendSuccess(
        res,
        {
          services,
          pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
        },
        'Home services fetched successfully',
      );
    }

    // No category filter: return all services (dedicated model)
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const query: any = { isActive: true };
    if (location) {
      const loc = (location as string).toUpperCase();
      query.$or = [{ serviceAreas: { $in: [loc] } }, { 'address.city': { $regex: location, $options: 'i' } }];
    }

    const [services, total] = await Promise.all([
      HomeService.find(query)
        .populate('category', 'name slug icon')
        .populate('merchantId', 'name logo phone')
        .sort({ 'ratings.average': -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      HomeService.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        services,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
      'Home services fetched successfully',
    );
  } catch (error: any) {
    logger.error('Error fetching home services:', error);
    return sendError(res, 'Failed to fetch home services', 500);
  }
});

/**
 * Get home services by category slug (explicit route)
 * GET /api/home-services/category/:slug
 */
export const getHomeServicesByCategory = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { page = '1', limit = '20', sortBy = 'rating', minPrice, maxPrice, rating } = req.query;

    // Validate category exists
    const category = await HomeServiceCategory.findOne({ slug, isActive: true }).lean();
    if (!category) {
      return sendNotFound(res, 'Category not found');
    }

    const query: any = { categorySlug: slug, isActive: true };

    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }
    if (rating) {
      query['ratings.average'] = { $gte: Number(rating) };
    }

    let sortOptions: any;
    switch (sortBy) {
      case 'price_low':
        sortOptions = { basePrice: 1 };
        break;
      case 'price_high':
        sortOptions = { basePrice: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { 'ratings.average': -1 };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      HomeService.find(query)
        .populate('merchantId', 'name logo phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      HomeService.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        services,
        category: { id: category._id, name: category.name, slug: category.slug, icon: category.icon },
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
      'Home services fetched successfully',
    );
  } catch (error: any) {
    logger.error('Error fetching home services by category:', error);
    return sendError(res, 'Failed to fetch home services', 500);
  }
});

/**
 * Get home services stats for homepage
 * GET /api/home-services/stats
 */
export const getHomeServicesStats = asyncHandler(async (req: Request, res: Response) => {
  try {
    const [serviceCount, merchantCount, maxCashback] = await Promise.all([
      HomeService.countDocuments({ isActive: true }),
      HomeService.distinct('merchantId', { isActive: true }),
      HomeServiceCategory.find({ isActive: true }).sort({ 'metadata.cashbackPercentage': -1 }).limit(1).lean(),
    ]);

    return sendSuccess(
      res,
      {
        serviceCount,
        merchantCount: merchantCount.length || 0,
        maxCashback: maxCashback[0]?.metadata?.cashbackPercentage || 20,
        sameDayService: true,
      },
      'Home services stats fetched successfully',
    );
  } catch (error: any) {
    logger.error('Error fetching home services stats:', error);
    return sendError(res, 'Failed to fetch home services stats', 500);
  }
});

/**
 * Get popular home services (for homepage section)
 * GET /api/home-services/popular
 */
export const getPopularHomeServices = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const services = await HomeService.find({ isActive: true })
      .populate('category', 'name slug icon')
      .populate('merchantId', 'name logo phone')
      .sort({ 'ratings.count': -1, 'ratings.average': -1 })
      .limit(limitNum)
      .lean();

    return sendSuccess(res, services, 'Popular home services fetched successfully');
  } catch (error: any) {
    logger.error('Error fetching popular home services:', error);
    return sendError(res, 'Failed to fetch popular home services', 500);
  }
});

// ─── Booking Endpoints ─────────────────────────────────────────────────────────

/**
 * Create a home service booking
 * POST /api/home-services/book
 */
export const createHomeServiceBooking = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return sendError(res, 'Authentication required', 401);

    const { serviceId, address, scheduledDate, scheduledTime, notes, paymentMethod = 'cash' } = req.body;

    // Validate required fields
    if (!serviceId || !address || !scheduledDate || !scheduledTime) {
      return sendBadRequest(res, 'serviceId, address, scheduledDate, and scheduledTime are required');
    }

    if (!address.name || !address.phone || !address.addressLine1 || !address.city || !address.pincode) {
      return sendBadRequest(res, 'Address must include name, phone, addressLine1, city, and pincode');
    }

    // Fetch service
    const service = await HomeService.findById(serviceId).lean();
    if (!service || !service.isActive) {
      return sendNotFound(res, 'Service not found or inactive');
    }

    // Check if slot is already booked
    const existingBooking = await HomeServiceBooking.findOne({
      serviceId: service._id,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      status: { $nin: ['cancelled'] },
    });
    if (existingBooking) {
      return sendBadRequest(res, 'This time slot is already booked. Please choose a different time.');
    }

    // Generate booking ID
    const bookingId = `HSB-${Date.now()}-${crypto.randomUUID().replace('-', '').substring(0, 6).toUpperCase()}`;

    const booking = await HomeServiceBooking.create({
      bookingId,
      userId,
      serviceId: service._id,
      merchantId: service.merchantId,
      categorySlug: service.categorySlug,
      address,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      status: 'pending',
      price: service.basePrice,
      priceType: service.priceType,
      duration: service.duration,
      notes,
      customerPhone: address.phone,
      paymentStatus: 'pending',
      paymentMethod,
      timeline: [
        {
          status: 'pending',
          message: 'Booking created and awaiting confirmation',
          timestamp: new Date(),
        },
      ],
    });

    await booking.populate('serviceId', 'name basePrice images duration priceType');
    await booking.populate('merchantId', 'name logo phone');

    logger.info(`[HOME SERVICE BOOKING] Created ${booking.bookingId} for service ${serviceId} by user ${userId}`);

    return sendSuccess(res, booking, 'Home service booked successfully', 201);
  } catch (error: any) {
    logger.error('Error creating home service booking:', error);
    return sendError(res, 'Failed to create booking', 500);
  }
});

/**
 * Get all bookings for the authenticated user
 * GET /api/home-services/bookings/user
 */
export const getUserHomeServiceBookings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return sendError(res, 'Authentication required', 401);

    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const query: any = { userId };
    if (status) query.status = status;

    const [bookings, total] = await Promise.all([
      HomeServiceBooking.find(query)
        .populate('serviceId', 'name basePrice images duration priceType categorySlug')
        .populate('merchantId', 'name logo phone')
        .populate('assignedStaffId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      HomeServiceBooking.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        bookings,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
      'User bookings fetched successfully',
    );
  } catch (error: any) {
    logger.error('Error fetching user bookings:', error);
    return sendError(res, 'Failed to fetch bookings', 500);
  }
});

/**
 * Get a single booking by ID
 * GET /api/home-services/bookings/:id
 */
export const getHomeServiceBookingById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const booking = await HomeServiceBooking.findOne({ _id: id, userId })
      .populate('serviceId', 'name basePrice images duration priceType includes exclusions categorySlug')
      .populate('merchantId', 'name logo phone email')
      .populate('assignedStaffId', 'name phone')
      .lean();

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    return sendSuccess(res, booking, 'Booking fetched successfully');
  } catch (error: any) {
    logger.error('Error fetching booking:', error);
    return sendError(res, 'Failed to fetch booking', 500);
  }
});

/**
 * Update booking status
 * PATCH /api/home-services/bookings/:id/status
 */
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).userId;
    const isAdmin = (req as any).isAdmin;

    const VALID_TRANSITIONS: Record<HomeServiceBookingStatus, HomeServiceBookingStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['assigned', 'cancelled'],
      assigned: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!status) return sendBadRequest(res, 'status is required');
    if (!['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return sendBadRequest(res, 'Invalid status value');
    }

    const booking = await HomeServiceBooking.findById(id);
    if (!booking) return sendNotFound(res, 'Booking not found');

    // Only allow user to cancel their own booking
    if (status === 'cancelled' && !isAdmin && booking.userId.toString() !== userId) {
      return sendError(res, 'Not authorized to cancel this booking', 403);
    }

    const allowed = VALID_TRANSITIONS[booking.status] ?? [];
    if (!allowed.includes(status as HomeServiceBookingStatus)) {
      return sendBadRequest(
        res,
        `Cannot transition from "${booking.status}" to "${status}". Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const messages: Record<HomeServiceBookingStatus, string> = {
      pending: 'Booking created',
      confirmed: 'Booking confirmed by merchant',
      assigned: 'Service professional assigned',
      in_progress: 'Service in progress',
      completed: 'Service completed successfully',
      cancelled: 'Booking cancelled',
    };

    booking.status = status;
    await booking.addTimelineEntry(
      status as HomeServiceBookingStatus,
      messages[status as HomeServiceBookingStatus],
      userId,
    );

    if (status === 'completed') booking.completedAt = new Date();
    if (status === 'cancelled') booking.cancelledAt = new Date();

    await booking.save();

    await booking.populate('serviceId', 'name basePrice images duration');
    await booking.populate('merchantId', 'name logo phone');
    await booking.populate('assignedStaffId', 'name phone');

    logger.info(`[HOME SERVICE BOOKING] Status updated ${booking.bookingId}: ${booking.status} -> ${status}`);

    return sendSuccess(res, booking, `Booking status updated to ${status}`);
  } catch (error: any) {
    logger.error('Error updating booking status:', error);
    return sendError(res, 'Failed to update booking status', 500);
  }
});

/**
 * Assign staff to a booking
 * POST /api/home-services/bookings/:id/assign-staff
 */
export const assignStaffToBooking = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { staffId, staffName, staffPhone } = req.body;
    const userId = (req as any).userId;

    if (!staffId && !staffName) {
      return sendBadRequest(res, 'staffId or staffName is required');
    }

    const booking = await HomeServiceBooking.findById(id);
    if (!booking) return sendNotFound(res, 'Booking not found');

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return sendBadRequest(res, `Cannot assign staff to a booking in "${booking.status}" status`);
    }

    booking.assignedStaffId = staffId || undefined;
    booking.assignedStaffName = staffName;
    booking.assignedStaffPhone = staffPhone;
    booking.status = 'assigned';
    await booking.addTimelineEntry('assigned', `Service professional ${staffName || 'assigned'}`, userId);

    await booking.save();
    await booking.populate('serviceId', 'name basePrice images duration');
    await booking.populate('assignedStaffId', 'name phone');

    logger.info(`[HOME SERVICE BOOKING] Staff assigned to ${booking.bookingId}: ${staffName}`);

    return sendSuccess(res, booking, 'Staff assigned to booking successfully');
  } catch (error: any) {
    logger.error('Error assigning staff to booking:', error);
    return sendError(res, 'Failed to assign staff', 500);
  }
});

/**
 * Cancel a booking
 * POST /api/home-services/bookings/:id/cancel
 */
export const cancelHomeServiceBooking = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).userId;
    const isAdmin = (req as any).isAdmin;

    const booking = await HomeServiceBooking.findById(id);
    if (!booking) return sendNotFound(res, 'Booking not found');

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return sendBadRequest(res, `Cannot cancel a booking that is already "${booking.status}"`);
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by user';
    booking.cancelledBy = isAdmin ? 'merchant' : 'user';
    booking.cancelledAt = new Date();
    await booking.addTimelineEntry('cancelled', `Booking cancelled: ${reason || 'No reason provided'}`, userId);

    await booking.save();

    logger.info(`[HOME SERVICE BOOKING] Cancelled ${booking.bookingId} by user ${userId}`);

    return sendSuccess(res, booking, 'Booking cancelled successfully');
  } catch (error: any) {
    logger.error('Error cancelling booking:', error);
    return sendError(res, 'Failed to cancel booking', 500);
  }
});

export default {
  getHomeServicesCategories,
  getFeaturedHomeServices,
  getHomeServices,
  getHomeServicesByCategory,
  getHomeServicesStats,
  getPopularHomeServices,
  createHomeServiceBooking,
  getUserHomeServiceBookings,
  getHomeServiceBookingById,
  updateBookingStatus,
  assignStaffToBooking,
  cancelHomeServiceBooking,
};
