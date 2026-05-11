// @ts-nocheck
import { Router, Request, Response } from 'express';
import {
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
} from '../controllers/homeServicesController';
import { optionalAuth, authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../config/logger';

const router = Router();

// ─── Category Endpoints ─────────────────────────────────────────────────────────

/**
 * GET /api/home-services/categories
 * Public — list all active home service categories
 */
router.get('/categories', optionalAuth, getHomeServicesCategories);

/**
 * GET /api/home-services/featured
 * Public — featured home services for homepage
 */
router.get('/featured', optionalAuth, getFeaturedHomeServices);

/**
 * GET /api/home-services/popular
 * Public — popular home services
 */
router.get('/popular', optionalAuth, getPopularHomeServices);

/**
 * GET /api/home-services/stats
 * Public — home services platform statistics
 */
router.get('/stats', optionalAuth, getHomeServicesStats);

/**
 * GET /api/home-services
 * Public — list home services with optional category & location filters
 * Query params: category, location, page, limit, sortBy
 */
router.get('/', optionalAuth, getHomeServices);

/**
 * GET /api/home-services/category/:slug
 * Public — list services within a specific category
 */
router.get('/category/:slug', optionalAuth, getHomeServicesByCategory);

// ─── Booking Endpoints ────────────────────────────────────────────────────────

/**
 * POST /api/home-services/book
 * Private — create a new home service booking
 * Body: { serviceId, address, scheduledDate, scheduledTime, notes, paymentMethod }
 */
router.post('/book', authenticate, createHomeServiceBooking);

/**
 * GET /api/home-services/bookings/user
 * Private — get all bookings for the authenticated user
 * Query params: status (optional), page, limit
 */
router.get('/bookings/user', authenticate, getUserHomeServiceBookings);

/**
 * GET /api/home-services/bookings/:id
 * Private — get a single booking by ID
 */
router.get('/bookings/:id', authenticate, getHomeServiceBookingById);

/**
 * PATCH /api/home-services/bookings/:id/status
 * Private — update booking status (e.g. cancel, complete)
 * Body: { status: 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' }
 */
router.patch('/bookings/:id/status', authenticate, updateBookingStatus);

/**
 * POST /api/home-services/bookings/:id/assign-staff
 * Private — assign a staff member to a booking
 * Body: { staffId, staffName, staffPhone }
 */
router.post('/bookings/:id/assign-staff', authenticate, assignStaffToBooking);

/**
 * POST /api/home-services/bookings/:id/cancel
 * Private — cancel a booking
 * Body: { reason } (optional)
 */
router.post('/bookings/:id/cancel', authenticate, cancelHomeServiceBooking);

export default router;
