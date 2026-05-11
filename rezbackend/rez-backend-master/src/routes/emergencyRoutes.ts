// @ts-nocheck
import express from 'express';
import {
  getEmergencyContacts,
  getNearbyContacts,
  bookEmergencyService,
  getEmergencyBookingStatus,
  getUserEmergencyBookings,
  cancelEmergencyBooking,
  updateEmergencyBookingStatus,
  getActiveEmergencyBooking,
} from '../controllers/emergencyController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes - emergency contacts should be accessible without login
router.get('/contacts', getEmergencyContacts);
router.get('/contacts/nearby', getNearbyContacts);

// Protected routes (require authentication)
router.post('/book', authenticate, bookEmergencyService);
router.get('/active', authenticate, getActiveEmergencyBooking);
router.get('/bookings', authenticate, getUserEmergencyBookings);
router.get('/booking/:id', authenticate, getEmergencyBookingStatus);
router.put('/booking/:id/cancel', authenticate, cancelEmergencyBooking);

// Admin routes - require authentication AND admin role
router.put('/booking/:id/status', authenticate, requireAdmin, updateEmergencyBookingStatus);

export default router;
